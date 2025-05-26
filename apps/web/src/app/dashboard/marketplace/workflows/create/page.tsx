'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  NodeTypes
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CodeGenNode, DebugAssistNode, ResourceOptNode } from '@/components/workflow/advanced-nodes';
import { CodeGenConfig, DebugAssistConfig, ResourceOptConfig } from '@/components/workflow/node-configs';

// Custom node components
const SkillNode = ({ data, isConnectable }: any) => {
  return (
    <Card className="min-w-[200px] border-2 border-blue-500">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-bold">{data.label}</CardTitle>
        <Badge variant="outline" className="text-xs">{data.skill?.category || 'Skill'}</Badge>
      </CardHeader>
      <CardContent className="p-3 text-xs">
        {data.skill?.description || 'A skill node'}
      </CardContent>
    </Card>
  );
};

const InputNode = ({ data, isConnectable }: any) => {
  return (
    <Card className="min-w-[180px] border-2 border-green-500">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-bold">Input: {data.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 text-xs">
        {data.description || 'Input parameter'}
      </CardContent>
    </Card>
  );
};

const OutputNode = ({ data, isConnectable }: any) => {
  return (
    <Card className="min-w-[180px] border-2 border-purple-500">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-bold">Output: {data.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 text-xs">
        {data.description || 'Workflow output'}
      </CardContent>
    </Card>
  );
};

const ConditionNode = ({ data, isConnectable }: any) => {
  return (
    <Card className="min-w-[180px] border-2 border-yellow-500">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-bold">Condition</CardTitle>
      </CardHeader>
      <CardContent className="p-3 text-xs">
        {data.condition || 'Condition logic'}
      </CardContent>
    </Card>
  );
};

// Node types registration
const nodeTypes: NodeTypes = {
  skill: SkillNode,
  input: InputNode,
  output: OutputNode,
  condition: ConditionNode,
  codeGen: CodeGenNode,
  debugAssist: DebugAssistNode,
  resourceOpt: ResourceOptNode,
};

// Main workflow editor component
export default function WorkflowBuilderPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [skills, setSkills] = useState<any[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [nodeName, setNodeName] = useState('');
  const [nodeType, setNodeType] = useState('skill');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const { toast } = useToast();

  // Load skills for the node selector
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await fetch('/api/skills');
        const data = await response.json();
        if (data.skills) {
          setSkills(data.skills);
        }
      } catch (error) {
        console.error('Error fetching skills:', error);
        toast({
          title: 'Error',
          description: 'Failed to load skills for workflow builder',
          variant: 'destructive',
        });
      }
    };

    fetchSkills();
  }, [toast]);

  // Handle edge connections
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    }, eds)),
    [setEdges]
  );

  // Handle dropping a node on the canvas
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow/type');
      const skillId = event.dataTransfer.getData('application/reactflow/skillId');
      
      if (!type) return;

      // Get the position where the node was dropped
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds || !reactFlowInstance) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Create a new node
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { 
          label: type === 'skill' ? 
            skills.find(s => s.id === skillId)?.name || 'Skill' : 
            type.charAt(0).toUpperCase() + type.slice(1),
          skill: skills.find(s => s.id === skillId),
        }
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, skills]
  );

  // Save the workflow
  const handleSaveWorkflow = async () => {
    if (!workflowName) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a name for your workflow',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Prepare workflow data
      const workflowData = {
        name: workflowName,
        description: workflowDescription,
        isPublic: true,
        workflowDefinition: {
          nodes: nodes.map(node => ({
            id: node.id,
            type: node.type,
            position: node.position,
            data: node.data,
          })),
          edges: edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
          })),
        }
      };

      // Send to API
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save workflow');
      }

      toast({
        title: 'Success',
        description: 'Workflow saved successfully',
      });

      // Redirect to the workflow list or detail page
      // window.location.href = '/dashboard/marketplace/workflows';
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to save workflow',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add a node through the dialog
  const handleAddNode = () => {
    if (!nodeName) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a name for the node',
        variant: 'destructive',
      });
      return;
    }

    const newNode: Node = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position: { x: 100, y: 100 },
      data: { 
        label: nodeName,
        name: nodeName,
        skill: nodeType === 'skill' && selectedSkill ? 
          skills.find(s => s.id === selectedSkill) : undefined,
      }
    };

    setNodes((nds) => nds.concat(newNode));
    setIsAddingNode(false);
    setNodeName('');
    setNodeType('skill');
    setSelectedSkill(null);
  };

  // Handle node selection for configuration
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (['codeGen', 'debugAssist', 'resourceOpt'].includes(node.type)) {
      setSelectedNode(node);
      setIsConfigOpen(true);
    }
  }, []);

  // Update node config
  const handleUpdateNodeConfig = useCallback((config: Record<string, any>) => {
    if (!selectedNode) return;

    setNodes((nds: Node[]) =>
      nds.map((node: Node) => {
        if (node.id === selectedNode.id) {
          // Save config to node data
          node.data = {
            ...node.data,
            config
          };
        }
        return node;
      })
    );
  }, [selectedNode, setNodes]);

  // Close config dialog
  const handleCloseConfig = useCallback(() => {
    setIsConfigOpen(false);
    setSelectedNode(null);
  }, []);

  // Get config component based on node type
  const getConfigComponent = useCallback(() => {
    if (!selectedNode) return null;

    switch (selectedNode.type) {
      case 'codeGen':
        return <CodeGenConfig node={selectedNode} onUpdateConfig={handleUpdateNodeConfig} />;
      case 'debugAssist':
        return <DebugAssistConfig node={selectedNode} onUpdateConfig={handleUpdateNodeConfig} />;
      case 'resourceOpt':
        return <ResourceOptConfig node={selectedNode} onUpdateConfig={handleUpdateNodeConfig} />;
      default:
        return null;
    }
  }, [selectedNode, handleUpdateNodeConfig]);

  // Create drag handlers for the sidebar
  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string, skillId?: string) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    if (skillId) {
      event.dataTransfer.setData('application/reactflow/skillId', skillId);
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workflow Builder</h1>
          <p className="text-muted-foreground">Create complex AI workflows by connecting skills together</p>
        </div>
        <Button onClick={handleSaveWorkflow} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Workflow'}
        </Button>
      </div>

      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="workflow-name">Workflow Name</Label>
            <Input 
              id="workflow-name" 
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Enter workflow name" 
            />
          </div>
          <div>
            <Label htmlFor="workflow-description">Description</Label>
            <Input 
              id="workflow-description" 
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              placeholder="Describe what this workflow does" 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-6 h-[600px]">
        <div className="col-span-1 border rounded-lg p-4 overflow-y-auto">
          <h3 className="font-medium mb-4">Components</h3>
          
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-gray-300 p-3 rounded-md cursor-move bg-gray-50 hover:bg-gray-100 text-center"
              draggable
              onDragStart={(event) => onDragStart(event, 'input')}
            >
              Input Node
            </div>
            
            <div 
              className="border-2 border-dashed border-gray-300 p-3 rounded-md cursor-move bg-gray-50 hover:bg-gray-100 text-center"
              draggable
              onDragStart={(event) => onDragStart(event, 'output')}
            >
              Output Node
            </div>
            
            <div 
              className="border-2 border-dashed border-gray-300 p-3 rounded-md cursor-move bg-gray-50 hover:bg-gray-100 text-center"
              draggable
              onDragStart={(event) => onDragStart(event, 'condition')}
            >
              Condition Node
            </div>
            
            <h3 className="font-medium mb-2 mt-6">Skills</h3>
            
            {skills.map((skill) => (
              <div 
                key={skill.id}
                className="border-2 border-dashed border-blue-300 p-3 rounded-md cursor-move bg-blue-50 hover:bg-blue-100"
                draggable
                onDragStart={(event) => onDragStart(event, 'skill', skill.id)}
              >
                <div className="font-medium text-sm">{skill.name}</div>
                <div className="text-xs text-gray-500 truncate">{skill.description}</div>
              </div>
            ))}
            
            <h3 className="font-medium mb-2 mt-6">Advanced AI Workflows</h3>
            
            <div 
              className="border-2 border-dashed border-emerald-300 p-3 rounded-md cursor-move bg-emerald-50 hover:bg-emerald-100"
              draggable
              onDragStart={(event) => onDragStart(event, 'codeGen')}
            >
              <div className="font-medium text-sm">Natural Language Code Gen</div>
              <div className="text-xs text-gray-500">Generate code from natural language</div>
            </div>
            
            <div 
              className="border-2 border-dashed border-red-300 p-3 rounded-md cursor-move bg-red-50 hover:bg-red-100"
              draggable
              onDragStart={(event) => onDragStart(event, 'debugAssist')}
            >
              <div className="font-medium text-sm">AI Debugging Assistant</div>
              <div className="text-xs text-gray-500">Fix and explain code errors</div>
            </div>
            
            <div 
              className="border-2 border-dashed border-indigo-300 p-3 rounded-md cursor-move bg-indigo-50 hover:bg-indigo-100"
              draggable
              onDragStart={(event) => onDragStart(event, 'resourceOpt')}
            >
              <div className="font-medium text-sm">Resource Optimizer</div>
              <div className="text-xs text-gray-500">Optimize code for resource usage</div>
            </div>
          </div>
          
          <Dialog open={isAddingNode} onOpenChange={setIsAddingNode}>
            <DialogTrigger asChild>
              <Button className="w-full mt-4">Add Node</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Node</DialogTitle>
                <DialogDescription>
                  Create a new node for your workflow.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="node-type">Node Type</Label>
                  <Select value={nodeType} onValueChange={setNodeType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select node type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="input">Input</SelectItem>
                      <SelectItem value="output">Output</SelectItem>
                      <SelectItem value="skill">Skill</SelectItem>
                      <SelectItem value="condition">Condition</SelectItem>
                      <SelectItem value="codeGen">Natural Language Code Gen</SelectItem>
                      <SelectItem value="debugAssist">AI Debugging Assistant</SelectItem>
                      <SelectItem value="resourceOpt">Resource Optimizer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="node-name">Node Name</Label>
                  <Input 
                    id="node-name" 
                    value={nodeName}
                    onChange={(e) => setNodeName(e.target.value)}
                    placeholder="Enter node name" 
                  />
                </div>
                
                {nodeType === 'skill' && (
                  <div className="space-y-2">
                    <Label htmlFor="skill-select">Select Skill</Label>
                    <Select value={selectedSkill || ''} onValueChange={setSelectedSkill}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a skill" />
                      </SelectTrigger>
                      <SelectContent>
                        {skills.map((skill) => (
                          <SelectItem key={skill.id} value={skill.id}>
                            {skill.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingNode(false)}>Cancel</Button>
                <Button onClick={handleAddNode}>Add Node</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Configuration Dialog for advanced nodes */}
          <Dialog open={isConfigOpen} onOpenChange={handleCloseConfig}>
            <DialogContent className="sm:max-w-[600px]">
              {getConfigComponent()}
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="col-span-5 border rounded-lg" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
              onNodeClick={onNodeClick}
            >
              <Controls />
              <Background gap={16} size={1} />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}
