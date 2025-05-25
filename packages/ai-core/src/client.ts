import OpenAI from "openai";

// LLM Client interface for abstraction
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface GenerateCompletionResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LLMClient {
  generateCompletion(request: GenerateCompletionRequest): Promise<GenerateCompletionResponse>;
}

// OpenAI implementation of LLMClient
export class OpenAIClient implements LLMClient {
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  async generateCompletion(request: GenerateCompletionRequest): Promise<GenerateCompletionResponse> {
    const response = await this.client.chat.completions.create({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      top_p: request.top_p,
      frequency_penalty: request.frequency_penalty,
      presence_penalty: request.presence_penalty,
    });

    return {
      choices: response.choices.map(choice => ({
        message: {
          content: choice.message.content || '',
          role: choice.message.role
        },
        finish_reason: choice.finish_reason || 'stop'
      })),
      usage: response.usage ? {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens
      } : undefined
    };
  }
}

// Initialize the OpenAI client with API key from environment variables
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default LLM client instance
export const defaultLLMClient = new OpenAIClient();
