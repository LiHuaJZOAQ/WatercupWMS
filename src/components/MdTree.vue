<template>
  <div class="md-tree">
    <md-tree-node
      v-for="(node, index) in data"
      :key="node[nodeKey] || index"
      :node="node"
      :node-key="nodeKey"
      :props="props"
      :checked-keys="checkedKeys"
      @check-change="handleCheckChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, provide } from 'vue';
import MdTreeNode from './MdTreeNode.vue';

const propsDef = defineProps({
  data: { type: Array as () => any[], required: true },
  nodeKey: { type: String, default: 'id' },
  props: { type: Object as () => Record<string, any>, default: () => ({ children: 'children', label: 'label' }) },
  defaultCheckedKeys: { type: Array as () => any[], default: () => [] }
});

const emit = defineEmits(['check-change']);

const checkedKeys = ref([...propsDef.defaultCheckedKeys]);

watch(() => propsDef.defaultCheckedKeys, (newVal) => {
  checkedKeys.value = [...newVal];
}, { deep: true });

const handleCheckChange = (node: any, checked: boolean) => {
  const key = node[propsDef.props.nodeKey || propsDef.nodeKey];
  if (checked) {
    if (!checkedKeys.value.includes(key)) checkedKeys.value.push(key);
  } else {
    checkedKeys.value = checkedKeys.value.filter(k => k !== key);
  }
  emit('check-change', node, checked);
};

// Expose getCheckedKeys method for ref usage
const getCheckedKeys = () => {
  return checkedKeys.value;
};

// Expose setCheckedKeys method for ref usage
const setCheckedKeys = (keys: any[]) => {
  checkedKeys.value = [...keys];
};

defineExpose({
  getCheckedKeys,
  setCheckedKeys
});
</script>

<style scoped>
.md-tree {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
