import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock projects data (in a real app, this would come from the database)
const projects = [
  {
    id: "1",
    name: "Web Application",
    description: "A responsive web application built with React and TypeScript",
    tasks: 5,
    createdAt: "2023-03-15",
  },
  {
    id: "2",
    name: "Mobile App",
    description: "Cross-platform mobile application with React Native",
    tasks: 3,
    createdAt: "2023-04-20",
  },
  {
    id: "3",
    name: "API Service",
    description: "RESTful API service built with Node.js and Express",
    tasks: 2,
    createdAt: "2023-05-10",
  },
];

export default function Projects() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <Link href="/dashboard/projects/new">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {projects.length > 0 ? (
          projects.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <div className="flex flex-col gap-2 rounded-lg border p-6 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{project.name}</h3>
                  <span className="text-sm text-muted-foreground">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-muted-foreground">{project.description}</p>
                <div className="mt-2 flex items-center text-sm text-muted-foreground">
                  <span>{project.tasks} tasks</span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-md border p-6">
            <p className="text-muted-foreground">No projects found.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Create a new project to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
