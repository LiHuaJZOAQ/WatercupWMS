<template>
  <md-snackbar
    class="md3-snackbar"
    :class="typeClass"
    :open="open"
    :label-text="message"
    :timeout-ms="timeoutMs"
    @closed="open = false"
  />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { NotifyPayload, NotifyType } from '@/utils/notify'

const open = ref(false)
const message = ref('')
const type = ref<NotifyType>('info')
const timeoutMs = ref<number>(4000)

const typeClass = computed(() => `md3-snackbar--${type.value}`)

const onNotify = (event: Event) => {
  const detail = (event as CustomEvent).detail as NotifyPayload | undefined
  if (!detail?.message) return
  message.value = detail.message
  type.value = detail.type ?? 'info'
  timeoutMs.value = detail.timeoutMs ?? 4000
  open.value = true
}

onMounted(() => {
  window.addEventListener('app-notify', onNotify)
})

onBeforeUnmount(() => {
  window.removeEventListener('app-notify', onNotify)
})
</script>

<style scoped lang="scss">
.md3-snackbar {
  --md-snackbar-supporting-text-font: var(--md-sys-typescale-body-medium-font-family-name);
}

.md3-snackbar--success {
  --md-snackbar-container-color: color-mix(in srgb, #2e7d32 32%, #111);
}

.md3-snackbar--warning {
  --md-snackbar-container-color: color-mix(in srgb, #ed6c02 34%, #111);
}

.md3-snackbar--error {
  --md-snackbar-container-color: color-mix(in srgb, var(--md-sys-color-error) 36%, #111);
}

.md3-snackbar--info {
  --md-snackbar-container-color: color-mix(in srgb, var(--md-sys-color-secondary) 32%, #111);
}
</style>
