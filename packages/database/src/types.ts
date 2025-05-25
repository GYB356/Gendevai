import { Prisma } from "@prisma/client";

export type UserWithProjects = Prisma.UserGetPayload<{
  include: {
    projects: true;
  };
}>;

export type ProjectWithTasks = Prisma.ProjectGetPayload<{
  include: {
    tasks: true;
  };
}>;

export type TaskWithCodeGeneration = Prisma.TaskGetPayload<{
  include: {
    codeGeneration: true;
  };
}>;

export type TaskWithCodeReview = Prisma.TaskGetPayload<{
  include: {
    codeReview: true;
  };
}>;

export type UserWithTeams = Prisma.UserGetPayload<{
  include: {
    teams: {
      include: {
        team: true;
      };
    };
  };
}>;

export type TeamWithMembers = Prisma.TeamGetPayload<{
  include: {
    members: {
      include: {
        user: true;
      };
    };
  };
}>;

export type ProjectWithRepositories = Prisma.ProjectGetPayload<{
  include: {
    repositories: true;
  };
}>;

export type UserWithSkills = Prisma.UserGetPayload<{
  include: {
    createdSkills: true;
    createdWorkflows: true;
  };
}>;

export type AISkillWithRatings = Prisma.AISkillGetPayload<{
  include: {
    ratings: true;
    usageStats: true;
    price: true;
  };
}>;

export type WorkflowWithNodes = Prisma.AgentWorkflowGetPayload<{
  include: {
    nodes: {
      include: {
        skill: true;
      };
    };
    executions: true;
  };
}>;
