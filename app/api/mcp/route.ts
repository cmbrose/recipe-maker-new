/**
 * Model Context Protocol (MCP) API Route
 * 
 * This endpoint exposes recipe management tools via the MCP protocol over HTTP.
 * Compatible with LLM chat applications like Claude Desktop, Cline, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { MCP_TOOLS } from '@/lib/mcp/tools';
import type { MCPRequest, MCPResponse } from '@/lib/mcp/types';
import z from 'zod';
import { auth } from '@/auth';
import { getOAuthProvider } from '@/lib/mcp/oauth/provider';
import type { TokenInfo } from '@/lib/mcp/oauth/provider';

/**
 * Handle MCP requests via POST
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as MCPRequest;
    
    // Validate JSON-RPC 2.0 format
    if (body.jsonrpc !== '2.0') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id,
        error: {
          code: -32600,
          message: 'Invalid Request: jsonrpc must be "2.0"',
        },
      } as MCPResponse);
    }

    const response: MCPResponse = {
      jsonrpc: '2.0',
      id: body.id,
    };

    // Handle different MCP methods
    switch (body.method) {
      case 'initialize':
        response.result = {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'recipe-maker-server',
            version: '1.0.0',
          },
        };
        break;

      case 'tools/list':
        response.result = {
          tools: getToolsList(),
        };
        break;

      case 'tools/call':
        response.result = await handleToolCall(request, body.params);
        break;

      default:
        response.error = {
          code: -32601,
          message: `Method not found: ${body.method}`,
        };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('MCP API error:', error);
    return NextResponse.json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error',
        data: error instanceof Error ? error.message : 'Unknown error',
      },
    } as MCPResponse, { status: 500 });
  }
}

/**
 * Get list of available tools (without handlers for client response)
 */
function getToolsList() {
  return MCP_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: z.toJSONSchema(tool.inputSchema),
  }));
}

/**
 * Extract and verify Bearer token from request
 */
async function verifyBearerToken(request: NextRequest): Promise<TokenInfo | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const provider = getOAuthProvider();
    const tokenInfo = await provider.verifyAccessToken(token);
    return tokenInfo || null;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Check authentication for tool execution
 * Supports both OAuth tokens (for MCP clients) and sessions (for browser/API)
 */
async function checkAuth(request: NextRequest): Promise<{ authenticated: boolean; user?: any }> {
  // First, try OAuth token authentication (for MCP clients)
  const tokenInfo = await verifyBearerToken(request);
  if (tokenInfo) {
    return {
      authenticated: true,
      user: {
        id: tokenInfo.userId,
        email: tokenInfo.userEmail,
      },
    };
  }

  // Fall back to session authentication (for browser/API)
  const session = await auth();
  if (session?.user) {
    return {
      authenticated: true,
      user: session.user,
    };
  }

  return { authenticated: false };
}

/**
 * Handle tool execution
 */
async function handleToolCall(request: NextRequest, params: any) {
  const { name, arguments: args } = params;

  // Find the tool by name
  const tool = MCP_TOOLS.find(t => t.name === name);

  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }

  if (tool.requiresAuth) {
    const authResult = await checkAuth(request);
    if (!authResult.authenticated) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Authentication required',
              message: 'You must be authenticated to use this tool. For MCP clients, please authorize using OAuth 2.0.',
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  try {
    // Parse and validate arguments using Zod schema
    const validatedArgs = tool.inputSchema.parse(args);

    // Execute the tool's handler with validated arguments
    return await tool.handler(validatedArgs);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Handle OPTIONS for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
