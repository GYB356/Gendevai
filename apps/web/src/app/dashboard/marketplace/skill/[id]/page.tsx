'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import PaymentForm from '@/components/payment/payment-form';

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: string;
  systemPrompt: string;
  userPromptTemplate: string;
  inputSchema: any;
  outputSchema?: any;
  exampleInputs: any[];
  exampleOutputs: any[];
  tags: string[];
  isVerified: boolean;
  isPublic: boolean;
  isPaid?: boolean;
  price?: number;
  isPurchased?: boolean;
}

export default function SkillDetailPage() {
  const params = useParams();
  const skillId = params.id as string;
  const [skill, setSkill] = useState<Skill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [output, setOutput] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [temperature, setTemperature] = useState(0.5);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSkill = async () => {
      setIsLoading(true);
      try {
        // This would be a real API call in production
        // For now, use a mock fetch that returns one of the example skills
        const response = await fetch(`/api/skills?ids=${skillId}`);
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        const fetchedSkill = data.skills?.[0];
        if (!fetchedSkill) {
          throw new Error('Skill not found');
        }

        setSkill(fetchedSkill);

        // Initialize inputs with empty values based on the input schema
        if (fetchedSkill.inputSchema?.properties) {
          const initialInputs: Record<string, any> = {};
          Object.keys(fetchedSkill.inputSchema.properties).forEach(key => {
            initialInputs[key] = '';
          });
          setInputs(initialInputs);
        }
      } catch (error) {
        console.error('Error fetching skill:', error);
        toast({
          title: 'Error',
          description: 'Failed to load skill details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (skillId) {
      fetchSkill();
    }
  }, [skillId, toast]);

  const handleInputChange = (key: string, value: any) => {
    setInputs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleUseExample = (exampleIndex: number) => {
    if (skill?.exampleInputs && skill.exampleInputs[exampleIndex]) {
      setInputs(skill.exampleInputs[exampleIndex]);
    }
  };

  const executeSkill = async () => {
    if (!skill) return;
    
    // Check if skill is paid and not purchased
    if (skill.isPaid && !skill.isPurchased) {
      setShowPaymentDialog(true);
      return;
    }

    setIsExecuting(true);
    setOutput(null);
    
    try {
      const response = await fetch('/api/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skillId: skill.id,
          inputs,
          temperature,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to execute skill');
      }
      
      setOutput(result.output);
      toast({
        title: 'Success',
        description: 'Skill executed successfully',
      });
    } catch (error) {
      console.error('Error executing skill:', error);
      toast({
        title: 'Error',
        description: String(error),
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };
  
  const handlePurchaseComplete = (data: any) => {
    // Update the skill to show it's purchased
    if (skill) {
      setSkill({
        ...skill,
        isPurchased: true
      });
    }
    
    setShowPaymentDialog(false);
    
    toast({
      title: 'Purchase Complete',
      description: 'You can now use this skill',
    });
  };

  const renderInputField = (key: string, schema: any) => {
    const type = schema.type;
    const value = inputs[key] || '';

    if (type === 'string' && schema.enum) {
      return (
        <select 
          className="w-full p-2 border rounded-md"
          value={value}
          onChange={(e) => handleInputChange(key, e.target.value)}
        >
          {schema.enum.map((option: string) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    } else if (type === 'string' && key.toLowerCase().includes('code')) {
      return (
        <Textarea 
          className="w-full h-60 font-mono text-sm"
          value={value}
          onChange={(e) => handleInputChange(key, e.target.value)}
          placeholder={`Enter ${key}...`}
        />
      );
    } else if (type === 'string') {
      return (
        <Input 
          type="text"
          value={value}
          onChange={(e) => handleInputChange(key, e.target.value)}
          placeholder={`Enter ${key}...`}
        />
      );
    } else if (type === 'number') {
      return (
        <Input 
          type="number"
          value={value}
          onChange={(e) => handleInputChange(key, parseFloat(e.target.value))}
          placeholder={`Enter ${key}...`}
        />
      );
    } else if (type === 'boolean') {
      return (
        <div className="flex items-center">
          <input 
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleInputChange(key, e.target.checked)}
            className="mr-2"
          />
          <span>{key}</span>
        </div>
      );
    } else if (type === 'array') {
      return (
        <Textarea 
          className="w-full"
          value={Array.isArray(value) ? value.join(', ') : value}
          onChange={(e) => handleInputChange(key, e.target.value.split(',').map(item => item.trim()))}
          placeholder={`Enter ${key} (comma separated)...`}
        />
      );
    } else if (type === 'object') {
      return (
        <Textarea 
          className="w-full h-40 font-mono text-sm"
          value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              handleInputChange(key, parsed);
            } catch {
              handleInputChange(key, e.target.value);
            }
          }}
          placeholder={`Enter ${key} as JSON...`}
        />
      );
    }
    
    return (
      <Input 
        type="text"
        value={value}
        onChange={(e) => handleInputChange(key, e.target.value)}
        placeholder={`Enter ${key}...`}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-4">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-6 w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="md:col-span-2">
              <Skeleton className="h-[600px] w-full" />
            </div>
            <div>
              <Skeleton className="h-[400px] w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <h3 className="text-xl font-medium mb-2">Skill not found</h3>
          <p className="text-gray-500 mb-6">The skill you're looking for doesn't exist or has been removed</p>
          <Button onClick={() => window.location.href = '/dashboard/marketplace'}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{skill.name}</h1>
            <div className="flex items-center gap-2 mb-4">
              <Badge>{skill.category.replace('_', ' ')}</Badge>
              <Badge variant="outline">{skill.complexity}</Badge>
              {skill.isVerified && (
                <Badge variant="default" className="bg-green-500">Verified</Badge>
              )}
            </div>
            <p className="text-gray-700 dark:text-gray-300 max-w-3xl">
              {skill.description}
            </p>
          </div>
          <Button onClick={() => window.location.href = '/dashboard/marketplace'}>
            Back to Marketplace
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          {skill.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="use" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="use">Use Skill</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
              <TabsTrigger value="details">Technical Details</TabsTrigger>
            </TabsList>

            <TabsContent value="use" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Inputs</CardTitle>
                  <CardDescription>
                    Provide the required inputs for this skill
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {skill.inputSchema?.properties && Object.entries(skill.inputSchema.properties).map(([key, schema]: [string, any]) => (
                    <div key={key} className="mb-4">
                      <label className="block text-sm font-medium mb-1">
                        {key}
                        {skill.inputSchema?.required?.includes(key) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      {renderInputField(key, schema)}
                      {schema.description && (
                        <p className="text-xs text-gray-500 mt-1">{schema.description}</p>
                      )}
                    </div>
                  ))}

                  <div className="mt-6">
                    <label className="block text-sm font-medium mb-1">
                      Temperature (Creativity Level)
                    </label>
                    <div className="flex items-center gap-4">
                      <span className="text-sm">0.1</span>
                      <Slider
                        value={[temperature]}
                        min={0.1}
                        max={1.0}
                        step={0.1}
                        onValueChange={(values) => setTemperature(values[0])}
                        className="flex-1"
                      />
                      <span className="text-sm">1.0</span>
                      <span className="ml-2 text-sm font-medium">{temperature.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Lower values produce more predictable outputs, higher values more creative ones.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={executeSkill} 
                    disabled={isExecuting}
                    className="w-full"
                  >
                    {isExecuting ? 'Executing...' : 'Execute Skill'}
                  </Button>
                </CardFooter>
              </Card>

              {output && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Output</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {typeof output === 'object' ? (
                      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto text-sm">
                        {JSON.stringify(output, null, 2)}
                      </pre>
                    ) : (
                      <div className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                        {output}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" onClick={() => setOutput(null)} className="mr-2">
                      Clear Output
                    </Button>
                    {/* Add save button or other actions here */}
                  </CardFooter>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="examples" className="space-y-6">
              {skill.exampleInputs.length > 0 ? (
                skill.exampleInputs.map((example, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>Example {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-2">Input</h4>
                          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto text-sm h-48">
                            {JSON.stringify(example, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Output</h4>
                          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto text-sm h-48">
                            {skill.exampleOutputs[index] 
                              ? JSON.stringify(skill.exampleOutputs[index], null, 2) 
                              : 'No example output available'}
                          </pre>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={() => handleUseExample(index)}>
                        Use This Example
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <h3 className="text-xl font-medium mb-2">No examples available</h3>
                  <p className="text-gray-500">
                    This skill doesn't have any examples yet
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Prompt</CardTitle>
                  <CardDescription>
                    The base instructions given to the AI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto text-sm whitespace-pre-wrap">
                    {skill.systemPrompt}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Prompt Template</CardTitle>
                  <CardDescription>
                    The template used to format your inputs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto text-sm whitespace-pre-wrap">
                    {skill.userPromptTemplate}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Input Schema</CardTitle>
                  <CardDescription>
                    The expected structure of inputs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto text-sm">
                    {JSON.stringify(skill.inputSchema, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              {skill.outputSchema && (
                <Card>
                  <CardHeader>
                    <CardTitle>Output Schema</CardTitle>
                    <CardDescription>
                      The expected structure of outputs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto text-sm">
                      {JSON.stringify(skill.outputSchema, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>About this Skill</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">Complexity</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {skill.complexity === 'BASIC' && 'Basic - Uses simpler models and fewer tokens'}
                  {skill.complexity === 'INTERMEDIATE' && 'Intermediate - Balanced performance and capability'}
                  {skill.complexity === 'ADVANCED' && 'Advanced - Uses powerful models for complex tasks'}
                </p>
              </div>

              <div>
                <h4 className="font-medium">Usage</h4>
                <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>Used by:</span>
                  <span>235 developers</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>Total executions:</span>
                  <span>1,458</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>Average rating:</span>
                  <span>4.8/5</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium">Pricing</h4>
                {skill.isPaid ? (
                  skill.isPurchased ? (
                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md text-center">
                      <span className="text-green-700 dark:text-green-400 font-medium">Purchased</span>
                    </div>
                  ) : (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md text-center">
                      <span className="text-blue-700 dark:text-blue-400 font-medium">${skill.price?.toFixed(2)}</span>
                    </div>
                  )
                ) : (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md text-center">
                    <span className="text-green-700 dark:text-green-400 font-medium">Free</span>
                  </div>
                )}
              </div>

              <div className="pt-4">
                {skill.isPaid && !skill.isPurchased ? (
                  <Button 
                    className="w-full" 
                    variant="default"
                    onClick={() => setShowPaymentDialog(true)}
                  >
                    Purchase Now
                  </Button>
                ) : (
                  <Button className="w-full" variant="default">
                    Add to Workflows
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Ratings & Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-4">
                <div className="text-3xl font-bold mr-4">4.8</div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star} 
                      className={`w-5 h-5 ${star <= 5 ? 'text-yellow-400' : 'text-gray-300'}`} 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Jane Developer</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg 
                          key={star} 
                          className={`w-4 h-4 ${star <= 5 ? 'text-yellow-400' : 'text-gray-300'}`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    This skill saved me hours of tedious code review work. Highly recommended!
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Mark Coder</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg 
                          key={star} 
                          className={`w-4 h-4 ${star <= 4 ? 'text-yellow-400' : 'text-gray-300'}`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Great skill for identifying code issues. Would be 5 stars if it had better handling of edge cases.
                  </p>
                </div>
              </div>

              <Button variant="outline" className="mt-4 w-full">
                View All Reviews
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Purchase Skill</DialogTitle>
            <DialogDescription>
              Complete your purchase to access this skill
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {skill && (
              <PaymentForm
                skillId={skill.id}
                skillName={skill.name}
                price={skill.price || 0}
                onPurchaseComplete={handlePurchaseComplete}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
