import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"
import { OpenMemory } from "openmemory-js"

const mem = new OpenMemory({ mode: "local" })

const server = new Server(
    { name: "openmemory-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "query_memory",
            description: "search long term memory",
            inputSchema: {
                type: "object",
                properties: { query: { type: "string" } },
                required: ["query"],
            },
        },
        {
            name: "add_memory",
            description: "store new memory",
            inputSchema: {
                type: "object",
                properties: { content: { type: "string" } },
                required: ["content"],
            },
        },
    ],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params

    if (name === "query_memory") {
        const q = String(args?.query)
        const res = await mem.query(q)
        return { content: [{ type: "text", text: JSON.stringify(res) }] }
    }

    if (name === "add_memory") {
        const c = String(args?.content)
        await mem.add(c, { user_id: "default" })
        return { content: [{ type: "text", text: "memory stored" }] }
    }

    throw new Error("unknown tool")
})

const main = async () => {
    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.error("mcp server running on stdio")
}

main().catch(console.error)
