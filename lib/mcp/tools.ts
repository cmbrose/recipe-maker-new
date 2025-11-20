/**
 * MCP Tools Registry
 * 
 * Central registry of all available MCP tools.
 * Add new tools here to make them available via the MCP API.
 */

import type { MCPTool } from './types';
import { listRecipesTool } from './tools/list-recipes';
import z from 'zod';
import { getRecipeTool } from './tools/get-recipe';
import { createRecipeTool } from './tools/create-recipe';

/**
 * All available MCP tools
 */
export const MCP_TOOLS: MCPTool<z.ZodType>[] = [
  listRecipesTool,
  getRecipeTool,
  createRecipeTool,
];
