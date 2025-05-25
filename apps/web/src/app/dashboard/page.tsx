import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Link href="/dashboard/projects/new">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Recent Projects"
          description="View and manage your recent projects."
          href="/dashboard/projects"
        />
        <DashboardCard
          title="Code Generator"
          description="Generate code with AI assistance."
          href="/dashboard/code-generator"
        />
        <DashboardCard
          title="Tasks"
          description="View and manage your tasks."
          href="/dashboard/tasks"
        />
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold tracking-tight mb-4">Recent Activity</h2>
        <div className="rounded-md border">
          <div className="p-6">
            <p className="text-muted-foreground">No recent activity yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Your recent project and code generation activity will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="flex flex-col gap-2 rounded-lg border p-6 hover:bg-muted/50 transition-colors">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
