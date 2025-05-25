'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Form validation schema
const skillFormSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  category: z.enum(['CODE_GENERATION', 'CODE_REVIEW', 'REFACTORING', 'TESTING', 'DOCUMENTATION', 'OPTIMIZATION', 'SECURITY', 'ARCHITECTURE', 'DEVOPS', 'OTHER']),
  complexity: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']),
  systemPrompt: z.string().min(10, { message: 'System prompt must be at least 10 characters' }),
  userPromptTemplate: z.string().min(10, { message: 'User prompt template must be at least 10 characters' }),
  inputSchema: z.string().min(2, { message: 'Input schema must be valid JSON' })
    .refine(value => {
      try {
        JSON.parse(value);
        return true;
      } catch (e) {
        return false;
      }
    }, { message: 'Input schema must be valid JSON' }),
  outputSchema: z.string().optional()
    .refine(value => {
      if (!value) return true;
      try {
        JSON.parse(value);
        return true;
      } catch (e) {
        return false;
      }
    }, { message: 'Output schema must be valid JSON if provided' }),
  tags: z.string(),
  isPublic: z.boolean().default(false),
  isPaid: z.boolean().default(false),
  price: z.string().optional(),
});

export default function CreateSkillPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [exampleInputs, setExampleInputs] = useState<Array<{ input: string }>>([{ input: '{}' }]);
  const [exampleOutputs, setExampleOutputs] = useState<Array<{ output: string }>>([{ output: '{}' }]);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof skillFormSchema>>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'CODE_GENERATION',
      complexity: 'INTERMEDIATE',
      systemPrompt: '',
      userPromptTemplate: '',
      inputSchema: JSON.stringify({
        type: 'object',
        required: [],
        properties: {}
      }, null, 2),
      outputSchema: JSON.stringify({
        type: 'object',
        properties: {}
      }, null, 2),
      tags: '',
      isPublic: false,
      isPaid: false,
      price: '0'
    }
  });

  // Add a new example input
  const addExampleInput = () => {
    setExampleInputs([...exampleInputs, { input: '{}' }]);
  };

  // Update an example input
  const updateExampleInput = (index: number, value: string) => {
    const newInputs = [...exampleInputs];
    newInputs[index] = { input: value };
    setExampleInputs(newInputs);
  };

  // Remove an example input
  const removeExampleInput = (index: number) => {
    const newInputs = [...exampleInputs];
    newInputs.splice(index, 1);
    setExampleInputs(newInputs);
  };

  // Add a new example output
  const addExampleOutput = () => {
    setExampleOutputs([...exampleOutputs, { output: '{}' }]);
  };

  // Update an example output
  const updateExampleOutput = (index: number, value: string) => {
    const newOutputs = [...exampleOutputs];
    newOutputs[index] = { output: value };
    setExampleOutputs(newOutputs);
  };

  // Remove an example output
  const removeExampleOutput = (index: number) => {
    const newOutputs = [...exampleOutputs];
    newOutputs.splice(index, 1);
    setExampleOutputs(newOutputs);
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof skillFormSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Validate example inputs and outputs as JSON
      const validatedExampleInputs = exampleInputs.map(item => {
        try {
          return JSON.parse(item.input);
        } catch (e) {
          throw new Error('Invalid JSON in example inputs');
        }
      });
      
      const validatedExampleOutputs = exampleOutputs.map(item => {
        try {
          return JSON.parse(item.output);
        } catch (e) {
          throw new Error('Invalid JSON in example outputs');
        }
      });
      
      // Prepare skill data
      const skillData = {
        name: values.name,
        description: values.description,
        category: values.category,
        complexity: values.complexity,
        systemPrompt: values.systemPrompt,
        userPromptTemplate: values.userPromptTemplate,
        inputSchema: JSON.parse(values.inputSchema),
        outputSchema: values.outputSchema ? JSON.parse(values.outputSchema) : undefined,
        tags: values.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        isPublic: values.isPublic,
        exampleInputs: validatedExampleInputs,
        exampleOutputs: validatedExampleOutputs,
        price: values.isPaid ? parseFloat(values.price || '0') : 0,
        isPaid: values.isPaid
      };
      
      // Submit to API
      const response = await fetch('/api/skills/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(skillData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create skill');
      }
      
      toast({
        title: 'Success',
        description: 'Skill created successfully',
      });
      
      // Redirect to skill detail page
      router.push(`/dashboard/marketplace/skill/${result.id}`);
      
    } catch (error: any) {
      console.error('Error creating skill:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create skill',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Create AI Skill</h1>
          <p className="text-muted-foreground">Share your AI skills with the community</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="prompts">Prompts & Schemas</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
              <TabsTrigger value="pricing">Pricing & Visibility</TabsTrigger>
            </TabsList>
            
            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Provide the core details about your AI skill
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skill Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter skill name" {...field} />
                        </FormControl>
                        <FormDescription>
                          A concise, descriptive name for your skill
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what your skill does" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Explain what your skill does and when it should be used
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CODE_GENERATION">Code Generation</SelectItem>
                              <SelectItem value="CODE_REVIEW">Code Review</SelectItem>
                              <SelectItem value="REFACTORING">Refactoring</SelectItem>
                              <SelectItem value="TESTING">Testing</SelectItem>
                              <SelectItem value="DOCUMENTATION">Documentation</SelectItem>
                              <SelectItem value="OPTIMIZATION">Optimization</SelectItem>
                              <SelectItem value="SECURITY">Security</SelectItem>
                              <SelectItem value="ARCHITECTURE">Architecture</SelectItem>
                              <SelectItem value="DEVOPS">DevOps</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose the most relevant category
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="complexity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complexity</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select complexity" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="BASIC">Basic</SelectItem>
                              <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                              <SelectItem value="ADVANCED">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How sophisticated is this skill
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter tags separated by commas" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Add relevant tags to help users discover your skill (e.g., python,testing,security)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => router.push('/dashboard/marketplace')}>
                    Cancel
                  </Button>
                  <Button onClick={() => setActiveTab('prompts')}>
                    Next: Prompts & Schemas
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Prompts & Schemas Tab */}
            <TabsContent value="prompts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Prompts & Schemas</CardTitle>
                  <CardDescription>
                    Define how your skill communicates with the AI model and validates data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="systemPrompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>System Prompt</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter the system prompt that defines the AI's behavior" 
                            className="min-h-[150px] font-mono text-sm"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Instructions that define how the AI should behave when executing this skill
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="userPromptTemplate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Prompt Template</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter the template for the user prompt, using {{variable}} syntax for inputs" 
                            className="min-h-[150px] font-mono text-sm"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Template that will be populated with user inputs. Use {{variableName}} for variables that match your input schema.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="inputSchema"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Input Schema (JSON Schema)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter JSON schema for input validation" 
                              className="min-h-[200px] font-mono text-sm"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            JSON Schema defining the required inputs for this skill
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="outputSchema"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Output Schema (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter JSON schema for output validation (optional)" 
                              className="min-h-[200px] font-mono text-sm"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            JSON Schema defining the expected output format (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('basic')}>
                    Back
                  </Button>
                  <Button onClick={() => setActiveTab('examples')}>
                    Next: Examples
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Examples Tab */}
            <TabsContent value="examples" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Example Inputs & Outputs</CardTitle>
                  <CardDescription>
                    Provide example inputs and outputs to help users understand how to use your skill
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Example Inputs</h3>
                    {exampleInputs.map((item, index) => (
                      <div key={`input-${index}`} className="mb-4 p-4 border rounded-md">
                        <div className="flex justify-between items-center mb-2">
                          <Label>Example Input {index + 1}</Label>
                          {exampleInputs.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeExampleInput(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <Textarea 
                          value={item.input}
                          onChange={(e) => updateExampleInput(index, e.target.value)}
                          placeholder="Enter JSON example input"
                          className="min-h-[120px] font-mono text-sm"
                        />
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      onClick={addExampleInput}
                      className="w-full"
                    >
                      Add Example Input
                    </Button>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Example Outputs</h3>
                    {exampleOutputs.map((item, index) => (
                      <div key={`output-${index}`} className="mb-4 p-4 border rounded-md">
                        <div className="flex justify-between items-center mb-2">
                          <Label>Example Output {index + 1}</Label>
                          {exampleOutputs.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeExampleOutput(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <Textarea 
                          value={item.output}
                          onChange={(e) => updateExampleOutput(index, e.target.value)}
                          placeholder="Enter JSON example output"
                          className="min-h-[120px] font-mono text-sm"
                        />
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      onClick={addExampleOutput}
                      className="w-full"
                    >
                      Add Example Output
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('prompts')}>
                    Back
                  </Button>
                  <Button onClick={() => setActiveTab('pricing')}>
                    Next: Pricing & Visibility
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Pricing & Visibility Tab */}
            <TabsContent value="pricing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing & Visibility</CardTitle>
                  <CardDescription>
                    Configure who can see and use your skill, and whether it's free or paid
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Public Visibility
                          </FormLabel>
                          <FormDescription>
                            Make this skill visible to all users in the marketplace
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isPaid"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Paid Skill
                          </FormLabel>
                          <FormDescription>
                            Charge users to access this skill
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch('isPaid') && (
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (USD)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0.99"
                              step="0.01"
                              placeholder="Enter price in USD" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Set a price for your skill (minimum $0.99)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('examples')}>
                    Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Skill'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}
