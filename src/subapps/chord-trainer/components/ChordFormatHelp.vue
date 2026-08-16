<script setup lang="ts">
// Same source file backs both the in-app help panel and the repo-root doc —
// no separate copy to keep in sync.
import chordsFormatRaw from '../../../../CHORDS_FORMAT.md?raw'
</script>

<template>
  <pre
    class="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-mono text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300"
  >{{ chordsFormatRaw }}</pre>
</template>
