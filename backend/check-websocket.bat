@echo off
chcp 65001 >nul
echo 🔍 WebSocket 连接检查
echo ======================================
echo.

:: 1. 检查后端是否运行
echo 1️⃣  检查后端服务...
curl -s http://localhost:3001/api/model-config >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 后端服务正常运行
) else (
    echo ❌ 后端服务未运行
    echo    请先启动后端: cd backend ^&^& npm start
    pause
    exit /b 1
)
echo.

:: 2. 提示运行测试工具
echo 2️⃣  运行 WebSocket 测试工具...
echo 请运行以下命令进行测试：
echo.
echo    cd backend
echo    node src/test/debug-websocket.js
echo.

:: 3. 提供快速触发命令
echo 3️⃣  触发测试工作流...
echo 在另一个终端运行：
echo.
echo    curl -X POST http://localhost:3001/api/exhibition/run ^
echo      -H "Content-Type: application/json" ^
echo      -d "{\"title\":\"WebSocket测试\",\"theme\":\"测试连接\"}"
echo.

echo ======================================
echo 检查完成！请按照上述提示进行测试
echo.
echo 📖 详细排查指南: WEBSOCKET_DEBUG_GUIDE.md
echo.
pause
