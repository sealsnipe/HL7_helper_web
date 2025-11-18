# MCP Fetch Tool - Instructions for AI Agents

This document provides instructions for AI agents (like Claude) on how to use the MCP Fetch Tool.

## Overview

The MCP Fetch Tool allows AI agents to retrieve web content from the internet. This enables you to access up-to-date information from websites and provide it to users.

## How to Use the Fetch Tool

As an AI agent, you can use the fetch tool with the following syntax:

```
fetch(url, [options])
```

Where:
- `url`: The URL of the webpage you want to fetch (required)
- `options`: Optional parameters to customize the fetch request

### Available Options

- `max_length`: Maximum number of characters to return (default: 5000)
- `start_index`: Start content from this character index (default: 0)
- `raw`: Get raw HTML content without markdown conversion (default: false)

### Examples

Basic usage:
```
fetch("https://example.com")
```

With options:
```
fetch("https://example.com", { max_length: 10000, start_index: 0, raw: false })
```

Fetching content in chunks (for long pages):
```
// First chunk
fetch("https://example.com", { max_length: 5000, start_index: 0 })

// Second chunk (if the response indicates more content is available)
fetch("https://example.com", { max_length: 5000, start_index: 5000 })
```

## Best Practices

1. **Check for truncation**: If the content is truncated, the response will include a message indicating how to get more content.

2. **Handle errors gracefully**: If a fetch fails, inform the user about the issue and suggest alternatives.

3. **Respect user privacy**: Only fetch URLs that are relevant to the user's query.

4. **Cite sources**: When providing information from fetched content, cite the source URL.

5. **Summarize when appropriate**: For large content, provide a concise summary rather than the full text.

## Limitations

- Some websites may block access via the fetch tool due to robots.txt restrictions
- Content is converted to markdown, which may lose some formatting
- JavaScript-rendered content may not be fully captured
- The tool cannot interact with forms or perform actions on websites

## Troubleshooting

If you encounter issues:
- Check if the URL is valid and accessible
- Try using the raw option if markdown conversion fails
- For large pages, use multiple fetch requests with different start_index values
