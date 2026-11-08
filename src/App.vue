<script setup lang="ts">
import HomeLink from './shell/HomeLink.vue'
</script>

<template>
  <div class="min-h-dvh bg-slate-50 dark:bg-slate-950 dark:text-slate-100">
    <HomeLink />
    <RouterView />
  </div>
</template>
