// API response utilities for Next.js API routes

import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Standard API error response
 */
export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}

/**
 * Standard success response with data
 */
export interface ApiSuccess<T> {
  data: T;
}

/**
 * Create a success response
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

/**
 * Create an error response
 */
export function errorResponse(
  error: string,
  message: string,
  status = 400,
  details?: unknown
): NextResponse {
  const response: ApiError = { error, message };
  if (details) {
    response.details = details;
  }
  return NextResponse.json(response, { status });
}

/**
 * Handle validation errors from Zod
 */
export function validationErrorResponse(error: z.ZodError): NextResponse {
  const errors = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return errorResponse(
    'Validation Error',
    'Invalid request data',
    400,
    errors
  );
}

/**
 * Handle not found errors
 */
export function notFoundResponse(resource: string, id?: string): NextResponse {
  const message = id
    ? `${resource} with id '${id}' not found`
    : `${resource} not found`;

  return errorResponse('Not Found', message, 404);
}

/**
 * Handle server errors
 */
export function serverErrorResponse(error: Error): NextResponse {
  console.error('Server error:', error);

  return errorResponse(
    'Internal Server Error',
    'An unexpected error occurred',
    500,
    process.env.NODE_ENV === 'development' ? error.message : undefined
  );
}

/**
 * Wrap an async API handler with error handling
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationErrorResponse(error);
      }

      if (error instanceof Error) {
        return serverErrorResponse(error);
      }

      return serverErrorResponse(new Error('Unknown error occurred'));
    }
  };
}
