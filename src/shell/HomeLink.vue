<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <!-- Every sub-app gets it from the shell, so none of the views has to add its own -->
  <div v-if="route.path !== '/'" class="mx-auto max-w-md px-4 pt-4">
    <RouterLink
      to="/"
      class="text-sm font-medium text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
    >
      ← Home
    </RouterLink>
  </div>
</template>
