<template>
  <div class="md-date-range">
    <md-outlined-text-field
      :label="startLabel"
      type="date"
      :value="modelValue[0] || ''"
      @input="updateStart"
      :disabled="disabled"
    ></md-outlined-text-field>
    <span class="md-date-separator">至</span>
    <md-outlined-text-field
      :label="endLabel"
      type="date"
      :value="modelValue[1] || ''"
      @input="updateEnd"
      :disabled="disabled"
    ></md-outlined-text-field>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  startLabel: { type: String, default: '开始日期' },
  endLabel: { type: String, default: '结束日期' },
  disabled: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

const updateStart = (e: Event) => {
  const val = (e.target as HTMLInputElement).value;
  emit('update:modelValue', [val, props.modelValue[1] || '']);
};

const updateEnd = (e: Event) => {
  const val = (e.target as HTMLInputElement).value;
  emit('update:modelValue', [props.modelValue[0] || '', val]);
};
</script>

<style scoped>
.md-date-range {
  display: flex;
  align-items: center;
  gap: 12px;
}

.md-date-separator {
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-body-medium-font-family-name);
  font-size: 14px;
}
</style>
