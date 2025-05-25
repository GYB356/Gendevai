import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">GenDevAI</span>
          </div>
          <nav className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign up</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="container py-24 sm:py-32">
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Accelerate Your Development with{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI-Powered Tools
            </span>
          </h1>
          <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl">
            GenDevAI helps developers write better code faster. Generate code, automate tasks, and get intelligent assistance.
          </p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline">
                Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container py-16 sm:py-24">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-lg border p-6">
            <h3 className="text-xl font-bold">Code Generation</h3>
            <p className="text-muted-foreground">
              Generate high-quality code from natural language descriptions, saving time and reducing errors.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border p-6">
            <h3 className="text-xl font-bold">Automated Reviews</h3>
            <p className="text-muted-foreground">
              Get instant feedback on your code with AI-powered code reviews and quality checks.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border p-6">
            <h3 className="text-xl font-bold">Smart Documentation</h3>
            <p className="text-muted-foreground">
              Automatically generate and maintain documentation for your codebase.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} GenDevAI. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-sm text-muted-foreground hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:underline">
              Privacy
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:underline">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
