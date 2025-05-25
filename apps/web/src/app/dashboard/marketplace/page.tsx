'use client';

import { useState, useEffect } from 'react';
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

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

export default function MarketplacePage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSkills = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append('query', searchQuery);
        if (selectedCategory) params.append('category', selectedCategory);
        if (verifiedOnly) params.append('verified', 'true');

        const response = await fetch(`/api/skills?${params.toString()}`);
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setSkills(data.skills || []);
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching skills:', error);
        toast({
          title: 'Error',
          description: 'Failed to load marketplace skills',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSkills();
  }, [searchQuery, selectedCategory, verifiedOnly, toast]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleVerifiedToggle = () => {
    setVerifiedOnly(!verifiedOnly);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">AI Skill Marketplace</h1>
        <Button variant="default" onClick={() => window.location.href = '/dashboard/marketplace/create'}>
          Create New Skill
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4 mb-8">
        <div className="md:col-span-3">
          <Input
            placeholder="Search skills..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full"
          />
        </div>
        <div>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center mb-8">
        <Button 
          variant={verifiedOnly ? "default" : "outline"} 
          onClick={handleVerifiedToggle}
          className="mr-4"
        >
          {verifiedOnly ? "✓ Verified Skills Only" : "Show All Skills"}
        </Button>
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all">All Skills</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="my-skills">My Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </CardContent>
                  <CardFooter>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : skills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skills.map((skill) => (
                <Card key={skill.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{skill.name}</CardTitle>
                      {skill.isVerified && (
                        <Badge variant="default" className="bg-green-500">Verified</Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm text-gray-500">
                      {skill.category.replace('_', ' ')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {skill.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {skill.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline"
                      onClick={() => window.location.href = `/dashboard/marketplace/skill/${skill.id}`}
                    >
                      View Details
                    </Button>
                    <Button 
                      variant="default"
                      onClick={() => window.location.href = `/dashboard/marketplace/skill/${skill.id}/use`}
                    >
                      Use Skill
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <h3 className="text-xl font-medium mb-2">No skills found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
              <Button onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                setVerifiedOnly(false);
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="popular" className="mt-6">
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <h3 className="text-xl font-medium mb-2">Popular skills coming soon</h3>
            <p className="text-gray-500">
              We're still gathering data on the most popular skills
            </p>
          </div>
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <h3 className="text-xl font-medium mb-2">New skills coming soon</h3>
            <p className="text-gray-500">
              Check back later for newly added skills
            </p>
          </div>
        </TabsContent>

        <TabsContent value="my-skills" className="mt-6">
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <h3 className="text-xl font-medium mb-2">You haven't created any skills yet</h3>
            <p className="text-gray-500 mb-6">
              Start creating your own AI skills to share or monetize
            </p>
            <Button onClick={() => window.location.href = '/dashboard/marketplace/create'}>
              Create New Skill
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
