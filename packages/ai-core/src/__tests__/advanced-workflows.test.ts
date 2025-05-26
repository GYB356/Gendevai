import { WorkflowExecutionEngine, Workflow } from '../workflow-engine';
import { generateCodeFromNaturalLanguage } from '../advanced-workflows/natural-language-code';
import { analyzeCodeAndFixErrors } from '../advanced-workflows/debugging-assistant';
import { optimizeCodeForResources } from '../advanced-workflows/resource-optimizer';

// Mock the necessary dependencies
jest.mock('../advanced-workflows/natural-language-code');
jest.mock('../advanced-workflows/debugging-assistant');
jest.mock('../advanced-workflows/resource-optimizer');

describe('Advanced AI Workflow Features', () => {
  let workflowEngine: WorkflowExecutionEngine;
  
  beforeEach(() => {
    workflowEngine = new WorkflowExecutionEngine();
    
    // Reset all mocks before each test
    jest.resetAllMocks();
    
    // Setup default mock implementations
    (generateCodeFromNaturalLanguage as jest.Mock).mockResolvedValue({
      code: 'function example() { return "Hello World"; }',
      language: 'typescript',
      explanation: 'A simple hello world function'
    });
    
    (analyzeCodeAndFixErrors as jest.Mock).mockResolvedValue({
      originalCode: 'function example() { return "Hello World"; }',
      fixedCode: 'function example(): string { return "Hello World"; }',
      errors: ['Missing return type'],
      fixes: ['Added explicit return type']
    });
    
    (optimizeCodeForResources as jest.Mock).mockResolvedValue({
      originalCode: 'function example(): string { return "Hello World"; }',
      optimizedCode: 'function example(): string { return "Hello World"; }',
      metrics: {
        memory: { before: '10KB', after: '10KB', improvement: '0%' },
        cpu: { before: '5ms', after: '5ms', improvement: '0%' }
      },
      recommendations: ['No optimizations needed for this simple function']
    });
  });
  
  test('should execute a natural language code generation workflow', async () => {
    const workflow: Workflow = {
      id: 'nl-code-gen-workflow',
      name: 'Natural Language Code Generator',
      description: 'Generates code from natural language',
      nodes: [
        {
          id: 'input-node',
          type: 'input',
          position: { x: 100, y: 100 },
          config: { name: 'description' },
          connections: [{ source: 'input-node', target: 'code-gen-node' }]
        },
        {
          id: 'code-gen-node',
          type: 'codeGen',
          position: { x: 300, y: 100 },
          config: { language: 'typescript', framework: 'react' },
          connections: [{ source: 'code-gen-node', target: 'output-node' }]
        },
        {
          id: 'output-node',
          type: 'output',
          position: { x: 500, y: 100 },
          config: { name: 'generatedCode' },
          connections: []
        }
      ]
    };
    
    const result = await workflowEngine.executeWorkflow(workflow, {
      description: 'Create a button component that shows a counter'
    });
    
    expect(result.success).toBe(true);
    expect(result.output).toHaveProperty('generatedCode');
    expect(generateCodeFromNaturalLanguage).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Create a button component that shows a counter',
        language: 'typescript',
        framework: 'react'
      })
    );
  });
  
  test('should execute a debugging workflow', async () => {
    const workflow: Workflow = {
      id: 'debug-workflow',
      name: 'Debug Assistant Workflow',
      description: 'Analyzes and fixes code errors',
      nodes: [
        {
          id: 'input-node',
          type: 'input',
          position: { x: 100, y: 100 },
          config: { name: 'code' },
          connections: [{ source: 'input-node', target: 'debug-node' }]
        },
        {
          id: 'debug-node',
          type: 'debugAssist',
          position: { x: 300, y: 100 },
          config: {},
          connections: [{ source: 'debug-node', target: 'output-node' }]
        },
        {
          id: 'output-node',
          type: 'output',
          position: { x: 500, y: 100 },
          config: { name: 'fixedCode' },
          connections: []
        }
      ]
    };
    
    const buggyCode = 'function sum(a, b) { return a + b; }';
    const result = await workflowEngine.executeWorkflow(workflow, {
      code: buggyCode
    });
    
    expect(result.success).toBe(true);
    expect(result.output).toHaveProperty('fixedCode');
    expect(analyzeCodeAndFixErrors).toHaveBeenCalledWith(
      expect.objectContaining({
        code: buggyCode
      })
    );
  });
  
  test('should execute a resource optimization workflow', async () => {
    const workflow: Workflow = {
      id: 'optimize-workflow',
      name: 'Resource Optimization Workflow',
      description: 'Optimizes code for better resource usage',
      nodes: [
        {
          id: 'input-node',
          type: 'input',
          position: { x: 100, y: 100 },
          config: { name: 'code' },
          connections: [{ source: 'input-node', target: 'optimize-node' }]
        },
        {
          id: 'optimize-node',
          type: 'resourceOpt',
          position: { x: 300, y: 100 },
          config: { targetMetrics: ['memory', 'cpu'] },
          connections: [{ source: 'optimize-node', target: 'output-node' }]
        },
        {
          id: 'output-node',
          type: 'output',
          position: { x: 500, y: 100 },
          config: { name: 'optimizedCode' },
          connections: []
        }
      ]
    };
    
    const unoptimizedCode = `
      function processData(data) {
        const results = [];
        for (let i = 0; i < data.length; i++) {
          results.push(data[i] * 2);
        }
        return results;
      }
    `;
    
    const result = await workflowEngine.executeWorkflow(workflow, {
      code: unoptimizedCode
    });
    
    expect(result.success).toBe(true);
    expect(result.output).toHaveProperty('optimizedCode');
    expect(optimizeCodeForResources).toHaveBeenCalledWith(
      expect.objectContaining({
        code: unoptimizedCode,
        targetMetrics: ['memory', 'cpu']
      })
    );
  });
  
  test('should execute a complete workflow with all three advanced nodes', async () => {
    const workflow: Workflow = {
      id: 'complete-workflow',
      name: 'Complete Advanced Workflow',
      description: 'Generates, debugs, and optimizes code',
      nodes: [
        {
          id: 'input-node',
          type: 'input',
          position: { x: 100, y: 100 },
          config: { name: 'description' },
          connections: [{ source: 'input-node', target: 'code-gen-node' }]
        },
        {
          id: 'code-gen-node',
          type: 'codeGen',
          position: { x: 300, y: 100 },
          config: { language: 'typescript', framework: 'react' },
          connections: [{ source: 'code-gen-node', target: 'debug-node' }]
        },
        {
          id: 'debug-node',
          type: 'debugAssist',
          position: { x: 500, y: 100 },
          config: {},
          connections: [{ source: 'debug-node', target: 'optimize-node' }]
        },
        {
          id: 'optimize-node',
          type: 'resourceOpt',
          position: { x: 700, y: 100 },
          config: { targetMetrics: ['memory', 'cpu'] },
          connections: [{ source: 'optimize-node', target: 'output-node' }]
        },
        {
          id: 'output-node',
          type: 'output',
          position: { x: 900, y: 100 },
          config: { name: 'finalCode' },
          connections: []
        }
      ]
    };
    
    const result = await workflowEngine.executeWorkflow(workflow, {
      description: 'Create a React component that fetches and displays user data'
    });
    
    expect(result.success).toBe(true);
    expect(result.output).toHaveProperty('finalCode');
    expect(generateCodeFromNaturalLanguage).toHaveBeenCalled();
    expect(analyzeCodeAndFixErrors).toHaveBeenCalled();
    expect(optimizeCodeForResources).toHaveBeenCalled();
  });
});
