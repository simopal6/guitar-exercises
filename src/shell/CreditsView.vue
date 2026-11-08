<template>
  <div class="mx-auto flex max-w-md flex-col gap-6 px-4 pb-8 pt-8 text-sm text-slate-600 dark:text-slate-300">
    <header>
      <h1 class="text-xl font-semibold text-slate-900 dark:text-slate-100">Crediti</h1>
    </header>

    <section class="flex flex-col gap-2">
      <h2 class="font-semibold text-slate-900 dark:text-slate-100">Chitarre e basso</h2>
      <p>
        Campioni da
        <a class="underline" href="https://github.com/nbrosowsky/tonejs-instruments" target="_blank" rel="noopener">tonejs-instruments</a>
        di Nicholaus Brosowsky, licenza
        <a class="underline" href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">CC BY 3.0</a>.
        Modificati: accorciati (2,5–4 s con dissolvenza finale), convertiti in mono, ricodificati a 112 kbps.
      </p>
    </section>

    <section class="flex flex-col gap-2">
      <h2 class="font-semibold text-slate-900 dark:text-slate-100">Batteria</h2>
      <p>
        Kit "acoustic-kit" dal repository
        <a class="underline" href="https://github.com/Tonejs/audio" target="_blank" rel="noopener">Tonejs/audio</a>,
        che a sua volta lo riprende da cwilso/web-audio-samples. Licenza non dichiarata.
      </p>
    </section>
  </div>
</template>
