import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, Badge } from '@/components/ui/card';

export const CodeGenNode = ({ data, isConnectable }: any) => {
  return (
    <Card className="min-w-[200px] border-2 border-emerald-500">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-bold">NL Code Generator</CardTitle>
        <Badge variant="outline" className="text-xs">AI Code</Badge>
      </CardHeader>
      <CardContent className="p-3 text-xs">
        {data.description || 'Generates code from natural language'}
      </CardContent>
    </Card>
  );
};

export const DebugAssistNode = ({ data, isConnectable }: any) => {
  return (
    <Card className="min-w-[200px] border-2 border-red-500">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-bold">Debug Assistant</CardTitle>
        <Badge variant="outline" className="text-xs">AI Debug</Badge>
      </CardHeader>
      <CardContent className="p-3 text-xs">
        {data.description || 'AI-powered code debugging assistant'}
      </CardContent>
    </Card>
  );
};

export const ResourceOptNode = ({ data, isConnectable }: any) => {
  return (
    <Card className="min-w-[200px] border-2 border-indigo-500">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-bold">Resource Optimizer</CardTitle>
        <Badge variant="outline" className="text-xs">AI Optimization</Badge>
      </CardHeader>
      <CardContent className="p-3 text-xs">
        {data.description || 'Predictive resource optimization for code'}
      </CardContent>
    </Card>
  );
};
