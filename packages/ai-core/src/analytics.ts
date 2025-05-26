// Analytics service for tracking workflow execution and performance
import { StructuredLogger } from '../logging';
import { ConfigManager } from '../config';

interface AnalyticsEvent {
  eventType: string;
  timestamp: Date;
  data: Record<string, any>;
}

interface WorkflowAnalyticsData {
  workflowId: string;
  workflowName: string;
  executionId: string;
  userId?: string;
  duration: number;
  nodeExecutions: {
    nodeId: string;
    nodeType: string;
    duration: number;
    success: boolean;
  }[];
  success: boolean;
  error?: string;
}

interface NodeAnalyticsData {
  workflowId: string;
  workflowName: string;
  executionId: string;
  nodeId: string;
  nodeType: string;
  duration: number;
  inputSize?: number;
  outputSize?: number;
  success: boolean;
  error?: string;
  metrics?: Record<string, any>;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private logger: StructuredLogger;
  private config: ConfigManager;
  private eventsBuffer: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    this.logger = StructuredLogger.getInstance();
    this.config = new ConfigManager();
    
    // Setup periodic flushing of analytics events
    const flushIntervalMs = this.config.get('analytics.flushIntervalMs', 60000); // Default 1 minute
    if (flushIntervalMs > 0) {
      this.flushInterval = setInterval(() => this.flush(), flushIntervalMs);
    }
  }
  
  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }
  
  /**
   * Track a workflow execution
   */
  public trackWorkflowExecution(data: WorkflowAnalyticsData): void {
    this.trackEvent('workflow_execution', data);
    
    // Additional tracking for advanced nodes
    const advancedNodeTypes = ['codeGen', 'debugAssist', 'resourceOpt'];
    const advancedNodeExecutions = data.nodeExecutions.filter(
      node => advancedNodeTypes.includes(node.nodeType)
    );
    
    if (advancedNodeExecutions.length > 0) {
      this.trackEvent('advanced_workflow_usage', {
        workflowId: data.workflowId,
        executionId: data.executionId,
        advancedNodeCount: advancedNodeExecutions.length,
        nodeTypes: advancedNodeExecutions.map(node => node.nodeType),
      });
    }
  }
  
  /**
   * Track a specific node execution
   */
  public trackNodeExecution(data: NodeAnalyticsData): void {
    // Track all node executions
    this.trackEvent('node_execution', data);
    
    // Special tracking for advanced AI nodes
    switch (data.nodeType) {
      case 'codeGen':
        this.trackEvent('code_generation', {
          ...data,
          eventType: 'code_generation',
        });
        break;
      case 'debugAssist':
        this.trackEvent('code_debugging', {
          ...data,
          eventType: 'code_debugging',
        });
        break;
      case 'resourceOpt':
        this.trackEvent('resource_optimization', {
          ...data,
          eventType: 'resource_optimization',
        });
        break;
    }
  }
  
  /**
   * Generic event tracking
   */
  private trackEvent(eventType: string, data: Record<string, any>): void {
    const event: AnalyticsEvent = {
      eventType,
      timestamp: new Date(),
      data,
    };
    
    this.eventsBuffer.push(event);
    
    // Auto-flush if buffer gets too large
    const maxBufferSize = this.config.get('analytics.maxBufferSize', 100);
    if (this.eventsBuffer.length >= maxBufferSize) {
      this.flush();
    }
  }
  
  /**
   * Flush analytics events to storage/API
   */
  private async flush(): Promise<void> {
    if (this.eventsBuffer.length === 0) {
      return;
    }
    
    const events = [...this.eventsBuffer];
    this.eventsBuffer = [];
    
    try {
      const analyticsEndpoint = this.config.get('analytics.endpoint', '');
      
      if (!analyticsEndpoint) {
        // If no endpoint is configured, just log events locally
        this.logger.info('Analytics events collected (no endpoint configured)', {
          eventCount: events.length,
          eventTypes: [...new Set(events.map(e => e.eventType))],
        });
        return;
      }
      
      // In a real implementation, send events to analytics service
      // For now, just log them
      this.logger.info('Analytics events sent', {
        eventCount: events.length,
        eventTypes: [...new Set(events.map(e => e.eventType))],
      });
      
      // Example of sending to an endpoint:
      // const response = await fetch(analyticsEndpoint, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ events }),
      // });
      
      // if (!response.ok) {
      //   throw new Error(`Failed to send analytics: ${response.status}`);
      // }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error sending analytics events: ${errorMessage}`, {
        eventCount: events.length,
      });
      
      // Put events back in the buffer to retry later
      this.eventsBuffer = [...events, ...this.eventsBuffer];
      
      // Cap the buffer size to prevent memory issues
      const maxBufferSize = this.config.get('analytics.maxBufferSize', 100);
      if (this.eventsBuffer.length > maxBufferSize) {
        this.eventsBuffer = this.eventsBuffer.slice(0, maxBufferSize);
        this.logger.warn('Analytics buffer exceeded max size, dropping oldest events');
      }
    }
  }
  
  /**
   * Clean up resources when service is no longer needed
   */
  public dispose(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Flush any remaining events
    this.flush();
  }
}
