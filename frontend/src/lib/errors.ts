// Error handling utilities for consistent error management

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class APIError extends AppError {
  constructor(
    message: string,
    status: number,
    public response?: any
  ) {
    super(message, 'API_ERROR', status);
    this.name = 'APIError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export function handleApiError(error: unknown): never {
  if (error instanceof APIError) {
    throw error;
  }
  
  if (error instanceof Error) {
    throw new APIError(error.message, 500);
  }
  
  throw new APIError('An unexpected error occurred', 500);
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError && error.message.includes('fetch');
}

export function getUserFriendlyErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Network error. Please check your connection and try again.';
  }
  
  if (error instanceof APIError) {
    switch (error.status) {
      case 401:
        return 'You need to log in again.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.message || 'Something went wrong. Please try again.';
    }
  }
  
  return getErrorMessage(error);
}