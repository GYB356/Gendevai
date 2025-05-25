'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: string;
  tags: string[];
  isVerified: boolean;
  isPublic: boolean;
}

interface Purchase {
  id: string;
  skillId: string;
  purchaseDate: string;
  expirationDate?: string;
  status: string;
  skill: Skill;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  isVerified: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const [createdSkills, setCreatedSkills] = useState<Skill[]>([]);
  const [purchasedSkills, setPurchasedSkills] = useState<Purchase[]>([]);
  const [createdWorkflows, setCreatedWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('created');
  const { toast } = useToast();
  
  // Mock user data - would come from auth in a real implementation
  const user = {
    id: '1',
    name: 'John Developer',
    email: 'john@example.com',
    image: '/placeholder-avatar.jpg'
  };

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, these would be separate API calls
        // For now, we'll use example data
        
        // Example created skills
        setCreatedSkills([
          {
            id: 'custom-skill-1',
            name: 'Code Formatter Pro',
            description: 'Automatically formats code according to best practices',
            category: 'CODE_REVIEW',
            complexity: 'INTERMEDIATE',
            tags: ['formatting', 'linting', 'code-quality'],
            isVerified: true,
            isPublic: true
          },
          {
            id: 'custom-skill-2',
            name: 'React Component Generator',
            description: 'Generates React components based on specifications',
            category: 'CODE_GENERATION',
            complexity: 'ADVANCED',
            tags: ['react', 'components', 'typescript'],
            isVerified: false,
            isPublic: true
          }
        ]);
        
        // Example purchased skills
        setPurchasedSkills([
          {
            id: 'purchase-1',
            skillId: 'premium-skill-1',
            purchaseDate: '2023-08-15T10:30:00Z',
            status: 'completed',
            skill: {
              id: 'premium-skill-1',
              name: 'Advanced Security Analyzer',
              description: 'Deep security analysis for your codebase',
              category: 'SECURITY',
              complexity: 'ADVANCED',
              tags: ['security', 'vulnerability', 'analysis'],
              isVerified: true,
              isPublic: true
            }
          },
          {
            id: 'purchase-2',
            skillId: 'premium-skill-2',
            purchaseDate: '2023-09-20T14:15:00Z',
            expirationDate: '2024-09-20T14:15:00Z',
            status: 'completed',
            skill: {
              id: 'premium-skill-2',
              name: 'Database Schema Optimizer',
              description: 'Optimizes database schemas for performance',
              category: 'OPTIMIZATION',
              complexity: 'ADVANCED',
              tags: ['database', 'performance', 'schema'],
              isVerified: true,
              isPublic: true
            }
          }
        ]);
        
        // Example created workflows
        setCreatedWorkflows([
          {
            id: 'workflow-1',
            name: 'Full Code Review Pipeline',
            description: 'End-to-end code review with security and performance checks',
            isPublic: true,
            isVerified: false,
            createdAt: '2023-07-10T09:00:00Z'
          },
          {
            id: 'workflow-2',
            name: 'API Documentation Generator',
            description: 'Automatically generates API documentation from code',
            isPublic: true,
            isVerified: true,
            createdAt: '2023-08-05T11:30:00Z'
          }
        ]);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [toast]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="flex space-x-2 mt-2">
                  <Badge variant="outline">Developer</Badge>
                  <Badge variant="outline">{createdSkills.length} Skills</Badge>
                  <Badge variant="outline">{createdWorkflows.length} Workflows</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="created">Created Skills</TabsTrigger>
          <TabsTrigger value="purchased">Purchased Skills</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>
        
        {/* Created Skills Tab */}
        <TabsContent value="created" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Skills You've Created</h2>
            <Button onClick={() => window.location.href = '/dashboard/marketplace/create'}>
              Create New Skill
            </Button>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : createdSkills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {createdSkills.map((skill) => (
                <Card key={skill.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{skill.name}</CardTitle>
                      <Badge variant={skill.isVerified ? "default" : "outline"}>
                        {skill.isVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Category: {skill.category.replace('_', ' ')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4 line-clamp-2">{skill.description}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {skill.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = `/dashboard/marketplace/skill/${skill.id}`}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/dashboard/marketplace/skill/${skill.id}/edit`}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <p className="text-muted-foreground mb-4">You haven't created any skills yet</p>
                <Button onClick={() => window.location.href = '/dashboard/marketplace/create'}>
                  Create Your First Skill
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Purchased Skills Tab */}
        <TabsContent value="purchased" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Skills You've Purchased</h2>
            <Button onClick={() => window.location.href = '/dashboard/marketplace'}>
              Browse Marketplace
            </Button>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : purchasedSkills.length > 0 ? (
            <div className="space-y-4">
              {purchasedSkills.map((purchase) => (
                <Card key={purchase.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{purchase.skill.name}</CardTitle>
                      <Badge variant="outline">
                        {purchase.expirationDate ? 'Subscription' : 'One-time'}
                      </Badge>
                    </div>
                    <CardDescription>
                      Purchased on {formatDate(purchase.purchaseDate)}
                      {purchase.expirationDate && ` • Expires on ${formatDate(purchase.expirationDate)}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{purchase.skill.description}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {purchase.skill.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button 
                      onClick={() => window.location.href = `/dashboard/marketplace/skill/${purchase.skill.id}`}
                      size="sm"
                    >
                      Use Skill
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <p className="text-muted-foreground mb-4">You haven't purchased any skills yet</p>
                <Button onClick={() => window.location.href = '/dashboard/marketplace'}>
                  Browse Marketplace
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Workflows</h2>
            <Button onClick={() => window.location.href = '/dashboard/marketplace/workflows/create'}>
              Create New Workflow
            </Button>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : createdWorkflows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {createdWorkflows.map((workflow) => (
                <Card key={workflow.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{workflow.name}</CardTitle>
                      <Badge variant={workflow.isVerified ? "default" : "outline"}>
                        {workflow.isVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Created on {formatDate(workflow.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4 line-clamp-2">{workflow.description}</p>
                    <div className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = `/dashboard/marketplace/workflows/${workflow.id}`}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => window.location.href = `/dashboard/marketplace/workflows/${workflow.id}/edit`}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <p className="text-muted-foreground mb-4">You haven't created any workflows yet</p>
                <Button onClick={() => window.location.href = '/dashboard/marketplace/workflows/create'}>
                  Create Your First Workflow
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
