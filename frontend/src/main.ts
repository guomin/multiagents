import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './main.css'
import './styles/animations.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 初始化认证状态
const authStore = useAuthStore()
authStore.initialize()

app.mount('#app')