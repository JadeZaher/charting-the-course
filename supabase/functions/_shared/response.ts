// Shared response utilities for Supabase Edge Functions

import { corsHeaders } from "./auth.ts";
import type { ApiResponse } from "./types.ts";

/**
 * Create a successful JSON response
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): Response {
  const response: ApiResponse<T> = { data };
  return new Response(JSON.stringify(response), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Create an error JSON response
 */
export function errorResponse(
  error: string,
  details?: unknown,
  status: number = 400
): Response {
  const response: ApiResponse<never> = { error, details };
  return new Response(JSON.stringify(response), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(message: string = "Unauthorized"): Response {
  return errorResponse(message, undefined, 401);
}

/**
 * Create a forbidden response
 */
export function forbiddenResponse(message: string = "Forbidden"): Response {
  return errorResponse(message, undefined, 403);
}

/**
 * Create a not found response
 */
export function notFoundResponse(message: string = "Not found"): Response {
  return errorResponse(message, undefined, 404);
}

