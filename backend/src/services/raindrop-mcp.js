const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

let mcpClient = null;

async function initializeMCPClient() {
  if (mcpClient) return mcpClient;

  try {
    const transport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', '@liquidmetal-ai/raindrop-mcp'],
      env: {
        ...process.env,
        LM_API_KEY: process.env.LM_API_KEY,
      }
    });

    mcpClient = new Client({
      name: 'medscribe-client',
      version: '1.0.0',
    }, {
      capabilities: {}
    });

    await mcpClient.connect(transport);
    console.log('✅ Connected to Raindrop MCP server');
    
    return mcpClient;
  } catch (error) {
    console.error('❌ Failed to connect to Raindrop MCP:', error.message);
    throw error;
  }
}

async function callSmartInference(prompt) {
  try {
    const client = await initializeMCPClient();
    
    const result = await client.callTool({
      name: 'smart_inference',
      arguments: {
        prompt: prompt,
        max_tokens: 2000,
      }
    });

    return result;
  } catch (error) {
    console.error('SmartInference error:', error);
    throw error;
  }
}

module.exports = { callSmartInference, initializeMCPClient };
