import { WorkflowExecutionEngine } from "@gendevai/ai-core";
import { db } from "@gendevai/database";
import { NextRequest, NextResponse } from "next/server";

/**
 * API route for AI Workflows
 */
export async function GET(req: NextRequest) {
  try {
    // Query parameters
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const isPublic = searchParams.get("public") === "true";
    
    // In a real implementation, query the database for workflows
    // For now, return a sample workflow
    const sampleWorkflow = {
      id: "sample-workflow",
      name: "Sample Code Improvement Workflow",
      description: "Analyzes code, generates tests, and adds documentation",
      isPublic: true,
      isVerified: true,
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      nodes: [
        {
          id: "code-input",
          type: "input",
          position: { x: 100, y: 100 },
          config: { name: "code" },
          connections: [{ source: "code-input", target: "code-reviewer" }]
        },
        {
          id: "code-reviewer",
          type: "skill",
          skillId: "code-reviewer",
          position: { x: 400, y: 100 },
          config: {},
          connections: [{ source: "code-reviewer", target: "test-generator" }]
        },
        {
          id: "test-generator",
          type: "skill",
          skillId: "unit-test-generator",
          position: { x: 700, y: 100 },
          config: {},
          connections: [{ source: "test-generator", target: "output-node" }]
        },
        {
          id: "output-node",
          type: "output",
          position: { x: 1000, y: 100 },
          config: { name: "result" },
          connections: []
        }
      ]
    };
    
    const workflows = [sampleWorkflow];
    
    return NextResponse.json({
      workflows,
      total: workflows.length,
    });
  } catch (error) {
    console.error("Error in workflows API:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}

/**
 * Execute a workflow with the provided inputs
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workflowId, inputs } = body;
    
    if (!workflowId || !inputs) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }
    
    // In a real implementation, fetch the workflow from the database
    // For now, use a sample workflow if the ID matches
    if (workflowId !== "sample-workflow") {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }
    
    const sampleWorkflow = {
      id: "sample-workflow",
      name: "Sample Code Improvement Workflow",
      description: "Analyzes code, generates tests, and adds documentation",
      nodes: [
        {
          id: "code-input",
          type: "input",
          position: { x: 100, y: 100 },
          config: { name: "code" },
          connections: [{ source: "code-input", target: "code-reviewer" }]
        },
        {
          id: "code-reviewer",
          type: "skill",
          skillId: "code-reviewer",
          position: { x: 400, y: 100 },
          config: {},
          connections: [{ source: "code-reviewer", target: "test-generator" }]
        },
        {
          id: "test-generator",
          type: "skill",
          skillId: "unit-test-generator",
          position: { x: 700, y: 100 },
          config: {},
          connections: [{ source: "test-generator", target: "output-node" }]
        },
        {
          id: "output-node",
          type: "output",
          position: { x: 1000, y: 100 },
          config: { name: "result" },
          connections: []
        }
      ]
    };
    
    // Execute the workflow
    const workflowEngine = new WorkflowExecutionEngine();
    const result = await workflowEngine.executeWorkflow(sampleWorkflow, inputs);
    
    // In a real implementation, save execution stats to DB
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error executing workflow:", error);
    return NextResponse.json(
      { error: "Failed to execute workflow" },
      { status: 500 }
    );
  }
}
