import { NextResponse } from "next/server";
import { z } from "zod";
import { GitHubIntegration } from "@gendevai/ai-core";

// Environment variables validation
const getGitHubConfig = () => {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!appId || !privateKey || !clientId || !clientSecret) {
    throw new Error("GitHub integration configuration is incomplete");
  }

  return {
    appId,
    privateKey,
    clientId,
    clientSecret,
  };
};

// Validation schema for repository request
const repositoryRequestSchema = z.object({
  username: z.string(),
});

// Validation schema for branch request
const branchRequestSchema = z.object({
  owner: z.string(),
  repo: z.string(),
});

// Validation schema for commit request
const commitRequestSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  branch: z.string().optional(),
});

// Route handler for listing repositories
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    
    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }
    
    const githubConfig = getGitHubConfig();
    const github = new GitHubIntegration(githubConfig);
    
    const repositories = await github.getRepositories(username);
    
    return NextResponse.json({ repositories });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}

// Route handler for listing branches or commits
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    
    if (action === "branches") {
      const parsedBody = branchRequestSchema.safeParse(body);
      
      if (!parsedBody.success) {
        return NextResponse.json(
          { error: "Invalid request body", details: parsedBody.error.flatten() },
          { status: 400 }
        );
      }
      
      const { owner, repo } = parsedBody.data;
      const githubConfig = getGitHubConfig();
      const github = new GitHubIntegration(githubConfig);
      
      const branches = await github.getBranches(owner, repo);
      
      return NextResponse.json({ branches });
    } else if (action === "commits") {
      const parsedBody = commitRequestSchema.safeParse(body);
      
      if (!parsedBody.success) {
        return NextResponse.json(
          { error: "Invalid request body", details: parsedBody.error.flatten() },
          { status: 400 }
        );
      }
      
      const { owner, repo, branch } = parsedBody.data;
      const githubConfig = getGitHubConfig();
      const github = new GitHubIntegration(githubConfig);
      
      const commits = await github.getCommits(owner, repo, branch);
      
      return NextResponse.json({ commits });
    } else {
      return NextResponse.json(
        { error: "Invalid action specified" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error processing VCS request:", error);
    return NextResponse.json(
      { error: "Failed to process VCS request" },
      { status: 500 }
    );
  }
}
