<template>
  <div class="md3-login-container">
    <div class="md3-login-card">
      <div class="login-header">
        <md-icon class="brand-icon">inventory_2</md-icon>
        <h1 class="title">General WMS</h1>
        <p class="subtitle">Log in to your account to continue</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="input-group">
          <md-outlined-text-field
            label="Username"
            v-model="formData.username"
            :disabled="isLoading"
            type="text"
            required
            class="full-width"
          >
            <md-icon slot="leading-icon">person</md-icon>
          </md-outlined-text-field>
        </div>

        <div class="input-group">
          <md-outlined-text-field
            label="Password"
            v-model="formData.password"
            :disabled="isLoading"
            type="password"
            required
            class="full-width"
          >
            <md-icon slot="leading-icon">lock</md-icon>
          </md-outlined-text-field>
        </div>

        <div class="login-actions">
          <md-filled-button 
            type="submit" 
            class="submit-btn" 
            :disabled="isLoading"
          >
            <span v-if="!isLoading">Sign In</span>
            <span v-else class="loading-state">
              <md-circular-progress indeterminate></md-circular-progress>
              Signing in...
            </span>
          </md-filled-button>
        </div>
      </form>
    </div>

    <!-- 错误提示 -->
    <Teleport to="body">
      <md-dialog :open="showErrorModal" @close="showErrorModal = false">
        <div slot="headline">Sign In Failed</div>
        <div slot="content">{{ resultMessage }}</div>
        <div slot="actions">
          <md-text-button @click="showErrorModal = false">OK</md-text-button>
        </div>
      </md-dialog>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '@/api/index'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()

const formData = ref({
  username: '',
  password: ''
})

const isLoading = ref(false)
const showErrorModal = ref(false)
const resultMessage = ref('')

const validateForm = () => {
  if (!formData.value.username) return 'Username is required'
  if (!formData.value.password) return 'Password is required'
  return ''
}

const showError = (message: string) => {
  resultMessage.value = message
  showErrorModal.value = true
}

const handleLogin = async () => {
  isLoading.value = true
  resultMessage.value = ''

  try {
    const validationMsg = validateForm()
    if (validationMsg) {
      showError(validationMsg)
      return
    }

    const res = await api.login({
      username: formData.value.username,
      password: formData.value.password
    })

    const authStore = useAuthStore()
    await authStore.login({
      username: res.data.user.name,
      token: res.data.token
    })

    if (res.status === 200) {
      router.push('/')
    } else {
      showError('Login failed')
    }
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Network error')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.md3-login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  min-width: 100vw;
  background-color: var(--md-sys-color-surface-container, #f2f3f5);
  font-family: 'Roboto', sans-serif;
  padding: 24px;
}

.md3-login-card {
  width: 100%;
  max-width: 440px;
  background-color: var(--md-sys-color-surface, #fdfdfd);
  border-radius: 28px;
  padding: 48px 40px;
  box-shadow: 0 4px 8px 3px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  
  .brand-icon {
    font-size: 48px;
    color: var(--md-sys-color-primary, #0061a4);
  }
  
  .title {
    margin: 0;
    font-size: 32px;
    font-weight: 400;
    color: var(--md-sys-color-on-surface, #1a1c1e);
  }
  
  .subtitle {
    margin: 0;
    font-size: 16px;
    color: var(--md-sys-color-on-surface-variant, #44474e);
  }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.full-width {
  width: 100%;
  --md-sys-color-primary: #0061a4;
}

.login-actions {
  display: flex;
  flex-direction: column;
  margin-top: 16px;
  
  .submit-btn {
    width: 100%;
    height: 48px;
    border-radius: 24px;
  }
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 12px;
  
  md-circular-progress {
    --md-circular-progress-size: 20px;
    --md-circular-progress-active-indicator-color: var(--md-sys-color-on-primary, #ffffff);
  }
}
</style>