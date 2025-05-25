// Version control system integration
import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";

interface GitHubIntegrationConfig {
  appId: string;
  privateKey: string;
  clientId: string;
  clientSecret: string;
  installationId?: string;
}

interface GitCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  url: string;
}

interface GitRepository {
  id: string;
  name: string;
  owner: string;
  url: string;
  description?: string;
  private: boolean;
  defaultBranch: string;
}

interface GitBranch {
  name: string;
  isDefault: boolean;
  protected: boolean;
}

export class GitHubIntegration {
  private octokit: Octokit;
  
  constructor(config: GitHubIntegrationConfig) {
    this.octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: config.appId,
        privateKey: config.privateKey,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        installationId: config.installationId,
      },
    });
  }

  // Get user repositories
  async getRepositories(username: string): Promise<GitRepository[]> {
    const { data } = await this.octokit.rest.repos.listForUser({
      username,
      sort: "updated",
      per_page: 100,
    });

    return data.map(repo => ({
      id: repo.id.toString(),
      name: repo.name,
      owner: repo.owner.login,
      url: repo.html_url,
      description: repo.description || undefined,
      private: repo.private,
      defaultBranch: repo.default_branch,
    }));
  }

  // Get branches for a repository
  async getBranches(owner: string, repo: string): Promise<GitBranch[]> {
    const { data } = await this.octokit.rest.repos.listBranches({
      owner,
      repo,
    });

    return data.map(branch => ({
      name: branch.name,
      isDefault: false, // Will set default later
      protected: branch.protected || false,
    }));
  }

  // Get recent commits for a repository
  async getCommits(owner: string, repo: string, branch?: string): Promise<GitCommit[]> {
    const { data } = await this.octokit.rest.repos.listCommits({
      owner,
      repo,
      sha: branch,
    });

    return data.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        name: commit.commit.author.name,
        email: commit.commit.author.email,
        date: commit.commit.author.date,
      },
      url: commit.html_url,
    }));
  }

  // Create a new repository
  async createRepository(name: string, options?: { description?: string; private?: boolean }): Promise<GitRepository> {
    const { data } = await this.octokit.rest.repos.createForAuthenticatedUser({
      name,
      description: options?.description,
      private: options?.private,
    });

    return {
      id: data.id.toString(),
      name: data.name,
      owner: data.owner.login,
      url: data.html_url,
      description: data.description || undefined,
      private: data.private,
      defaultBranch: data.default_branch,
    };
  }

  // Create a new file in a repository
  async createFile(owner: string, repo: string, path: string, content: string, message: string): Promise<{ sha: string; url: string }> {
    const { data } = await this.octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
    });

    return {
      sha: data.content.sha,
      url: data.content.html_url,
    };
  }
}
