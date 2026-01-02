#!/bin/bash

# WebSocket 快速检查脚本

echo "🔍 WebSocket 连接检查"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 检查后端是否运行
echo "1️⃣  检查后端服务..."
if curl -s http://localhost:3001/api/model-config > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端服务正常运行${NC}"
else
    echo -e "${RED}❌ 后端服务未运行${NC}"
    echo "   请先启动后端: cd backend && npm start"
    exit 1
fi
echo ""

# 2. 检查 WebSocket 端口
echo "2️⃣  检查 WebSocket 端口 (3001)..."
if netstat -an | grep -q ":3001.*LISTEN"; then
    echo -e "${GREEN}✅ 端口 3001 正在监听${NC}"
else
    echo -e "${RED}❌ 端口 3001 未监听${NC}"
    exit 1
fi
echo ""

# 3. 检查测试工具依赖
echo "3️⃣  检查测试工具依赖..."
if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Node.js 可用${NC}"
else
    echo -e "${RED}❌ Node.js 未安装${NC}"
    exit 1
fi
echo ""

# 4. 提示运行测试工具
echo "4️⃣  运行 WebSocket 测试工具..."
echo -e "${YELLOW}请运行以下命令进行测试：${NC}"
echo ""
echo "   cd backend"
echo "   node src/test/debug-websocket.js"
echo ""

# 5. 提供快速触发命令
echo "5️⃣  触发测试工作流..."
echo -e "${YELLOW}在另一个终端运行：${NC}"
echo ""
echo "   curl -X POST http://localhost:3001/api/exhibition/run \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"title\":\"WebSocket测试\",\"theme\":\"测试连接\"}'"
echo ""

echo "======================================"
echo -e "${GREEN}检查完成！请按照上述提示进行测试${NC}"
echo ""
echo "📖 详细排查指南: WEBSOCKET_DEBUG_GUIDE.md"
