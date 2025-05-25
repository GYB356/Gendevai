import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@gendevai/database";
import { getServerSession } from "next-auth";

// Validation schema for team creation
const createTeamSchema = z.object({
  name: z.string().min(3, {
    message: "Team name must be at least 3 characters.",
  }),
  description: z.string().optional(),
});

// Validation schema for adding team members
const addMemberSchema = z.object({
  teamId: z.string(),
  email: z.string().email(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
});

// GET handler to fetch teams
export async function GET(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Find teams where user is a member
    const teamMembers = await prisma.teamMember.findMany({
      where: { userId: user.id },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const teams = teamMembers.map((member) => member.team);

    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

// POST handler to create a team or add a member
export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Handle team creation
    if (!action) {
      const parsedBody = createTeamSchema.safeParse(body);

      if (!parsedBody.success) {
        return NextResponse.json(
          { error: "Invalid request body", details: parsedBody.error.flatten() },
          { status: 400 }
        );
      }

      const { name, description } = parsedBody.data;

      // Create the team and add the current user as owner
      const team = await prisma.team.create({
        data: {
          name,
          description,
          members: {
            create: {
              userId: user.id,
              role: "OWNER",
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({ team });
    }

    // Handle adding a team member
    if (action === "add-member") {
      const parsedBody = addMemberSchema.safeParse(body);

      if (!parsedBody.success) {
        return NextResponse.json(
          { error: "Invalid request body", details: parsedBody.error.flatten() },
          { status: 400 }
        );
      }

      const { teamId, email, role } = parsedBody.data;

      // Check if the current user is an admin or owner of the team
      const currentMember = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: user.id,
          role: { in: ["OWNER", "ADMIN"] },
        },
      });

      if (!currentMember) {
        return NextResponse.json(
          { error: "You don't have permission to add members to this team" },
          { status: 403 }
        );
      }

      // Find the user to add
      const userToAdd = await prisma.user.findUnique({
        where: { email },
      });

      if (!userToAdd) {
        return NextResponse.json(
          { error: "User not found with the provided email" },
          { status: 404 }
        );
      }

      // Check if the user is already a member of the team
      const existingMember = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: userToAdd.id,
        },
      });

      if (existingMember) {
        return NextResponse.json(
          { error: "User is already a member of this team" },
          { status: 400 }
        );
      }

      // Add the user to the team
      const teamMember = await prisma.teamMember.create({
        data: {
          teamId,
          userId: userToAdd.id,
          role,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          team: true,
        },
      });

      return NextResponse.json({ teamMember });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error handling team operation:", error);
    return NextResponse.json(
      { error: "Failed to process team operation" },
      { status: 500 }
    );
  }
}
