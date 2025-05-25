import { prisma } from "./client";

/**
 * Seed script for development database
 * This script creates initial data for development purposes
 */
async function main() {
  console.log("🌱 Seeding database...");

  // Create a sample user
  const user = await prisma.user.upsert({
    where: { email: "demo@gendevai.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@gendevai.com",
      projects: {
        create: [
          {
            name: "Sample Project",
            description: "A sample project to demonstrate GenDevAI features",
            tasks: {
              create: [
                {
                  title: "Create a React component",
                  description: "Generate a button component with various states",
                  status: "PENDING",
                  codeGeneration: {
                    create: {
                      prompt: "Create a React button component with primary, secondary and disabled states",
                      status: "PENDING"
                    }
                  }
                },
                {
                  title: "Write unit tests",
                  description: "Generate unit tests for the button component",
                  status: "PENDING"
                }
              ]
            }
          }
        ]
      }
    },
  });

  console.log(`Created user: ${user.name} (${user.email})`);
  console.log("✅ Database seeded successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Error seeding database:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
