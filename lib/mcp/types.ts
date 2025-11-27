/**
 * MCP (Model Context Protocol) Type Definitions
 */

import { z } from 'zod';

// MCP Protocol Types
export interface MCPRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id?: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPTool<TSchema extends z.ZodType> {
  name: string;
  description: string;
  inputSchema: TSchema;
  handler: (args: z.infer<TSchema>) => Promise<any>;
}
