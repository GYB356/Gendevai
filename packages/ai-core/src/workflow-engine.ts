// AI Workflow Execution Engine
import { AISkillService, SkillInput } from "./ai-skill";

/**
 * Interface for a workflow node
 */
export interface WorkflowNode {
  id: string;
  type: "skill" | "condition" | "input" | "output";
  skillId?: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  connections: {
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }[];
}

/**
 * Interface for a workflow
 */
export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
}

/**
 * Interface for a workflow execution event
 */
export interface WorkflowExecutionEvent {
  nodeId: string;
  timestamp: Date;
  status: "started" | "completed" | "failed";
  input?: any;
  output?: any;
  error?: string;
}

/**
 * Service for executing AI workflows
 */
export class WorkflowExecutionEngine {
  private skillService: AISkillService;
  
  constructor() {
    this.skillService = new AISkillService();
  }

  /**
   * Validates a workflow before execution
   */
  private validateWorkflow(workflow: Workflow): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for required nodes
    const inputNodes = workflow.nodes.filter(node => node.type === "input");
    if (inputNodes.length === 0) {
      errors.push("Workflow must have at least one input node");
    }
    
    const outputNodes = workflow.nodes.filter(node => node.type === "output");
    if (outputNodes.length === 0) {
      errors.push("Workflow must have at least one output node");
    }
    
    // Check for skill nodes without skillId
    const skillNodesWithoutId = workflow.nodes.filter(node => 
      node.type === "skill" && !node.skillId
    );
    if (skillNodesWithoutId.length > 0) {
      errors.push(`${skillNodesWithoutId.length} skill node(s) are missing skillId`);
    }
    
    // Check for disconnected nodes
    const connectedNodeIds = new Set<string>();
    
    // Add all target nodes to the set
    workflow.nodes.forEach(node => {
      node.connections.forEach(conn => {
        connectedNodeIds.add(conn.target);
      });
    });
    
    // Add all source nodes to the set
    workflow.nodes.forEach(node => {
      node.connections.forEach(conn => {
        connectedNodeIds.add(conn.source);
      });
    });
    
    // Find nodes that aren't connected
    const disconnectedNodes = workflow.nodes.filter(node => 
      !connectedNodeIds.has(node.id) && node.type !== "input" && node.type !== "output"
    );
    if (disconnectedNodes.length > 0) {
      errors.push(`${disconnectedNodes.length} node(s) are disconnected from the workflow`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Executes a workflow with the provided inputs
   */
  async executeWorkflow(
    workflow: Workflow,
    initialInputs: Record<string, any> = {}
  ): Promise<{
    success: boolean;
    output: any;
    events: WorkflowExecutionEvent[];
    error?: string;
  }> {
    // Validate the workflow
    const validation = this.validateWorkflow(workflow);
    if (!validation.valid) {
      return {
        success: false,
        output: null,
        events: [],
        error: `Workflow validation failed: ${validation.errors.join(", ")}`
      };
    }
    
    const events: WorkflowExecutionEvent[] = [];
    const nodeOutputs: Record<string, any> = {};
    
    // Initialize with provided inputs
    const inputNodes = workflow.nodes.filter(node => node.type === "input");
    for (const inputNode of inputNodes) {
      const inputName = inputNode.config.name || "input";
      nodeOutputs[inputNode.id] = initialInputs[inputName] || inputNode.config.defaultValue;
      
      events.push({
        nodeId: inputNode.id,
        timestamp: new Date(),
        status: "completed",
        output: nodeOutputs[inputNode.id]
      });
    }
    
    // Sort nodes in execution order (simplified topological sort)
    // In a real implementation, this would be a proper topological sort
    const inputNodeIds = new Set(inputNodes.map(node => node.id));
    const remainingNodes = workflow.nodes.filter(node => !inputNodeIds.has(node.id));
    
    // Execute nodes
    for (const node of remainingNodes) {
      // Record execution start
      events.push({
        nodeId: node.id,
        timestamp: new Date(),
        status: "started"
      });
      
      try {
        // Get inputs for this node
        const nodeInputs: Record<string, any> = {};
        
        // Find connections where this node is the target
        const incomingConnections = workflow.nodes.flatMap(n => 
          n.connections.filter(conn => conn.target === node.id)
        );
        
        for (const conn of incomingConnections) {
          // Get the output from the source node
          const sourceOutput = nodeOutputs[conn.source];
          
          // If we have a sourceHandle, it indicates which property to use
          const inputName = conn.targetHandle || "input";
          nodeInputs[inputName] = sourceOutput;
        }
        
        // Process the node based on its type
        if (node.type === "skill" && node.skillId) {
          // Execute the skill
          const result = await this.skillService.executeSkill(
            { id: node.skillId } as any, // This would fetch the skill in a real implementation
            nodeInputs as SkillInput
          );
          
          if (result.success) {
            nodeOutputs[node.id] = result.output;
            
            // Record successful execution
            events.push({
              nodeId: node.id,
              timestamp: new Date(),
              status: "completed",
              input: nodeInputs,
              output: result.output
            });
          } else {
            // Record failed execution
            events.push({
              nodeId: node.id,
              timestamp: new Date(),
              status: "failed",
              input: nodeInputs,
              error: result.error
            });
            
            return {
              success: false,
              output: null,
              events,
              error: `Node ${node.id} failed: ${result.error}`
            };
          }
        } else if (node.type === "condition") {
          // Evaluate the condition
          const condition = node.config.condition;
          const conditionValue = this.evaluateCondition(condition, nodeInputs);
          nodeOutputs[node.id] = conditionValue;
          
          // Record condition evaluation
          events.push({
            nodeId: node.id,
            timestamp: new Date(),
            status: "completed",
            input: nodeInputs,
            output: conditionValue
          });
        } else if (node.type === "output") {
          // Store the output
          const outputName = node.config.name || "output";
          nodeOutputs[node.id] = nodeInputs;
          
          // Record output
          events.push({
            nodeId: node.id,
            timestamp: new Date(),
            status: "completed",
            input: nodeInputs,
            output: nodeOutputs[node.id]
          });
        }
      } catch (error) {
        // Record error
        events.push({
          nodeId: node.id,
          timestamp: new Date(),
          status: "failed",
          error: String(error)
        });
        
        return {
          success: false,
          output: null,
          events,
          error: `Node ${node.id} failed with error: ${error}`
        };
      }
    }
    
    // Get the final outputs
    const outputNodes = workflow.nodes.filter(node => node.type === "output");
    const finalOutput: Record<string, any> = {};
    
    for (const outputNode of outputNodes) {
      const outputName = outputNode.config.name || "output";
      finalOutput[outputName] = nodeOutputs[outputNode.id];
    }
    
    return {
      success: true,
      output: finalOutput,
      events
    };
  }

  /**
   * Evaluates a condition expression
   */
  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    // This is a simplified implementation
    // In a real implementation, you would use a proper expression evaluator with sandboxing
    
    try {
      // Create a function that evaluates the condition with the provided context
      const fn = new Function(...Object.keys(context), `return ${condition};`);
      return !!fn(...Object.values(context));
    } catch (error) {
      console.error("Error evaluating condition:", error);
      return false;
    }
  }
}
