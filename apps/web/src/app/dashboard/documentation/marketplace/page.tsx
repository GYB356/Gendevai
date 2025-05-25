'use client';

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function DocumentationPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">GenDevAI Marketplace Documentation</h1>
        <p className="text-muted-foreground">
          Learn how to use the AI Skill Marketplace and build powerful workflows
        </p>
      </div>

      <Tabs defaultValue="getting-started" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="skills">Using Skills</TabsTrigger>
          <TabsTrigger value="workflows">Building Workflows</TabsTrigger>
          <TabsTrigger value="creating">Creating Skills</TabsTrigger>
        </TabsList>
        
        {/* Getting Started Tab */}
        <TabsContent value="getting-started" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to the GenDevAI Marketplace</CardTitle>
              <CardDescription>
                Your hub for AI-powered developer tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">What is the AI Skill Marketplace?</h3>
                <p>
                  The GenDevAI Marketplace is a platform where developers can discover, use, and create AI-powered skills for software development. These skills can help you automate tedious tasks, improve code quality, and increase productivity.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Key Features</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li><span className="font-medium">AI Skills</span>: Modular AI capabilities for specific tasks</li>
                  <li><span className="font-medium">Workflows</span>: Connect multiple skills for complex operations</li>
                  <li><span className="font-medium">Customization</span>: Create and share your own skills</li>
                  <li><span className="font-medium">Integration</span>: Use skills directly in your development workflow</li>
                </ul>
              </div>
              
              <div className="bg-muted p-4 rounded-md">
                <h3 className="text-lg font-medium mb-2">Quick Start</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Browse the marketplace to find skills that match your needs</li>
                  <li>Try out skills with the built-in execution interface</li>
                  <li>Create workflows to combine multiple skills</li>
                  <li>Save your favorite skills to your profile</li>
                </ol>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Marketplace Overview</CardTitle>
              <CardDescription>
                Understanding the different sections of the marketplace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Browse Skills</h3>
                <p>
                  The main marketplace page allows you to browse all available skills. You can filter by category, complexity, and verification status to find exactly what you need.
                </p>
                <div className="mt-2">
                  <img 
                    src="/docs/marketplace-browse.png" 
                    alt="Marketplace Browse" 
                    className="rounded-md border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Skill Detail Page</h3>
                <p>
                  Each skill has a detailed page where you can:
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Read about what the skill does</li>
                  <li>See examples of inputs and outputs</li>
                  <li>Execute the skill with your own inputs</li>
                  <li>View technical details and documentation</li>
                  <li>Purchase premium skills (if applicable)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Workflow Builder</h3>
                <p>
                  The workflow builder allows you to create complex pipelines by connecting multiple skills. You can use a visual interface to define the flow of data between skills.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Your Profile</h3>
                <p>
                  The profile page shows your purchased skills, created skills, and workflows. You can also view your transaction history here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Using Skills Tab */}
        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How to Use AI Skills</CardTitle>
              <CardDescription>
                Learn how to effectively use AI skills in your development process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Executing a Skill</h3>
                <p className="mb-2">
                  To use a skill, navigate to its detail page and follow these steps:
                </p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Fill in the required input fields based on the skill's requirements</li>
                  <li>Adjust the temperature slider to control creativity (higher values = more creative results)</li>
                  <li>Click "Execute Skill" to run the AI processing</li>
                  <li>View the results in the output section</li>
                </ol>
                <p className="mt-2">
                  You can save outputs, try different inputs, or use the provided examples to understand how the skill works.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Understanding Skill Categories</h3>
                <p className="mb-2">
                  Skills are organized into categories to help you find what you need:
                </p>
                <ul className="space-y-2">
                  <li><span className="font-medium">Code Generation</span>: Create new code based on requirements</li>
                  <li><span className="font-medium">Code Review</span>: Analyze existing code for issues</li>
                  <li><span className="font-medium">Refactoring</span>: Improve code structure without changing behavior</li>
                  <li><span className="font-medium">Testing</span>: Generate test cases and test code</li>
                  <li><span className="font-medium">Documentation</span>: Create docs, comments, and explanations</li>
                  <li><span className="font-medium">Optimization</span>: Improve performance and efficiency</li>
                  <li><span className="font-medium">Security</span>: Find and fix security vulnerabilities</li>
                  <li><span className="font-medium">Architecture</span>: Design system architecture and patterns</li>
                  <li><span className="font-medium">DevOps</span>: Automation for deployment and operations</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Free vs. Paid Skills</h3>
                <p>
                  The marketplace offers both free and premium skills:
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li><span className="font-medium">Free Skills</span>: Available to all users without payment</li>
                  <li><span className="font-medium">Premium Skills</span>: Require a one-time purchase or subscription</li>
                </ul>
                <p className="mt-2">
                  Premium skills typically offer more advanced capabilities, higher accuracy, or specialized functionality.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Tips for Best Results</CardTitle>
              <CardDescription>
                Get the most out of AI skills with these expert tips
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="tip1">
                  <AccordionTrigger>Be Specific with Inputs</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      The more specific and detailed your inputs are, the better results you'll get. For example, when using a code generation skill, include information about:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Programming language and version</li>
                      <li>Framework or libraries being used</li>
                      <li>Specific functionality requirements</li>
                      <li>Error handling preferences</li>
                      <li>Coding style guidelines</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="tip2">
                  <AccordionTrigger>Use Appropriate Temperature Settings</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      The temperature setting controls how creative or deterministic the AI's responses will be:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li><span className="font-medium">Low temperature (0.1-0.3)</span>: More predictable, consistent results. Good for tasks requiring precision like bug fixing or refactoring.</li>
                      <li><span className="font-medium">Medium temperature (0.4-0.7)</span>: Balanced creativity and consistency. Good for most tasks.</li>
                      <li><span className="font-medium">High temperature (0.8-1.0)</span>: More creative, varied results. Good for brainstorming or generating alternative solutions.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="tip3">
                  <AccordionTrigger>Iterative Approach for Complex Tasks</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      For complex tasks, use an iterative approach:
                    </p>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Start with a basic request to generate an initial solution</li>
                      <li>Review the output and identify areas for improvement</li>
                      <li>Make a follow-up request with specific refinements</li>
                      <li>Repeat until you achieve the desired result</li>
                    </ol>
                    <p className="mt-2">
                      For very complex tasks, consider using workflows instead of individual skills.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="tip4">
                  <AccordionTrigger>Check Skill Complexity for Your Task</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      Skills are rated by complexity, which affects the underlying model used:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li><span className="font-medium">Basic</span>: Simple, focused tasks. Uses lightweight models.</li>
                      <li><span className="font-medium">Intermediate</span>: Moderate complexity. Balanced performance and capability.</li>
                      <li><span className="font-medium">Advanced</span>: Complex tasks requiring deep understanding. Uses powerful models.</li>
                    </ul>
                    <p className="mt-2">
                      Match the skill complexity to your task requirements for optimal results.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Building Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Building AI Workflows</CardTitle>
              <CardDescription>
                Learn how to combine multiple skills into powerful workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">What Are Workflows?</h3>
                <p>
                  Workflows allow you to connect multiple AI skills together, passing data between them to accomplish complex tasks. For example, you could build a workflow that:
                </p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Takes a code snippet as input</li>
                  <li>Runs it through a code review skill to identify issues</li>
                  <li>Passes the results to a refactoring skill to fix the problems</li>
                  <li>Finally, sends the refactored code to a documentation skill to add comments</li>
                </ol>
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Workflow Components</h3>
                <p className="mb-2">
                  A workflow consists of the following components:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <span className="font-medium">Input Nodes</span>: Define the data that enters the workflow
                  </li>
                  <li>
                    <span className="font-medium">Skill Nodes</span>: AI skills that process data
                  </li>
                  <li>
                    <span className="font-medium">Condition Nodes</span>: Control the flow based on conditions
                  </li>
                  <li>
                    <span className="font-medium">Output Nodes</span>: Define the final output of the workflow
                  </li>
                  <li>
                    <span className="font-medium">Connections</span>: Define how data flows between nodes
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Creating Your First Workflow</CardTitle>
              <CardDescription>
                Step-by-step guide to building a workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Step 1: Plan Your Workflow</h3>
                <p>
                  Before you start building, plan out what you want your workflow to accomplish:
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>What is the input data?</li>
                  <li>What is the desired output?</li>
                  <li>What skills will you need to process the data?</li>
                  <li>What is the logical sequence of operations?</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Step 2: Create a New Workflow</h3>
                <p>
                  To create a new workflow:
                </p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Navigate to the Workflows section of the marketplace</li>
                  <li>Click "Create New Workflow"</li>
                  <li>Enter a name and description for your workflow</li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Step 3: Add Nodes</h3>
                <p>
                  Build your workflow by adding nodes:
                </p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Drag input nodes from the component panel to define your workflow inputs</li>
                  <li>Drag skill nodes for each skill you want to include</li>
                  <li>Add condition nodes if you need conditional logic</li>
                  <li>Add output nodes to define the final output</li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Step 4: Connect Nodes</h3>
                <p>
                  Create connections between nodes to define the data flow:
                </p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Click and drag from an output handle to an input handle</li>
                  <li>Ensure each node has appropriate connections</li>
                  <li>Validate that the data types match between connected nodes</li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Step 5: Test and Save</h3>
                <p>
                  Before finalizing your workflow:
                </p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Test the workflow with sample inputs</li>
                  <li>Debug any issues and adjust as needed</li>
                  <li>Save your workflow and add relevant tags</li>
                  <li>Choose whether to make it public or keep it private</li>
                </ol>
              </div>
              
              <div className="bg-muted p-4 rounded-md mt-4">
                <h3 className="text-lg font-medium mb-2">Example: Code Improvement Workflow</h3>
                <p className="mb-2">
                  Here's an example of a simple workflow that improves code quality:
                </p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>
                    <span className="font-medium">Input Node</span>: Accepts code and language parameters
                  </li>
                  <li>
                    <span className="font-medium">Code Analyzer Skill</span>: Identifies potential issues in the code
                  </li>
                  <li>
                    <span className="font-medium">Condition Node</span>: Checks if issues were found
                  </li>
                  <li>
                    <span className="font-medium">Code Refactorer Skill</span>: Refactors the code if issues were found
                  </li>
                  <li>
                    <span className="font-medium">Test Generator Skill</span>: Creates tests for the improved code
                  </li>
                  <li>
                    <span className="font-medium">Output Node</span>: Returns the improved code and tests
                  </li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Creating Skills Tab */}
        <TabsContent value="creating" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Creating Your Own AI Skills</CardTitle>
              <CardDescription>
                Learn how to build and share custom AI skills
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Why Create Custom Skills?</h3>
                <p>
                  Creating your own skills allows you to:
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Solve specific problems unique to your domain</li>
                  <li>Customize AI behavior to match your exact requirements</li>
                  <li>Share your expertise with the community</li>
                  <li>Potentially monetize your knowledge through premium skills</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Key Components of a Skill</h3>
                <p>
                  Every AI skill consists of these essential components:
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li><span className="font-medium">System Prompt</span>: Defines the AI's behavior, expertise, and constraints</li>
                  <li><span className="font-medium">User Prompt Template</span>: The template for formatting user inputs</li>
                  <li><span className="font-medium">Input Schema</span>: Defines the required inputs and their structure</li>
                  <li><span className="font-medium">Output Schema</span>: Defines the expected output structure (optional)</li>
                  <li><span className="font-medium">Examples</span>: Sample inputs and outputs that demonstrate usage</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Creating an Effective Skill</CardTitle>
              <CardDescription>
                Step-by-step guide to building your own AI skill
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="step1">
                  <AccordionTrigger>Step 1: Define Your Skill's Purpose</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      Start by clearly defining what your skill will do:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>What specific problem does it solve?</li>
                      <li>Who is the target user?</li>
                      <li>What inputs will it need?</li>
                      <li>What outputs will it produce?</li>
                      <li>What category does it fall under?</li>
                    </ul>
                    <p className="mt-2">
                      A focused skill with a clear purpose will be more effective than a general-purpose one.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="step2">
                  <AccordionTrigger>Step 2: Design the Input Schema</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      The input schema defines what data users need to provide:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Use JSON Schema format to define your inputs</li>
                      <li>Clearly mark required vs. optional fields</li>
                      <li>Use appropriate data types (string, number, boolean, array, object)</li>
                      <li>Add descriptions to help users understand each field</li>
                      <li>Consider adding constraints (min/max length, patterns, enums)</li>
                    </ul>
                    <div className="bg-muted p-3 rounded-md mt-2">
                      <p className="font-medium">Example Input Schema:</p>
                      <pre className="text-xs overflow-auto">
{`{
  "type": "object",
  "required": ["code", "language"],
  "properties": {
    "code": {
      "type": "string",
      "description": "The code to be reviewed"
    },
    "language": {
      "type": "string",
      "description": "Programming language",
      "enum": ["javascript", "python", "java", "typescript"]
    },
    "focusAreas": {
      "type": "array",
      "description": "Areas to focus on during review",
      "items": {
        "type": "string"
      }
    }
  }
}`}
                      </pre>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="step3">
                  <AccordionTrigger>Step 3: Craft an Effective System Prompt</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      The system prompt is crucial for defining how the AI behaves:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Define the AI's role and expertise</li>
                      <li>Set clear constraints and guidelines</li>
                      <li>Specify the expected format for responses</li>
                      <li>Include examples of good responses (optional)</li>
                      <li>Mention edge cases and how to handle them</li>
                    </ul>
                    <div className="bg-muted p-3 rounded-md mt-2">
                      <p className="font-medium">Example System Prompt:</p>
                      <pre className="text-xs overflow-auto whitespace-pre-wrap">
{`You are an expert code reviewer with deep knowledge of best practices, design patterns, and common pitfalls in software development. Your task is to review the provided code and provide constructive feedback.

When reviewing code, you should:
1. Identify potential bugs or logic errors
2. Point out performance issues
3. Suggest improvements for readability and maintainability
4. Check for security vulnerabilities
5. Ensure the code follows best practices for the given language

Format your response as a structured review with the following sections:
- Summary: A brief overview of the code quality
- Issues: Detailed explanation of problems found (if any)
- Suggestions: Specific recommendations for improvement
- Positive Aspects: Highlight what's well done in the code

Be specific and actionable in your feedback. Include code examples when suggesting improvements.`}
                      </pre>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="step4">
                  <AccordionTrigger>Step 4: Create the User Prompt Template</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      The user prompt template defines how user inputs are formatted:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Use {{variableName}} syntax to reference input fields</li>
                      <li>Structure the prompt in a clear, logical way</li>
                      <li>Add context and instructions as needed</li>
                      <li>Consider how to handle optional inputs</li>
                    </ul>
                    <div className="bg-muted p-3 rounded-md mt-2">
                      <p className="font-medium">Example User Prompt Template:</p>
                      <pre className="text-xs overflow-auto whitespace-pre-wrap">
{`Please review the following {{language}} code:

\`\`\`{{language}}
{{code}}
\`\`\`

{{#if focusAreas}}
Please focus especially on these areas: {{focusAreas}}
{{/if}}

Provide a detailed code review with specific suggestions for improvement.`}
                      </pre>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="step5">
                  <AccordionTrigger>Step 5: Define Output Schema (Optional)</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      An output schema can help ensure consistent, structured results:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Define the expected structure of the skill's output</li>
                      <li>Particularly useful for skills that will be used in workflows</li>
                      <li>Helps validate that the AI's response matches expectations</li>
                    </ul>
                    <div className="bg-muted p-3 rounded-md mt-2">
                      <p className="font-medium">Example Output Schema:</p>
                      <pre className="text-xs overflow-auto">
{`{
  "type": "object",
  "properties": {
    "summary": {
      "type": "string",
      "description": "Brief overview of code quality"
    },
    "issues": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "severity": {
            "type": "string",
            "enum": ["critical", "major", "minor", "info"]
          },
          "description": {
            "type": "string"
          },
          "suggestion": {
            "type": "string"
          }
        }
      }
    },
    "positiveAspects": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
}`}
                      </pre>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="step6">
                  <AccordionTrigger>Step 6: Create Example Inputs and Outputs</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      Good examples help users understand how to use your skill:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Create at least 2-3 realistic examples</li>
                      <li>Include diverse use cases that showcase different aspects</li>
                      <li>Make sure examples are representative of real-world usage</li>
                      <li>Ensure outputs match what your skill would actually produce</li>
                    </ul>
                    <p className="mt-2">
                      Examples are particularly important for skills with complex inputs or outputs.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="step7">
                  <AccordionTrigger>Step 7: Test and Refine Your Skill</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      Before publishing, thoroughly test your skill:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Test with various inputs, including edge cases</li>
                      <li>Verify that outputs match your expectations</li>
                      <li>Refine your prompts based on test results</li>
                      <li>Consider different temperature settings and their impact</li>
                      <li>Get feedback from other users if possible</li>
                    </ul>
                    <p className="mt-2">
                      Iterative refinement is key to creating a high-quality skill.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="step8">
                  <AccordionTrigger>Step 8: Publish and Promote Your Skill</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      When you're ready to share your skill:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Add descriptive tags to make it discoverable</li>
                      <li>Write a clear, comprehensive description</li>
                      <li>Decide if it will be free or premium</li>
                      <li>Set pricing if applicable</li>
                      <li>Share with your network to get initial users</li>
                    </ul>
                    <p className="mt-2">
                      Consider collecting user feedback to improve your skill over time.
                    </p>
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
