'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export default function AdvancedWorkflowsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-2">Advanced AI Workflows</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Leverage AI-driven workflows to boost your development productivity
      </p>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="usage">Usage Examples</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About Advanced AI Workflows</CardTitle>
              <CardDescription>
                Next-generation AI-driven workflows for modern development
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Advanced AI Workflows provide powerful automation tools that go beyond 
                traditional AI assistants. By connecting specialized AI nodes together, 
                you can create complex, intelligent pipelines that optimize every 
                stage of your development process.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">
                      Natural Language Code Generation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-muted-foreground">
                      Transform natural language descriptions into production-ready code 
                      with context-aware generation that understands your project structure.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">
                      AI-Powered Debugging
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-muted-foreground">
                      Automatically analyze error messages, identify root causes, and 
                      suggest fixes with detailed explanations to solve complex bugs quickly.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">
                      Predictive Resource Optimization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-muted-foreground">
                      Analyze code for potential performance bottlenecks and resource usage issues, 
                      then recommend optimizations with predicted impact.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Natural Language Code Generation</CardTitle>
              <CardDescription>
                Convert high-level descriptions into functional code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The Natural Language Code Generation node provides an advanced interface between
                human language and programming languages. It can:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Generate code from feature descriptions, user stories, or requirements</li>
                <li>Adapt to your codebase's style, patterns, and naming conventions</li>
                <li>Support multiple languages and frameworks</li>
                <li>Generate tests alongside implementation</li>
                <li>Provide explanations for the generated code</li>
              </ul>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Configuration Options</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><span className="font-semibold">Language</span> - Target programming language</li>
                  <li><span className="font-semibold">Framework</span> - Target framework or library</li>
                  <li><span className="font-semibold">Default Description</span> - Fallback if no input is provided</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Debugging Assistant</CardTitle>
              <CardDescription>
                Intelligent error analysis and resolution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The Debugging Assistant node uses advanced AI techniques to:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Parse and interpret error messages and stack traces</li>
                <li>Identify root causes through static analysis and pattern recognition</li>
                <li>Generate fixes with detailed explanations</li>
                <li>Learn from common bugs in similar codebases</li>
                <li>Handle complex errors across multiple files</li>
              </ul>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Configuration Options</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><span className="font-semibold">Default Code</span> - Sample code to analyze if no input is provided</li>
                  <li><span className="font-semibold">Default Error</span> - Sample error message if no input is provided</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Predictive Resource Optimizer</CardTitle>
              <CardDescription>
                Proactive performance and resource usage improvements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The Resource Optimizer node analyzes code to:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Identify memory leaks, excessive CPU usage, and other resource issues</li>
                <li>Predict performance impact of different implementation approaches</li>
                <li>Recommend optimization strategies with quantifiable benefits</li>
                <li>Provide language and framework-specific optimizations</li>
                <li>Balance optimization with code readability</li>
              </ul>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Configuration Options</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><span className="font-semibold">Target Metrics</span> - Resource types to optimize (memory, CPU, network, storage)</li>
                  <li><span className="font-semibold">Default Code</span> - Sample code to analyze if no input is provided</li>
                  <li><span className="font-semibold">Language</span> - Programming language of the code</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Usage Examples Tab */}
        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Complete Development Workflow</CardTitle>
              <CardDescription>
                Generate, debug, and optimize code in one workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                This example shows how to build a complete development workflow that:
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Takes a feature description as input</li>
                <li>Generates code from the description</li>
                <li>Checks the code for errors and fixes them</li>
                <li>Optimizes the code for better performance</li>
                <li>Outputs the final, optimized code</li>
              </ol>
              
              <div className="mt-4 p-4 bg-muted rounded-md">
                <h4 className="font-medium mb-2">Workflow Steps</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Add an <Badge>Input</Badge> node with the name "description"</li>
                  <li>Add a <Badge variant="outline" className="bg-emerald-50">Code Gen</Badge> node and connect it to the input</li>
                  <li>Add a <Badge variant="outline" className="bg-red-50">Debug Assistant</Badge> node and connect it to the Code Gen node</li>
                  <li>Add a <Badge variant="outline" className="bg-indigo-50">Resource Optimizer</Badge> node and connect it to the Debug Assistant</li>
                  <li>Add an <Badge>Output</Badge> node named "optimizedCode" and connect it to the Resource Optimizer</li>
                </ol>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Code Review & Improvement Workflow</CardTitle>
              <CardDescription>
                Automatically review and enhance existing code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                This workflow takes existing code as input and:
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Analyzes it for potential bugs and errors</li>
                <li>Fixes any issues found</li>
                <li>Optimizes the code for better performance</li>
                <li>Outputs the improved code with explanations</li>
              </ol>
              
              <div className="mt-4 p-4 bg-muted rounded-md">
                <h4 className="font-medium mb-2">Workflow Steps</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Add an <Badge>Input</Badge> node with the name "code"</li>
                  <li>Add a <Badge variant="outline" className="bg-red-50">Debug Assistant</Badge> node and connect it to the input</li>
                  <li>Add a <Badge variant="outline" className="bg-indigo-50">Resource Optimizer</Badge> node and connect it to the Debug Assistant</li>
                  <li>Add an <Badge>Output</Badge> node named "improvedCode" and connect it to the Resource Optimizer</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                Common questions about Advanced AI Workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="q1">
                  <AccordionTrigger>
                    How do Advanced AI Workflows differ from regular AI skills?
                  </AccordionTrigger>
                  <AccordionContent>
                    Advanced AI Workflows provide specialized, task-specific intelligence that goes beyond
                    general-purpose AI assistants. They leverage fine-tuned models, domain-specific
                    knowledge, and optimized processing pipelines to deliver superior results for
                    development tasks. They can also be connected together to form complex processing
                    chains that handle multi-step tasks automatically.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="q2">
                  <AccordionTrigger>
                    What programming languages are supported?
                  </AccordionTrigger>
                  <AccordionContent>
                    Our Advanced AI Workflows currently support TypeScript, JavaScript, Python, Java, C#,
                    and Ruby, with more languages coming soon. The Natural Language Code Generator and
                    Resource Optimizer have the most extensive language support, while the Debugging
                    Assistant has deeper capabilities for TypeScript, JavaScript, and Python.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="q3">
                  <AccordionTrigger>
                    Can I customize the AI behavior for my team's needs?
                  </AccordionTrigger>
                  <AccordionContent>
                    Yes! Each workflow node includes configuration options to tailor the AI's behavior.
                    Additionally, Enterprise users can provide custom examples and coding standards to
                    further align the AI with their team's practices. The system will also learn from
                    your team's interactions over time, becoming more aligned with your specific needs.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="q4">
                  <AccordionTrigger>
                    How secure is my code when using these workflows?
                  </AccordionTrigger>
                  <AccordionContent>
                    We take security seriously. All code processed by our Advanced AI Workflows is
                    encrypted in transit and at rest. We do not store your code or use it to train
                    our models unless you explicitly opt in. Enterprise customers can also deploy
                    these capabilities in their own secure environments for maximum data protection.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="q5">
                  <AccordionTrigger>
                    How can I integrate these workflows with my existing tools?
                  </AccordionTrigger>
                  <AccordionContent>
                    Our Advanced AI Workflows offer integration options for popular development
                    environments and CI/CD pipelines. You can trigger workflows via API, integrate
                    them into your IDE with our extension, or set up automated runs as part of your
                    build process. Check out our Integrations documentation for detailed guides.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
