@echo off
echo Installing MCP Fetch Server dependencies...
pip install httpx markdownify mcp protego pydantic readabilipy requests
echo Installation complete!
echo.
echo To use the MCP Fetch Server with Claude, add the following to your Claude settings:
echo.
echo "mcpServers": {
echo   "fetch": {
echo     "command": "python",
echo     "args": ["-m", "mcp_server_fetch"]
echo   }
echo }
echo.
echo You can run the server manually with: python -m mcp_server_fetch
pause
