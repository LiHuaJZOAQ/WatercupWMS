<template>
  <div class="auth-shell">
    <div class="auth-grid">
      <section class="hero-copy">
        <div class="hero-meta">
          <span class="brand-mark">✦</span>
          <p>仓储智能运营平台</p>
        </div>

        <h1>在柔暖的画布上，重新定义库存与出入库体验</h1>
        <p class="hero-lead">
          登录后即可进入智能仓储控制台，实时查看库存、审批入库、调度拣货并保持流程闭环。
        </p>

        <div class="hero-features">
          <div class="hero-feature">
            <span class="feature-dot"></span>
            <p>可视化库存状态与拣货任务一览</p>
          </div>
          <div class="hero-feature">
            <span class="feature-dot"></span>
            <p>多角色权限、审批流与异常提醒</p>
          </div>
          <div class="hero-feature">
            <span class="feature-dot"></span>
            <p>一站式仓位管理与原料盘点</p>
          </div>
        </div>

        <div class="hero-card">
          <p class="card-label">本次登录适用</p>
          <p class="card-copy">
            仓库管理员、物料主管与配送协调员。保持账号安全，启动两步验证后即可在温暖稳定的管理台中开展工作。
          </p>
        </div>
      </section>

      <section class="login-panel">
        <div class="login-card">
          <div class="login-card-head">
            <div>
              <p class="eyebrow">WELCOME BACK</p>
              <h2>继续您的仓储之旅</h2>
            </div>
            <span class="badge">安全登录</span>
          </div>

          <p class="login-intro">
            使用企业账户访问仓库运营后台，查看今日库存、入库通知与任务清单。
          </p>

          <div class="input-group">
            <label for="username">用户名</label>
            <div class="input-wrapper">
              <i class="icon-user"></i>
              <input
                id="username"
                type="text"
                v-model.trim="formData.username"
                :disabled="isLoading"
                placeholder="请输入用户名"
                autocomplete="username"
              />
            </div>
          </div>

          <div class="input-group">
            <label for="password">密码</label>
            <div class="input-wrapper">
              <i class="icon-lock"></i>
              <input
                id="password"
                type="password"
                v-model.trim="formData.password"
                :disabled="isLoading"
                placeholder="请输入密码"
                autocomplete="current-password"
              />
            </div>
          </div>

          <button @click="handleLogin" :disabled="isLoading" class="submit-btn" :class="{ loading: isLoading }">
            <span v-if="!isLoading">登录</span>
            <span v-else class="loading-text">
              <span class="spinner"></span> 登录中...
            </span>
          </button>

          <div class="login-links">
            <a href="#">忘记密码?</a>
            <span></span>
            <a href="#">注册新账户</a>
          </div>

          <div class="security-note">
            <p>系统已启用安全登录机制。请勿在公共设备保存密码。</p>
          </div>
        </div>
      </section>
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
            <h3>登录成功</h3>
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
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                />
              </svg>
            </div>
            <h3>登录失败</h3>
            <p>{{ resultMessage }}</p>
            <button @click="showErrorModal = false">重试</button>
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
        router.push('/')
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
:root {
  --canvas: #faf9f5;
  --surface-card: #efe9de;
  --surface-cream-strong: #e8e0d2;
  --primary: #cc785c;
  --primary-active: #a9583e;
  --primary-disabled: #e6dfd8;
  --ink: #141413;
  --body: #3d3d3a;
  --muted: #6c6a64;
  --hairline: #e6dfd8;
}

.auth-shell {
  min-height: 100vh;
  width: 100%;
  background: var(--canvas);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
}

.auth-grid {
  width: min(1200px, 100%);
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 40px;
  align-items: center;
}

.hero-copy {
  padding: 40px 0;
}

.hero-meta {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--muted);
  letter-spacing: 0.08em;
  font-size: 13px;
  text-transform: uppercase;
  margin-bottom: 24px;
}

.brand-mark {
  display: inline-flex;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--ink);
  color: var(--canvas);
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
}

.hero-copy h1 {
  font-family: 'Copernicus', 'Tiempos Headline', serif;
  font-size: clamp(2.4rem, 5vw, 4rem);
  line-height: 1.05;
  font-weight: 400;
  letter-spacing: -1px;
  color: var(--ink);
  margin: 0 0 24px;
  max-width: 680px;
}

.hero-lead {
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
  font-size: 1.05rem;
  line-height: 1.75;
  color: var(--body);
  max-width: 620px;
  margin-bottom: 32px;
}

.hero-features {
  display: grid;
  gap: 18px;
  margin-bottom: 32px;
}

.hero-feature {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  color: var(--body);
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
  font-size: 1rem;
  line-height: 1.8;
}

.feature-dot {
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--primary);
}

.hero-card {
  background: var(--surface-card);
  border: 1px solid var(--hairline);
  border-radius: 16px;
  padding: 28px 28px 24px;
  max-width: 560px;
}

.card-label {
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
  font-size: 0.85rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 12px;
}

.card-copy {
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
  font-size: 1rem;
  line-height: 1.75;
  color: var(--body);
  margin: 0;
}

.login-panel {
  display: flex;
  justify-content: flex-end;
}

.login-card {
  width: 100%;
  background: var(--surface-card);
  border: 1px solid var(--hairline);
  border-radius: 20px;
  padding: 36px 32px;
  box-shadow: 0 16px 40px rgba(20, 20, 19, 0.08);
}

.login-card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 22px;
}

.login-card-head h2 {
  font-family: 'Copernicus', 'Tiempos Headline', serif;
  font-size: 2rem;
  line-height: 1.05;
  font-weight: 400;
  letter-spacing: -0.8px;
  color: var(--ink);
  margin: 0;
}

.eyebrow {
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
  font-size: 0.82rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 10px;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 9999px;
  background: var(--primary);
  color: #fff;
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
}

.login-intro {
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
  font-size: 1rem;
  line-height: 1.75;
  color: var(--body);
  margin-bottom: 30px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 10px;
  color: var(--ink);
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
}

.input-wrapper {
  position: relative;
}

.input-wrapper i {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  font-size: 1rem;
}

.icon-user:before {
  content: "👤";
}

.icon-lock:before {
  content: "🔒";
}

input {
  width: 100%;
  padding: 14px 16px 14px 48px;
  border: 1px solid var(--hairline);
  border-radius: 12px;
  background: var(--canvas);
  color: var(--ink);
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(204, 120, 92, 0.12);
}

input::placeholder {
  color: var(--muted);
}

.submit-btn {
  width: 100%;
  padding: 14px 0;
  border-radius: 12px;
  background: var(--primary);
  color: var(--canvas);
  border: none;
  cursor: pointer;
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  transition: background-color 0.2s ease, transform 0.2s ease;
  margin-top: 14px;
}

.submit-btn:hover:not(:disabled) {
  background: var(--primary-active);
  transform: translateY(-1px);
}

.submit-btn:disabled {
  background: var(--primary-disabled);
  color: var(--muted);
  cursor: not-allowed;
}

.loading-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

.login-links {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  gap: 15px;
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
  font-size: 0.94rem;
  color: var(--muted);
}

.login-links a {
  color: var(--ink);
  text-decoration: none;
  transition: color 0.2s ease;
}

.login-links a:hover {
  color: var(--primary);
}

.security-note {
  margin-top: 22px;
  padding: 16px;
  border-radius: 12px;
  background: var(--surface-cream-strong);
  color: var(--muted);
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
  font-size: 0.9rem;
  line-height: 1.6;
}

.modal {
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 19, 0.52);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: min(420px, calc(100% - 48px));
  background: #fff;
  border-radius: 18px;
  padding: 32px;
  box-shadow: 0 20px 60px rgba(20, 20, 19, 0.15);
  text-align: center;
}

.modal-content h3 {
  margin: 0 0 14px;
  font-family: 'Copernicus', 'Tiempos Headline', serif;
  font-size: 1.8rem;
  color: var(--ink);
}

.modal-content p {
  margin: 0 0 24px;
  color: var(--body);
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
  font-size: 1rem;
  line-height: 1.75;
}

.modal-content button {
  min-width: 160px;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  background: var(--primary);
  color: #fff;
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
  font-size: 0.95rem;
  cursor: pointer;
}

.modal-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 18px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 28px;
}

.modal-icon.success {
  color: #48bb78;
  background: rgba(72, 187, 120, 0.12);
}

.modal-icon.error {
  color: #c64545;
  background: rgba(198, 69, 69, 0.12);
}

@media (max-width: 980px) {
  .auth-grid {
    grid-template-columns: 1fr;
  }

  .login-panel {
    justify-content: center;
  }
}

@media (max-width: 680px) {
  .auth-shell {
    padding: 24px 16px;
  }

  .hero-copy h1 {
    font-size: 2.4rem;
  }

  .login-card {
    padding: 28px 24px;
  }

  .login-card-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .login-links {
    flex-direction: column;
    align-items: stretch;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
