#!/bin/bash

echo "設置 MCP 環境..."

# 1. 安裝依賴
npm install

# 2. 檢查配置文件
if [ ! -f ".env" ]; then
    echo "請複製 .env.example 為 .env 並填入正確的 API tokens"
    cp .env.example .env
fi

# 3. 複製 MCP 配置到系統目錄 (Windows)
if [[ "$OSTYPE" == "msys" ]]; then
    CLAUDE_CONFIG_DIR="$APPDATA/Claude"
    mkdir -p "$CLAUDE_CONFIG_DIR"
    cp claude-desktop-config.json "$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
    echo "已複製 MCP 配置到: $CLAUDE_CONFIG_DIR"
fi

# 4. 複製 MCP 配置到系統目錄 (Mac)  
if [[ "$OSTYPE" == "darwin"* ]]; then
    CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
    mkdir -p "$CLAUDE_CONFIG_DIR"
    cp claude-desktop-config.json "$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
    echo "已複製 MCP 配置到: $CLAUDE_CONFIG_DIR"
fi

echo "MCP 環境設置完成！請重啟 Claude Desktop 應用程式。"