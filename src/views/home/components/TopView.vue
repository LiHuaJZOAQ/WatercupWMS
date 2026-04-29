<template>
  <div class="md3-top-app-bar">
    <div class="left-section">
      <h2 class="page-title">{{ currentRouteName }}</h2>
    </div>
    
    <div class="right-section">
      <md-icon-button class="action-btn">
        <md-icon>search</md-icon>
      </md-icon-button>
      
      <md-icon-button class="action-btn">
        <md-icon>notifications</md-icon>
      </md-icon-button>

      <div class="user-profile">
        <div class="avatar">{{ userInitial }}</div>
        <span class="user-name">{{ userName }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const currentRouteName = computed(() => {
  return route.name ? String(route.name) : 'Dashboard'
})

const userName = computed(() => authStore.user || 'Guest')
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())
</script>

<style scoped lang="scss">
.md3-top-app-bar { 
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: space-between;
  align-items: center;
  background-color: transparent;
}

.left-section {
  display: flex;
  align-items: center;
  
  .page-title {
    font-size: 22px;
    font-weight: 400;
    color: var(--md-sys-color-on-surface, #1a1c1e);
    margin: 0;
  }
}

.right-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  color: var(--md-sys-color-on-surface-variant, #44474e);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 12px;
  padding: 4px 12px 4px 4px;
  border-radius: 24px;
  background-color: var(--md-sys-color-surface-container-high, #e7e8ea);
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: var(--md-sys-color-surface-container-highest, #e2e2e5);
  }
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--md-sys-color-primary, #0061a4);
  color: var(--md-sys-color-on-primary, #ffffff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface, #1a1c1e);
}
</style>