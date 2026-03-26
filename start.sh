#!/bin/bash

# 学生课时管理 CRM 系统启动脚本

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "🚀 启动学生课时管理 CRM 系统..."
echo "📁 项目目录: $PROJECT_DIR"
echo ""

# 检查是否安装了 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到 Python3，请先安装 Python3"
    exit 1
fi

echo "✅ Python3 已安装"
echo ""
echo "🌐 启动本地服务器..."
echo "📍 访问地址: http://localhost:8000"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

cd "$PROJECT_DIR"
python3 -m http.server 8000
