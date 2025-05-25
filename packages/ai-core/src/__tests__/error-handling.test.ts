/**
 * Tests for error handling utilities
 */

import { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  ErrorCode,
  withRetry,
  withTimeout,
  CircuitBreaker 
} from '../error-handling';

describe('AppError', () => {
  it('should create error with all properties', () => {
    const context = { userId: '123', action: 'test' };
    const error = new AppError('Test error', ErrorCode.VALIDATION_ERROR, 400, true, context);
    
    expect(error.message).toBe('Test error');
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
    expect(error.context).toEqual(context);
    expect(error.timestamp).toBeInstanceOf(Date);
  });

  it('should serialize to JSON correctly', () => {
    const error = new AppError('Test error', ErrorCode.API_ERROR, 500);
    const json = error.toJSON();
    
    expect(json).toHaveProperty('name', 'AppError');
    expect(json).toHaveProperty('message', 'Test error');
    expect(json).toHaveProperty('code', ErrorCode.API_ERROR);
    expect(json).toHaveProperty('statusCode', 500);
    expect(json).toHaveProperty('timestamp');
    expect(json).toHaveProperty('stack');
  });
});

describe('ValidationError', () => {
  it('should create validation error with correct defaults', () => {
    const error = new ValidationError('Invalid input');
    
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
  });
});

describe('AuthenticationError', () => {
  it('should create auth error with default message', () => {
    const error = new AuthenticationError();
    
    expect(error.message).toBe('Authentication required');
    expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(error.statusCode).toBe(401);
  });
});

describe('withRetry', () => {
  it('should succeed on first attempt', async () => {
    const mockOperation = jest.fn().mockResolvedValue('success');
    
    const result = await withRetry(mockOperation);
    
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  it('should retry on network error', async () => {
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue('success');
    
    const result = await withRetry(mockOperation, {
      maxAttempts: 3,
      baseDelay: 10,
      shouldRetry: () => true
    });
    
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(2);
  });

  it('should throw after max attempts', async () => {
    const error = new Error('Persistent error');
    const mockOperation = jest.fn().mockRejectedValue(error);
    
    await expect(withRetry(mockOperation, {
      maxAttempts: 2,
      baseDelay: 1,
      shouldRetry: () => true
    })).rejects.toThrow('Persistent error');
    
    expect(mockOperation).toHaveBeenCalledTimes(2);
  });
});

describe('withTimeout', () => {
  it('should resolve before timeout', async () => {
    const promise = Promise.resolve('success');
    
    const result = await withTimeout(promise, 1000);
    
    expect(result).toBe('success');
  });

  it('should timeout after specified time', async () => {
    const promise = new Promise(resolve => setTimeout(() => resolve('late'), 200));
    
    await expect(withTimeout(promise, 100)).rejects.toThrow('Operation timed out after 100ms');
  });
});

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker(2, 100, 50);
  });

  it('should execute successfully when closed', async () => {
    const mockOperation = jest.fn().mockResolvedValue('success');
    
    const result = await circuitBreaker.execute(mockOperation);
    
    expect(result).toBe('success');
    expect(circuitBreaker.getState().state).toBe('CLOSED');
  });

  it('should open circuit after threshold failures', async () => {
    const mockOperation = jest.fn().mockRejectedValue(new Error('Failure'));
    
    // First failure
    await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('Failure');
    expect(circuitBreaker.getState().state).toBe('CLOSED');
    
    // Second failure - should open circuit
    await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('Failure');
    expect(circuitBreaker.getState().state).toBe('OPEN');
    
    // Third call should be rejected immediately
    await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('Circuit breaker is OPEN');
    expect(mockOperation).toHaveBeenCalledTimes(2);
  });
});
