/**
 * MCP Tools Registry
 * 
 * Central registry of all available MCP tools.
 * Add new tools here to make them available via the MCP API.
 */

import type { MCPTool } from './types';
import { listRecipesTool } from './tools/list-recipes';

/**
 * All available MCP tools
 */
export const MCP_TOOLS: MCPTool[] = [
  listRecipesTool,
  // Add more tools here as you build them:
  // getRecipeTool,
  // createRecipeTool,
  // updateRecipeTool,
  // deleteRecipeTool,
  // etc.
];
