# MCP Fetch Tool - Usage Guide

This document provides instructions on how to use the MCP Fetch Tool that has been installed in your system.

## What is MCP Fetch?

MCP Fetch is a Model Context Protocol server that provides web content fetching capabilities. It enables LLMs like Claude to retrieve and process content from web pages, converting HTML to markdown for easier consumption.

## Installation

The MCP Fetch Tool has been installed in `%APPDATA%\roo code\mcp\fetch`. To complete the installation, you need to install the required Python dependencies by running the `install.bat` script:

1. Navigate to `%APPDATA%\roo code\mcp\fetch` in File Explorer
2. Double-click on `install.bat` to run it
3. This will install all the necessary Python packages

## Configuration for Claude

To use the MCP Fetch Tool with Claude, you need to add the following configuration to your Claude settings:

```json
"mcpServers": {
  "fetch": {
    "command": "python",
    "args": ["-m", "mcp_server_fetch"]
  }
}
```

You can find this configuration in the `claude-config.json` file in the installation directory.

## Testing the Installation

To test if the MCP Fetch Tool is working correctly:

1. Navigate to `%APPDATA%\roo code\mcp\fetch` in File Explorer
2. Double-click on `test.bat` to run it
3. This will start the MCP Fetch server in the foreground
4. Press Ctrl+C to exit when done testing

## Using the MCP Fetch Tool with Claude

Once configured, you can use the MCP Fetch Tool with Claude in two ways:

1. **As a tool**: Claude can use the `fetch` tool to retrieve web content autonomously
   - Example: "Use the fetch tool to get information from https://example.com"

2. **As a prompt**: You can use the `fetch` prompt to manually fetch web content
   - Example: "Fetch https://example.com"

## Available Options

The MCP Fetch Tool supports the following options:

- `url` (string, required): URL to fetch
- `max_length` (integer, optional): Maximum number of characters to return (default: 5000)
- `start_index` (integer, optional): Start content from this character index (default: 0)
- `raw` (boolean, optional): Get raw content without markdown conversion (default: false)

## Customization

You can customize the behavior of the MCP Fetch Tool by adding arguments to the configuration:

- `--ignore-robots-txt`: Ignore robots.txt restrictions
- `--user-agent=YourUserAgent`: Use a custom User-Agent string
- `--proxy-url=YourProxyUrl`: Use a proxy for requests

Example configuration with customizations:

```json
"mcpServers": {
  "fetch": {
    "command": "python",
    "args": ["-m", "mcp_server_fetch", "--ignore-robots-txt", "--user-agent=MyCustomUserAgent"]
  }
}
```

## Troubleshooting

If you encounter issues with the MCP Fetch Tool:

1. Make sure all dependencies are installed correctly
2. Check that the Python version is 3.10 or higher
3. Verify that the configuration in Claude settings is correct
4. Try running the server manually to see if there are any error messages

For more detailed information, refer to the `README.md` file in the installation directory.
