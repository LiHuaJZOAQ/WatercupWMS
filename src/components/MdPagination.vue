<template>
  <div class="md-pagination">
    <div class="md-pagination-sizes" v-if="pageSizes && pageSizes.length > 0">
      <span class="md-pagination-label">每页</span>
      <select class="md-pagination-select" :value="pageSize" @change="onSizeChange">
        <option v-for="(size, index) in pageSizes" :key="index" :value="size">{{ size }}</option>
      </select>
      <span class="md-pagination-label">条</span>
    </div>
    
    <div class="md-pagination-total">
      共 {{ total }} 条
    </div>

    <div class="md-pagination-controls">
      <md-icon-button :disabled="currentPage <= 1" @click="changePage(currentPage - 1)">
        <md-icon>chevron_left</md-icon>
      </md-icon-button>
      
      <span class="md-pagination-pages">
        <span class="md-pagination-current">{{ currentPage }}</span> / {{ totalPages || 1 }}
      </span>

      <md-icon-button :disabled="currentPage >= totalPages" @click="changePage(currentPage + 1)">
        <md-icon>chevron_right</md-icon>
      </md-icon-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  total: { type: Number, required: true },
  currentPage: { type: Number, required: true },
  pageSize: { type: Number, required: true },
  pageSizes: { type: Array, default: () => [10, 20, 50, 100] }
});

const emit = defineEmits(['update:currentPage', 'update:pageSize', 'current-change', 'size-change']);

const totalPages = computed(() => Math.ceil(props.total / props.pageSize));

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    emit('update:currentPage', page);
    emit('current-change', page);
  }
};

const onSizeChange = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  const newSize = parseInt(target.value, 10);
  emit('update:pageSize', newSize);
  emit('size-change', newSize);
  // Reset to page 1 when size changes
  emit('update:currentPage', 1);
  emit('current-change', 1);
};
</script>

<style scoped>
.md-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 16px 0;
  font-family: var(--md-sys-typescale-body-medium-font-family-name);
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant);
}

.md-pagination-sizes, .md-pagination-total, .md-pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.md-pagination-select {
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  outline: none;
  font-family: inherit;
}

.md-pagination-select:focus {
  border-color: var(--md-sys-color-primary);
}

.md-pagination-pages {
  margin: 0 8px;
}

.md-pagination-current {
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
}
</style>
