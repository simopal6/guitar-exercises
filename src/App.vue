<script setup lang="ts">
import TabBar from './shell/TabBar.vue'
</script>

<template>
  <div class="min-h-dvh bg-slate-50 pb-20 dark:bg-slate-950 dark:text-slate-100">
    <RouterView />
    <TabBar />
  </div>
</template>
