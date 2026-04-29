<template>
  <div class="md-tree-node">
    <div class="md-tree-node-content" @click="toggleExpand">
      <md-icon-button class="md-tree-expand-icon" :style="{ visibility: hasChildren ? 'visible' : 'hidden' }" @click.stop="toggleExpand">
        <md-icon>{{ expanded ? 'expand_more' : 'chevron_right' }}</md-icon>
      </md-icon-button>
      <md-checkbox
        :checked="isChecked"
        :indeterminate="isIndeterminate"
        @change="handleCheckChange"
        @click.stop
      />
      <span class="md-tree-node-label">{{ node[props.label || 'label'] }}</span>
    </div>
    
    <div class="md-tree-node-children" v-show="expanded && hasChildren">
      <md-tree-node
        v-for="child in node[props.children || 'children']"
        :key="child[nodeKey]"
        :node="child"
        :node-key="nodeKey"
        :props="props"
        :checked-keys="checkedKeys"
        @check-change="(n, c) => $emit('check-change', n, c)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const propsDef = defineProps({
  node: { type: Object as () => Record<string, any>, required: true },
  nodeKey: { type: String, required: true },
  props: { type: Object as () => Record<string, any>, required: true },
  checkedKeys: { type: Array as () => any[], required: true }
});

const emit = defineEmits(['check-change']);

const expanded = ref(true);

const hasChildren = computed(() => {
  const children = propsDef.node[propsDef.props.children || 'children'];
  return children && children.length > 0;
});

const isChecked = computed(() => {
  return propsDef.checkedKeys.includes(propsDef.node[propsDef.nodeKey]);
});

// Calculate indeterminate state if needed, simplified for now
const isIndeterminate = computed(() => false);

const toggleExpand = () => {
  if (hasChildren.value) {
    expanded.value = !expanded.value;
  }
};

const handleCheckChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const checked = target.checked;
  emit('check-change', propsDef.node, checked);
  
  // Automatically check/uncheck children
  if (hasChildren.value) {
    const children = propsDef.node[propsDef.props.children || 'children'];
    checkAllChildren(children, checked);
  }
};

const checkAllChildren = (children: any[], checked: boolean) => {
  children.forEach(child => {
    emit('check-change', child, checked);
    const subChildren = child[propsDef.props.children || 'children'];
    if (subChildren && subChildren.length > 0) {
      checkAllChildren(subChildren, checked);
    }
  });
};
</script>

<style scoped>
.md-tree-node {
  display: flex;
  flex-direction: column;
}

.md-tree-node-content {
  display: flex;
  align-items: center;
  padding: 4px 0;
  cursor: pointer;
  border-radius: 4px;
}

.md-tree-node-content:hover {
  background-color: var(--md-sys-color-surface-container-highest);
}

.md-tree-expand-icon {
  margin-right: 4px;
}

.md-tree-node-label {
  margin-left: 8px;
  font-family: var(--md-sys-typescale-body-medium-font-family-name);
  font-size: 14px;
  color: var(--md-sys-color-on-surface);
}

.md-tree-node-children {
  padding-left: 32px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
