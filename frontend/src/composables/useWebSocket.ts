import { ref, onMounted, onUnmounted } from 'vue'
import { useExhibitionStore } from '@/stores/exhibition'

export function useWebSocket() {
  const exhibitionStore = useExhibitionStore()
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const connectionStatus = ref('disconnected') // 'disconnected', 'connecting', 'connected', 'error'
  const heartbeatInterval = ref<NodeJS.Timeout | null>(null)

  const connect = () => {
    if (ws.value?.readyState === WebSocket.OPEN) {
      return
    }

    connectionStatus.value = 'connecting'

    // 根据环境选择 WebSocket URL
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'

    try {
      ws.value = new WebSocket(wsUrl)

      ws.value.onopen = () => {
        console.log('WebSocket 连接已建立')
        isConnected.value = true
        connectionStatus.value = 'connected'

        // 开始心跳
        startHeartbeat()
      }

      ws.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleWebSocketMessage(data)
        } catch (error) {
          console.error('解析 WebSocket 消息失败:', error)
        }
      }

      ws.value.onclose = () => {
        console.log('WebSocket 连接已关闭')
        isConnected.value = false
        connectionStatus.value = 'disconnected'

        // 停止心跳
        stopHeartbeat()

        // 自动重连
        setTimeout(() => {
          if (connectionStatus.value === 'disconnected') {
            connect()
          }
        }, 3000)
      }

      ws.value.onerror = (error) => {
        console.error('WebSocket 错误:', error)
        connectionStatus.value = 'error'
      }
    } catch (error) {
      console.error('创建 WebSocket 连接失败:', error)
      connectionStatus.value = 'error'
    }
  }

  const startHeartbeat = () => {
    stopHeartbeat() // 确保没有重复的心跳

    heartbeatInterval.value = setInterval(() => {
      if (ws.value?.readyState === WebSocket.OPEN) {
        sendMessage({ type: 'ping' })
      }
    }, 30000) // 每30秒发送一次心跳
  }

  const stopHeartbeat = () => {
    if (heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value)
      heartbeatInterval.value = null
    }
  }

  const disconnect = () => {
    stopHeartbeat()

    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
    isConnected.value = false
    connectionStatus.value = 'disconnected'
  }

  const sendMessage = (message: any) => {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket 未连接，无法发送消息')
    }
  }

  const handleWebSocketMessage = (data: any) => {
    try {
      switch (data.type) {
        case 'agentStatus':
          // 更新智能体状态
          if (data.status?.status === 'running') {
            exhibitionStore.updateProgress(data.agentId, 'running')
            console.log(`🤖 智能体 ${data.agentId} 开始运行`)
          } else if (data.status?.status === 'completed') {
            exhibitionStore.updateProgress(data.agentId, 'completed')
            console.log(`✅ 智能体 ${data.agentId} 完成工作`)
          } else if (data.status?.status === 'error') {
            exhibitionStore.setModelError(data.agentId, data.status.error || '未知错误')
            console.log(`❌ 智能体 ${data.agentId} 出现错误: ${data.status.error}`)
          }
          break

        case 'progress':
          // 更新总体进度
          if (exhibitionStore.currentWorkflow) {
            exhibitionStore.processingProgress = data.progress
            exhibitionStore.currentWorkflow.currentStep = data.currentStep
            console.log(`📊 工作流进度: ${data.progress}% - ${data.currentStep}`)
          }
          break

        case 'workflowCompleted':
          // 工作流程完成
          if (data.result) {
            console.log('🎉 工作流程完成，结果:', data.result)
            exhibitionStore.completeProcessing(data.result)

            // 可以在这里添加完成通知
            if (typeof window !== 'undefined') {
              // 使用浏览器通知
              if (Notification.permission === 'granted') {
                new Notification('展陈设计完成', {
                  body: '多智能体系统已完成展陈设计任务！',
                  icon: '/favicon.ico'
                })
              }
            }
          }
          break

        case 'connectionStatus':
          // 连接状态更新
          console.log('WebSocket连接状态:', data.status, data.data)
          break

        case 'pong':
          // 心跳响应
          break

        default:
          console.log('未知的 WebSocket 消息类型:', data.type, data)
      }
    } catch (error) {
      console.error('处理 WebSocket 消息时出错:', error, data)
    }
  }

  // 组件挂载时自动连接
  onMounted(() => {
    connect()
  })

  // 组件卸载时断开连接
  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
    startHeartbeat,
    stopHeartbeat
  }
}