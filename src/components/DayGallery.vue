<script setup>
import { ref, computed, onMounted } from 'vue'
import { listFiles, thumb, previewUrl, downloadUrl, downloadMany } from '../api'

const props = defineProps({ day: String })
const files = ref([])
const loading = ref(true)
const error = ref('')
const tokens = ref([''])   // page tokens, one per visited page
const page = ref(0)
const next = ref(null)
const selected = ref([])
const viewing = ref(-1)

const isVideo = (f) => f.mimeType.startsWith('video/')
const current = computed(() => files.value[viewing.value])

async function load() {
  loading.value = true; error.value = ''
  try {
    const d = await listFiles(props.day, tokens.value[page.value])
    files.value = d.files; next.value = d.nextPageToken
  } catch (e) { error.value = e.message } finally { loading.value = false }
}
function go(dir) {
  if (dir > 0) { tokens.value[page.value + 1] = next.value; page.value++ } else page.value--
  load(); window.scrollTo({ top: 0, behavior: 'smooth' })
}
const toggle = (id) => {
  const i = selected.value.indexOf(id)
  i < 0 ? selected.value.push(id) : selected.value.splice(i, 1)
}
const selectPage = () => {
  const ids = files.value.map((f) => f.id)
  const all = ids.every((id) => selected.value.includes(id))
  selected.value = all ? selected.value.filter((id) => !ids.includes(id)) : [...new Set([...selected.value, ...ids])]
}
const step = (n) => { const i = viewing.value + n; if (i >= 0 && i < files.value.length) viewing.value = i }
onMounted(load)
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-2xl font-extrabold">Day {{ day.slice(3) }}</h2>
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <button class="bg-secondary rounded-lg px-3 py-2 font-semibold hover:brightness-125" @click="selectPage" :disabled="!files.length">
          <i class="fa-regular fa-square-check mr-1"></i> Select page
        </button>
        <button class="bg-mint text-primary rounded-lg px-3 py-2 font-bold disabled:opacity-40"
                :disabled="!selected.length" @click="downloadMany(selected)">
          <i class="fa-solid fa-download mr-1"></i> Download {{ selected.length || '' }}
        </button>
        <button v-if="selected.length" class="px-2 py-2 text-ink/70 hover:text-ink" @click="selected = []">Clear</button>
      </div>
    </div>

    <p v-if="error" class="rounded-lg bg-red-950/60 p-4 text-red-200"><i class="fa-solid fa-triangle-exclamation mr-2"></i>{{ error }}</p>
    <p v-else-if="loading" class="py-20 text-center text-ink/70"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Loading day {{ day.slice(3) }}…</p>
    <div v-else-if="!files.length" class="bg-secondary/50 rounded-xl py-20 text-center">
      <i class="fa-regular fa-images text-mint mb-3 text-4xl"></i>
      <p class="font-semibold">Nothing here yet</p>
      <p class="text-ink/70">Tap Upload to add the first photos or videos for this day.</p>
    </div>

    <ul v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      <li v-for="(f, i) in files" :key="f.id" class="bg-secondary group relative aspect-square overflow-hidden rounded-xl">
        <button class="h-full w-full" @click="viewing = i" :aria-label="'Open ' + f.name">
          <img :src="thumb(f.id)" :alt="f.name" loading="lazy" class="h-full w-full object-cover" @error="$event.target.style.display = 'none'" />
        </button>
        <span v-if="isVideo(f)" class="bg-primary/80 pointer-events-none absolute bottom-2 left-2 rounded-md px-2 py-1 text-xs">
          <i class="fa-solid fa-play"></i>
        </span>
        <button @click="toggle(f.id)" :aria-label="'Select ' + f.name"
          :class="selected.includes(f.id) ? 'bg-mint text-primary' : 'bg-primary/70 text-transparent group-hover:text-ink/60'"
          class="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-ink/40">
          <i class="fa-solid fa-check text-xs"></i>
        </button>
      </li>
    </ul>

    <div v-if="!loading && (page > 0 || next)" class="mt-8 flex items-center justify-center gap-4">
      <button class="bg-secondary rounded-lg px-4 py-2 font-semibold disabled:opacity-40" :disabled="page === 0" @click="go(-1)">
        <i class="fa-solid fa-chevron-left mr-1"></i> Prev
      </button>
      <span class="text-ink/70">Page {{ page + 1 }}</span>
      <button class="bg-secondary rounded-lg px-4 py-2 font-semibold disabled:opacity-40" :disabled="!next" @click="go(1)">
        Next <i class="fa-solid fa-chevron-right ml-1"></i>
      </button>
    </div>

    <div v-if="current" class="bg-primary/95 fixed inset-0 z-40 flex flex-col p-4" @click.self="viewing = -1">
      <div class="flex items-center justify-between gap-3 pb-3">
        <p class="truncate font-semibold">{{ current.name }}</p>
        <div class="flex gap-2">
          <a :href="downloadUrl(current.id)" class="bg-mint text-primary rounded-lg px-3 py-2 font-bold" aria-label="Download"><i class="fa-solid fa-download"></i></a>
          <button class="bg-secondary rounded-lg px-3 py-2" @click="viewing = -1" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
      <div class="flex min-h-0 flex-1 items-center gap-2" @click.self="viewing = -1">
        <button class="bg-secondary h-10 w-10 shrink-0 rounded-full disabled:opacity-30" :disabled="viewing === 0" @click="step(-1)" aria-label="Previous"><i class="fa-solid fa-chevron-left"></i></button>
        <iframe v-if="isVideo(current)" :src="previewUrl(current.id)" allow="autoplay" allowfullscreen class="h-full w-full rounded-lg"></iframe>
        <img v-else :src="thumb(current.id, 1600)" :alt="current.name" class="mx-auto max-h-full min-w-0 flex-1 rounded-lg object-contain" />
        <button class="bg-secondary h-10 w-10 shrink-0 rounded-full disabled:opacity-30" :disabled="viewing === files.length - 1" @click="step(1)" aria-label="Next"><i class="fa-solid fa-chevron-right"></i></button>
      </div>
    </div>
  </div>
</template>
