import { ReactNode } from "react";
import Link from "next/link";
import { 
  Code, 
  Home, 
  List, 
  LogOut, 
  Moon, 
  Settings, 
  Sun, 
  User, 
  GitBranch, 
  Users, 
  LineChart, 
  ClipboardCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold">GenDevAI</span>
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/profile">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">Profile</span>
              </Button>
            </Link>
            <Link href="/api/auth/signout">
              <Button variant="ghost" size="icon">
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Log out</span>
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="fixed top-16 z-30 -ml-2 hidden h-[calc(100vh-4rem)] w-full shrink-0 md:sticky md:block">
          <div className="h-full py-6 pr-6 lg:py-8">
            <nav className="flex flex-col gap-2">
              <Link href="/dashboard">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Home className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/dashboard/projects">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <List className="h-4 w-4" />
                  Projects
                </Button>
              </Link>
              <Link href="/dashboard/code-generator">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Code className="h-4 w-4" />
                  Code Generator
                </Button>
              </Link>
              <Link href="/dashboard/code-review">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Code Review
                </Button>
              </Link>
              <Link href="/dashboard/teams">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Users className="h-4 w-4" />
                  Teams
                </Button>
              </Link>
              <Link href="/dashboard/repositories">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <GitBranch className="h-4 w-4" />
                  Repositories
                </Button>
              </Link>
              <Link href="/dashboard/analytics">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <LineChart className="h-4 w-4" />
                  Analytics
                </Button>
              </Link>
              <Link href="/dashboard/settings">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </nav>
          </div>
        </aside>
        <main className="flex w-full flex-col overflow-hidden py-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function ThemeToggle() {
  return (
    <div className="flex items-center">
      <Button variant="ghost" size="icon" className="theme-toggle">
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
}
