/**
 * WebSocket 连接测试脚本
 * 运行方式: node backend/src/test/debug-websocket.js
 */

const WebSocket = require('ws');

const WS_URL = 'ws://localhost:3001';

console.log('🔌 WebSocket 调试工具');
console.log('=' .repeat(60));

let ws = null;
let messageStats = {
  total: 0,
  agentStatus: 0,
  progress: 0,
  log: 0,
  waitingForHuman: 0,
  iterationUpdate: 0,
  connectionStatus: 0,
  pong: 0,
  other: 0
};

function connect() {
  console.log(`\n📡 正在连接到 ${WS_URL}...`);

  ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    console.log('✅ WebSocket 连接成功！');
    console.log('📊 等待接收消息...\n');

    // 发送 ping 测试
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
        console.log('📤 已发送 ping 消息');
      }
    }, 1000);
  });

  ws.on('message', (data) => {
    messageStats.total++;

    try {
      const message = JSON.parse(data.toString());
      const type = message.type || 'unknown';

      if (messageStats.hasOwnProperty(type)) {
        messageStats[type]++;
      } else {
        messageStats.other++;
      }

      // 显示接收到的消息
      console.log(`\n📨 [${messageStats.total}] 收到消息: ${type}`);
      console.log('─'.repeat(60));

      if (type === 'agentStatus') {
        console.log(`  智能体: ${message.agentId}`);
        console.log(`  状态: ${message.status?.status}`);
        if (message.status?.error) {
          console.log(`  错误: ${message.status.error}`);
        }
      } else if (type === 'progress') {
        console.log(`  进度: ${message.progress}%`);
        console.log(`  步骤: ${message.currentStep}`);
      } else if (type === 'log') {
        console.log(`  级别: ${message.level}`);
        console.log(`  消息: ${message.message}`);
      } else if (type === 'waitingForHuman') {
        console.log(`  质量分数: ${(message.qualityEvaluation?.overallScore * 100).toFixed(1)}分`);
        console.log(`  迭代次数: ${message.iterationCount}`);
        console.log(`  修订目标: ${message.revisionTarget}`);
      } else if (type === 'iterationUpdate') {
        console.log(`  迭代次数: ${message.iterationCount}`);
        console.log(`  修订目标: ${message.revisionTarget}`);
      } else if (type === 'pong') {
        console.log(`  心跳响应`);
      } else if (type === 'connectionStatus') {
        console.log(`  连接状态: ${message.status}`);
        console.log(`  数据:`, message.data);
      } else {
        console.log('  完整消息:', JSON.stringify(message, null, 2));
      }

      // 每10条消息显示统计
      if (messageStats.total % 10 === 0) {
        console.log('\n📊 当前统计:');
        console.log(formatStats());
      }

    } catch (error) {
      console.error('❌ 解析消息失败:', error.message);
      console.log('  原始数据:', data.toString());
    }
  });

  ws.on('error', (error) => {
    console.error('\n❌ WebSocket 错误:', error.message);
  });

  ws.on('close', (code, reason) => {
    console.log(`\n🔌 WebSocket 连接已关闭`);
    console.log(`  代码: ${code}`);
    console.log(`  原因: ${reason.toString()}`);

    console.log('\n📊 最终统计:');
    console.log(formatStats());
  });

  // 定期发送心跳
  setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, 30000);
}

function formatStats() {
  return `
  总消息数: ${messageStats.total}
  ├─ agentStatus: ${messageStats.agentStatus}
  ├─ progress: ${messageStats.progress}
  ├─ log: ${messageStats.log}
  ├─ waitingForHuman: ${messageStats.waitingForHuman}
  ├─ iterationUpdate: ${messageStats.iterationUpdate}
  ├─ connectionStatus: ${messageStats.connectionStatus}
  ├─ pong: ${messageStats.pong}
  └─ other: ${messageStats.other}
`;
}

// 启动连接
connect();

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n\n⏹️  收到退出信号，正在关闭连接...');
  if (ws) {
    ws.close();
  }
  setTimeout(() => {
    process.exit(0);
  }, 500);
});
