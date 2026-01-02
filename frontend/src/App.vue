<template>
  <div class="min-h-screen">
    <router-view v-slot="{ Component, route }">
      <transition
        :name="route.meta.transition || 'fade'"
        mode="out-in"
        @before-enter="handleBeforeEnter"
        @after-enter="handleAfterEnter"
      >
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useExhibitionStore } from '@/stores/exhibition'

const exhibitionStore = useExhibitionStore()

onMounted(() => {
  // 初始化应用状态
  exhibitionStore.initializeApp()
})

// 页面过渡事件处理
const handleBeforeEnter = () => {
  // 页面进入前
  document.body.style.overflow = 'hidden'
}

const handleAfterEnter = () => {
  // 页面进入后
  document.body.style.overflow = ''
}
</script>