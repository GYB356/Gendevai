"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const createTeamSchema = z.object({
  name: z.string().min(3, {
    message: "Team name must be at least 3 characters.",
  }),
  description: z.string().optional(),
});

type CreateTeamValues = z.infer<typeof createTeamSchema>;

interface Team {
  id: string;
  name: string;
  description?: string;
  members: {
    id: string;
    userId: string;
    role: string;
    user: {
      name?: string;
      email: string;
    };
  }[];
}

export default function TeamsPage() {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTeamValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/teams");
      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }
      const data = await response.json();
      setTeams(data.teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast({
        title: "Error fetching teams",
        description: "There was an error fetching your teams. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onCreateTeam = async (data: CreateTeamValues) => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create team");
      }

      const result = await response.json();
      setTeams([...teams, result.team]);
      setShowCreateForm(false);
      reset();
      toast({
        title: "Team created",
        description: "Your team has been created successfully.",
      });
    } catch (error) {
      console.error("Error creating team:", error);
      toast({
        title: "Error creating team",
        description: "There was an error creating your team. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </div>

      {showCreateForm && (
        <div className="rounded-md border p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Team</h2>
          <form onSubmit={handleSubmit(onCreateTeam)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Team Name
              </label>
              <input
                id="name"
                {...register("name")}
                className="w-full rounded-md border p-2"
                placeholder="Enter team name"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description (Optional)
              </label>
              <textarea
                id="description"
                {...register("description")}
                className="h-24 w-full rounded-md border p-2"
                placeholder="Describe your team's purpose"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Team"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  reset();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : teams.length > 0 ? (
          teams.map((team) => (
            <div
              key={team.id}
              className="rounded-md border p-4 hover:border-gray-400 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{team.name}</h3>
                  {team.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {team.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-1" />
                  {team.members.length}
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm" className="w-full">
                  View Team
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No teams found. Create a team to get started.
          </div>
        )}
      </div>
    </div>
  );
}
