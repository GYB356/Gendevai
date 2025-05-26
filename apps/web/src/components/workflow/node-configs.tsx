import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export const CodeGenConfig = ({ node, onUpdateConfig }: any) => {
  const config = node.data.config || {};
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Code Generation Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="language">Programming Language</Label>
          <Select
            defaultValue={config.language || "typescript"}
            onValueChange={(value) => onUpdateConfig({ ...config, language: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="csharp">C#</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="framework">Framework</Label>
          <Select
            defaultValue={config.framework || "none"}
            onValueChange={(value) => onUpdateConfig({ ...config, framework: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select framework" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="react">React</SelectItem>
              <SelectItem value="angular">Angular</SelectItem>
              <SelectItem value="vue">Vue</SelectItem>
              <SelectItem value="next">Next.js</SelectItem>
              <SelectItem value="express">Express.js</SelectItem>
              <SelectItem value="django">Django</SelectItem>
              <SelectItem value="flask">Flask</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="defaultDescription">Default Description</Label>
          <Textarea
            id="defaultDescription"
            defaultValue={config.defaultDescription || ""}
            placeholder="Enter a default description if no input is provided"
            onChange={(e) => onUpdateConfig({ ...config, defaultDescription: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export const DebugAssistConfig = ({ node, onUpdateConfig }: any) => {
  const config = node.data.config || {};
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Debug Assistant Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="defaultCode">Default Code</Label>
          <Textarea
            id="defaultCode"
            defaultValue={config.defaultCode || ""}
            placeholder="Enter default code to debug if no input is provided"
            onChange={(e) => onUpdateConfig({ ...config, defaultCode: e.target.value })}
            className="h-24"
          />
        </div>
        
        <div>
          <Label htmlFor="defaultError">Default Error</Label>
          <Textarea
            id="defaultError"
            defaultValue={config.defaultError || ""}
            placeholder="Enter default error message if no input is provided"
            onChange={(e) => onUpdateConfig({ ...config, defaultError: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export const ResourceOptConfig = ({ node, onUpdateConfig }: any) => {
  const config = node.data.config || {};
  const targetMetrics = config.targetMetrics || ["memory", "cpu"];
  
  const toggleMetric = (metric: string) => {
    if (targetMetrics.includes(metric)) {
      onUpdateConfig({ 
        ...config, 
        targetMetrics: targetMetrics.filter((m: string) => m !== metric) 
      });
    } else {
      onUpdateConfig({ 
        ...config, 
        targetMetrics: [...targetMetrics, metric] 
      });
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Resource Optimization Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="mb-2 block">Target Metrics</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="memory" 
                checked={targetMetrics.includes("memory")}
                onCheckedChange={() => toggleMetric("memory")}
              />
              <Label htmlFor="memory">Memory Optimization</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="cpu" 
                checked={targetMetrics.includes("cpu")}
                onCheckedChange={() => toggleMetric("cpu")}
              />
              <Label htmlFor="cpu">CPU Optimization</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="network" 
                checked={targetMetrics.includes("network")}
                onCheckedChange={() => toggleMetric("network")}
              />
              <Label htmlFor="network">Network Optimization</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="storage" 
                checked={targetMetrics.includes("storage")}
                onCheckedChange={() => toggleMetric("storage")}
              />
              <Label htmlFor="storage">Storage Optimization</Label>
            </div>
          </div>
        </div>
        
        <div>
          <Label htmlFor="defaultCode">Default Code</Label>
          <Textarea
            id="defaultCode"
            defaultValue={config.defaultCode || ""}
            placeholder="Enter default code to optimize if no input is provided"
            onChange={(e) => onUpdateConfig({ ...config, defaultCode: e.target.value })}
            className="h-24"
          />
        </div>
        
        <div>
          <Label htmlFor="language">Programming Language</Label>
          <Select
            defaultValue={config.language || "typescript"}
            onValueChange={(value) => onUpdateConfig({ ...config, language: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="csharp">C#</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
