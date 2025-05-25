"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, GitBranch, GitCommit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Repository {
  id: string;
  name: string;
  owner: string;
  url: string;
  description?: string;
  defaultBranch: string;
}

interface Branch {
  name: string;
  isDefault: boolean;
  protected: boolean;
}

interface Commit {
  sha: string;
  message: string;
  author: {
    name: string;
    date: string;
  };
  url: string;
}

const connectRepoSchema = z.object({
  username: z.string().min(1, {
    message: "Username is required.",
  }),
});

type ConnectRepoValues = z.infer<typeof connectRepoSchema>;

export default function RepositoriesPage() {
  const { toast } = useToast();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingRepos, setIsFetchingRepos] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConnectRepoValues>({
    resolver: zodResolver(connectRepoSchema),
    defaultValues: {
      username: "",
    },
  });

  const fetchRepositories = async (username: string) => {
    setIsFetchingRepos(true);
    try {
      const response = await fetch(`/api/version-control?username=${username}`);
      if (!response.ok) {
        throw new Error("Failed to fetch repositories");
      }
      const data = await response.json();
      setRepositories(data.repositories);
    } catch (error) {
      console.error("Error fetching repositories:", error);
      toast({
        title: "Error fetching repositories",
        description: "There was an error fetching repositories. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingRepos(false);
    }
  };

  const fetchBranches = async (repo: Repository) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/version-control?action=branches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner: repo.owner,
          repo: repo.name,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch branches");
      }
      const data = await response.json();
      setBranches(data.branches);
      setSelectedBranch(repo.defaultBranch);
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast({
        title: "Error fetching branches",
        description: "There was an error fetching branches. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCommits = async (repo: Repository, branch: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/version-control?action=commits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner: repo.owner,
          repo: repo.name,
          branch,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch commits");
      }
      const data = await response.json();
      setCommits(data.commits);
    } catch (error) {
      console.error("Error fetching commits:", error);
      toast({
        title: "Error fetching commits",
        description: "There was an error fetching commits. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ConnectRepoValues) => {
    await fetchRepositories(data.username);
  };

  useEffect(() => {
    if (selectedRepo && selectedBranch) {
      fetchCommits(selectedRepo, selectedBranch);
    }
  }, [selectedRepo, selectedBranch]);

  const handleRepoSelect = (repo: Repository) => {
    setSelectedRepo(repo);
    setBranches([]);
    setCommits([]);
    fetchBranches(repo);
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBranch(e.target.value);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="rounded-md border p-6">
            <h2 className="text-xl font-semibold mb-4">Connect Repository</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  GitHub Username
                </label>
                <input
                  id="username"
                  {...register("username")}
                  className="w-full rounded-md border p-2"
                  placeholder="Enter GitHub username"
                />
                {errors.username && (
                  <p className="text-sm text-red-500">{errors.username.message}</p>
                )}
              </div>

              <Button type="submit" disabled={isFetchingRepos}>
                {isFetchingRepos ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  "Fetch Repositories"
                )}
              </Button>
            </form>
          </div>

          {repositories.length > 0 && (
            <div className="rounded-md border p-6">
              <h2 className="text-xl font-semibold mb-4">Repositories</h2>
              <div className="h-80 overflow-y-auto">
                {repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className={`p-3 mb-2 rounded-md cursor-pointer ${
                      selectedRepo?.id === repo.id
                        ? "bg-primary/10 border-primary/20 border"
                        : "hover:bg-gray-100 border"
                    }`}
                    onClick={() => handleRepoSelect(repo)}
                  >
                    <h3 className="font-medium">{repo.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {repo.description || "No description"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {selectedRepo && (
            <>
              <div className="rounded-md border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {selectedRepo.name}
                  </h2>
                  <div className="flex items-center">
                    <GitBranch className="h-4 w-4 mr-2" />
                    <select
                      value={selectedBranch}
                      onChange={handleBranchChange}
                      className="rounded-md border px-2 py-1 text-sm"
                      disabled={branches.length === 0}
                    >
                      {branches.length === 0 ? (
                        <option>Loading branches...</option>
                      ) : (
                        branches.map((branch) => (
                          <option key={branch.name} value={branch.name}>
                            {branch.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="font-medium mb-2 flex items-center">
                    <GitCommit className="h-4 w-4 mr-2" />
                    Recent Commits
                  </h3>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : commits.length > 0 ? (
                    <div className="h-64 overflow-y-auto border rounded-md">
                      {commits.map((commit) => (
                        <div
                          key={commit.sha}
                          className="p-3 border-b last:border-b-0"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {commit.message.split("\n")[0]}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {commit.author.name} · {new Date(commit.author.date).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                              {commit.sha.substring(0, 7)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No commits found for this branch.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
