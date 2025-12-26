<template>
  <div class="min-h-screen">
    <router-view />
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
</script>