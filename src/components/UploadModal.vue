<script setup>
import { ref, computed } from 'vue'
import { uploadFile } from '../api'

const props = defineProps({ days: Array, initialDay: Number })
const emit = defineEmits(['close', 'uploaded'])
const day = ref(props.initialDay)
const items = ref([])   // { file, progress, status: queued|uploading|done|error }
const busy = ref(false)
const over = ref(false)
const doneCount = computed(() => items.value.filter((i) => i.status === 'done').length)
const pending = computed(() => items.value.filter((i) => i.status !== 'done').length)

function add(list) {
  for (const file of list) {
    if (/^(image|video)\//.test(file.type)) items.value.push({ file, progress: 0, status: 'queued' })
  }
}
const size = (b) => (b > 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.ceil(b / 1e3) + ' KB')
const allDone = computed(() => items.value.length > 0 && pending.value === 0)

async function start() {
  busy.value = true
  for (const it of items.value.filter((i) => i.status !== 'done')) {
    it.status = 'uploading'; it.progress = 0
    try { await uploadFile(it.file, `day${day.value}`, (p) => (it.progress = p)); it.status = 'done'; it.progress = 1 }
    catch { it.status = 'error' }
  }
  busy.value = false
  if (doneCount.value) emit('uploaded', day.value)
}
</script>

<template>
  <div class="bg-primary/90 fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
    <div class="bg-secondary flex max-h-[92vh] w-full max-w-xl flex-col rounded-t-2xl p-5 shadow-2xl sm:rounded-2xl">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-extrabold">Upload to Day {{ day }}</h2>
        <button :disabled="busy" @click="emit('close')" aria-label="Close"><i
            class="fa-solid fa-xmark text-xl"></i></button>
      </div>

      <div class="mb-4 grid grid-cols-4 gap-2">
        <button v-for="d in days" :key="d" :disabled="busy" @click="day = d"
          :class="day === d ? 'bg-mint text-primary' : 'bg-primary/60'" class="rounded-lg py-2 font-semibold">Day {{ d
          }}</button>
      </div>

      <label
        class="border-mint/50 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed p-6 text-center"
        :class="over && 'bg-primary/50'" @dragover.prevent="over = true" @dragleave="over = false"
        @drop.prevent="over = false; add($event.dataTransfer.files)">
        <i class="fa-solid fa-photo-film text-mint mb-2 text-3xl"></i>
        <span class="font-semibold">Choose photos and videos</span>
        <span class="text-sm text-ink/70">or drop them here</span>
        <input type="file" multiple accept="image/*,video/*" class="sr-only"
          @change="add($event.target.files); $event.target.value = ''" />
      </label>

      <ul class="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto">
        <li v-for="(it, i) in items" :key="i" class="bg-primary/60 rounded-lg p-3 text-sm">
          <div class="flex justify-between gap-3">
            <span class="truncate">{{ it.file.name }}</span>
            <span class="shrink-0 text-ink/70">{{ size(it.file.size) }}</span>
          </div>
          <div class="mt-2 flex items-center gap-2">
            <div class="bg-secondary h-1.5 flex-1 overflow-hidden rounded-full">
              <div class="bg-mint h-full transition-all" :style="{ width: it.progress * 100 + '%' }"></div>
            </div>
            <i v-if="it.status === 'done'" class="fa-solid fa-circle-check text-mint"></i>
            <i v-else-if="it.status === 'error'" class="fa-solid fa-circle-exclamation text-red-300"
              title="Failed, press Upload to retry"></i>
            <button v-else-if="!busy" @click="items.splice(i, 1)" aria-label="Remove"><i
                class="fa-solid fa-xmark text-ink/60"></i></button>
          </div>
        </li>
      </ul>

      <button
  class="bg-mint text-primary mt-4 rounded-lg py-3 font-bold disabled:opacity-40"
  :disabled="busy || (!pending && !allDone)"
  @click="allDone ? emit('close') : start()">
  <template v-if="busy">
    <i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Uploading {{ doneCount }}/{{ items.length }}
  </template>
  <template v-else-if="allDone">
    <i class="fa-solid fa-circle-check mr-2"></i>Done
  </template>
  <template v-else>Upload {{ pending || '' }} to Day {{ day }}</template>
</button>
    </div>
  </div>
</template>
