<script setup lang="ts">
import { subApps } from './subapps'
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <RouterLink
      v-for="app in subApps"
      :key="app.id"
      :to="app.path"
      class="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium text-slate-500 dark:text-slate-400"
      active-class="text-indigo-600 dark:text-indigo-400"
    >
      <span class="text-lg leading-none">{{ app.icon }}</span>
      <span>{{ app.title }}</span>
    </RouterLink>
  </nav>
</template>
