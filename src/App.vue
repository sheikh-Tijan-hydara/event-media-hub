<script setup>
import { ref } from 'vue'
import DayGallery from './components/DayGallery.vue'
import UploadModal from './components/UploadModal.vue'

const days = [1, 2, 3, 4]
const active = ref(1)
const showUpload = ref(false)
const refreshKey = ref(0)
const onUploaded = (day) => { active.value = day; refreshKey.value++ }
</script>

<template>
  <div class="flex min-h-screen flex-col">

    <header class="bg-secondary sticky top-0 z-20 shadow-lg">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <div class="flex items-center gap-3">
          <div class="flex items-center">
            <span class="text-lg font-black tracking-[0.08em] text-primary sm:text-3xl">
              MLSP
            </span>
            <span class="ml-1 text-lg font-light tracking-tight text-white sm:text-3xl">
              / 2026
            </span>
          </div>

          <div class="h-8 w-px bg-primary/20"></div>

          <span class="text-sm font-semibold uppercase tracking-[0.18em] text-primary sm:text-base">
            Media Hub
          </span>
        </div>

        <button
          class="flex items-center gap-2 rounded-lg bg-mint px-4 py-2 font-bold text-primary hover:brightness-110"
          @click="showUpload = true"
        >
          <i class="fa-solid fa-cloud-arrow-up"></i>
          Upload
        </button>
      </div>

      <nav
        class="mx-auto flex max-w-7xl gap-1 px-4"
        aria-label="Event days"
      >
        <button
          v-for="d in days"
          :key="d"
          @click="active = d"
          :class="
            active === d
              ? 'border-mint text-mint'
              : 'border-transparent text-ink/70 hover:text-ink'
          "
          class="border-b-2 px-4 py-2 font-semibold"
        >
          Day {{ d }}
        </button>
      </nav>
    </header>

    <!-- Main expands to push footer down -->
    <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
      <DayGallery
        :key="active + '-' + refreshKey"
        :day="`day${active}`"
      />
    </main>

    <!-- Footer stays at bottom -->
    <footer class="bg-secondary py-6 text-center text-sm text-ink/70">
      &copy; MLSP/2026 Media Hub. By SHEIKH TIJAN HYDARA.
    </footer>

    <UploadModal
      v-if="showUpload"
      :days="days"
      :initial-day="active"
      @close="showUpload = false"
      @uploaded="onUploaded"
    />

  </div>
</template>