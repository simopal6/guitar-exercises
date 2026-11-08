<script setup lang="ts">
import { subApps } from './subapps'
</script>

<template>
  <div class="mx-auto flex max-w-md flex-col gap-6 px-4 pb-8 pt-8">
    <header>
      <h1 class="text-xl font-semibold">Esercizi di chitarra</h1>
    </header>

    <nav class="grid grid-cols-2 gap-4">
      <RouterLink
        v-for="app in subApps"
        :key="app.id"
        :to="app.path"
        class="flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-indigo-50 dark:bg-slate-900 dark:hover:bg-slate-800"
      >
        <span class="text-5xl leading-none" aria-hidden="true">{{ app.icon }}</span>
        <span class="text-lg font-semibold">{{ app.title }}</span>
      </RouterLink>
    </nav>

    <RouterLink
      to="/credits"
      class="mt-4 self-center text-xs text-slate-400 underline-offset-2 hover:underline dark:text-slate-500"
    >
      Crediti
    </RouterLink>
  </div>
</template>
