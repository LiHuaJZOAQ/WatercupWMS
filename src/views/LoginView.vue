<template>
  <div class="login-container">
    <div class="login-card">
      <!-- 标题 -->
      <div class="login-header">
        <h2>欢迎回来</h2>
        <p>请登录您的账户</p>
      </div>

      <!-- 输入区域 -->
      <div class="input-group">
        <label for="username">用户名</label>
        <div class="input-wrapper">
          <input id="username" type="text" v-model.trim="formData.username" :disabled="isLoading" placeholder="请输入用户名">
        </div>
      </div>

      <div class="input-group">
        <label for="password">密码</label>
        <div class="input-wrapper">
          <input id="password" type="password" v-model.trim="formData.password" :disabled="isLoading"
            placeholder="请输入密码">
        </div>
      </div>

      <!-- 操作按钮 -->
      <button @click="handleLogin" :disabled="isLoading" class="submit-btn" :class="{ loading: isLoading }">
        <span v-if="!isLoading">登录</span>
        <span v-else class="loading-text">
          <span class="spinner"></span> 登录中...
        </span>
      </button>

      <!-- 底部链接 -->
      <div class="login-footer">
        <a href="#" >忘记密码</a>
      </div>
    </div>

    <!-- 成功提示 -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showSuccessModal" class="modal success-modal">
          <div class="modal-content">
            <div class="modal-icon success">
              <svg viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            </div>
            <h3>登录成功！</h3>
            <p>{{ resultMessage }}</p>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- 错误提示 -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showErrorModal" class="modal error-modal">
          <div class="modal-content">
            <div class="modal-icon error">
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
            </div>
            <h3>登录失败</h3>
            <p>{{ resultMessage }}</p>
            <button style="width: 40%;" class="submit-btn"  @click="showErrorModal = false">重试</button>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '@/api/index'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()

// 表单数据
const formData = ref({
  username: '',
  password: ''
})

// 状态管理
const isLoading = ref(false)
const showSuccessModal = ref(false)
const showErrorModal = ref(false)
const resultMessage = ref('')

// 输入验证
const validateForm = () => {
  if (!formData.value.username) return '请输入用户名'
  if (!formData.value.password) return '请输入密码'
  return ''
}

// 显示成功弹窗
const showSuccess = () => {
  showSuccessModal.value = true
  showErrorModal.value = false
}

// 显示错误弹窗
const showError = (message: string) => {
  resultMessage.value = message
  showErrorModal.value = true
  showSuccessModal.value = false
}

// 关闭所有弹窗
const closeModals = () => {
  showSuccessModal.value = false
  showErrorModal.value = false
}

// 登录处理
const handleLogin = async () => {
  // 重置状态
  isLoading.value = true
  resultMessage.value = ''

  try {
    // 表单验证
    const validationMsg = validateForm()
    if (validationMsg) {
      showError(validationMsg)
      return
    }

    // 发送请求
    const res = await api.login({
      username: formData.value.username,
      password: formData.value.password
    })

    // 检查响应
    const authStore = useAuthStore()
    await authStore.login({
      username: res.data.user.name,
      token: res.data.token
    })

    // 处理响应
    if (res.status === 200) {
      showSuccess()
      resultMessage.value = '登录成功，正在跳转...'
      setTimeout(() => {
        showSuccessModal.value = false
        router.push('/') // 延时跳转
      }, 1500)
    } else {
      console.log('登录失败:', res.data)
      console.log(res.data.code)
      showError('登录失败')
    }
  } catch (err) {
    showError(err instanceof Error ? err.message : '网络请求失败')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped lang="scss">
/* 基础样式 */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  min-width: 100vw;
  /* background: linear-gradient(180deg, #faf9f5 0%, #ffffff 100%); */
  background: #faf9f5;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #efe9de;
  border: 1px solid #e6dfd8;
  border-radius: 20px;
  padding: 36px 32px;
  box-shadow: 0 16px 40px rgba(20, 20, 19, 0.08);
}

.login-header {
  text-align: left;
  margin-bottom: 22px;
}

.login-header h2 {
  font-family: 'Copernicus', 'Tiempos Headline', serif;
  font-size: 1.75rem;
  line-height: 1.05;
  font-weight: 400;
  letter-spacing: -0.6px;
  color: #141413;
  margin: 0 0 6px 0;
}

.login-header p {
  color: #3d3d3a;
  font-size: 0.95rem;
  margin: 0;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 10px;
  color: #141413;
  font-size: 0.95rem;
  font-weight: 500;
}

.input-wrapper {
  position: relative;
}

.input-wrapper i {
  position: absolute;
  left: 0px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c6a64;
  font-size: 1rem;
}


input {
  width: 100%;
  padding: 14px 16px 14px 16px;
  border: 1px solid #e6dfd8;
  border-radius: 12px;
  background: #faf9f5;
  color: #141413;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

input:focus {
  outline: none;
  border-color: #cc785c;
  box-shadow: 0 0 0 4px rgba(204, 120, 92, 0.12);
}

input::placeholder { color: #6c6a64; }

.submit-btn {
  width: 100%;
  padding: 14px 0;
  border-radius: 12px;
  background: #cc785c;
  color: #faf9f5;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  margin-top: 14px;
  transition: background-color 0.18s ease, transform 0.12s ease;
}

.submit-btn:hover:not(:disabled) { background: #a9583e; transform: translateY(-1px); }
.submit-btn:disabled { background: #e6dfd8; color: #6c6a64; cursor: not-allowed; }

.loading-text { display: inline-flex; align-items: center; justify-content: center; }

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

.login-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 18px;
  font-size: 14px;
  color: #6c6a64;
}

.login-footer a { color: #141413; text-decoration: none; }
.login-footer a:hover { color: #cc785c; }

/* 弹窗样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  min-width: 320px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: modalFadeIn 0.3s ease-out;

  h3 {
    margin-bottom: 15px;
    color: #2d3748;
  }

  p {
    color: #4a5568;
    margin-bottom: 20px;
  }

  button {
    padding: 10px 24px;
    background: #cc785c;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s;

    &:hover {
      background: #5a6fd1;
    }
  }
}

.modal-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 30px;
    height: 30px;
    fill: currentColor;
  }

  &.success {
    background-color: rgba(72, 187, 120, 0.1);
    color: #48bb78;
  }

  &.error {
    background-color: rgba(245, 101, 101, 0.1);
    color: #f56565;
  }
}

.success-modal .modal-content {
  border-top: 4px solid #48bb78;
}

.error-modal .modal-content {
  border-top: 4px solid #f56565;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>