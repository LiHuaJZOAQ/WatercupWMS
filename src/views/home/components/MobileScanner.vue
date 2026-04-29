<template>
  <div class="md3-page">
    <md-elevated-card class="md3-card md3-card--tight">
      <div class="scanner-header">
        <div class="scanner-title">
          <md-icon aria-hidden="true">qr_code_scanner</md-icon>
          移动扫码工作台 (PDA)
        </div>
        <md-assist-chip>
          <md-icon slot="icon">wifi</md-icon>
          连接正常
        </md-assist-chip>
      </div>
    </md-elevated-card>

    <md-elevated-card class="md3-card">
      <div class="camera-placeholder" @click="focusInput">
        <md-icon class="camera-icon">photo_camera</md-icon>
        <p>点击此处唤起扫码枪输入焦点</p>
        <p class="sub-text">(或直接使用键盘输入条码并回车)</p>
      </div>

      <div class="input-section" style="display: flex; gap: 8px;">
        <md-outlined-text-field
          ref="scanInput"
          :value="barcode"
          @input="barcode = $event.target.value"
          placeholder="扫描或输入条码 (如: LOC-A1-01, MAT-1001)"
          @keyup.enter="handleScan"
          style="flex: 1;"
        >
          <md-icon slot="leading-icon">barcode_reader</md-icon>
        </md-outlined-text-field>
        <md-filled-button @click="handleScan" style="margin-top: 8px;">确定</md-filled-button>
      </div>
    </md-elevated-card>

    <!-- 最近扫描记录 -->
    <md-elevated-card class="md3-card">
      <div class="history-header">近期扫码记录 (本地模拟)</div>
      <div v-if="scanHistory.length > 0" class="history-list">
        <div v-for="(item, index) in scanHistory" :key="index" class="history-item" :data-type="item.type">
          <div class="history-meta">
            <div class="history-code">{{ item.code }}</div>
            <div class="history-time">{{ item.time }}</div>
          </div>
          <div class="history-msg">{{ item.message }}</div>
        </div>
      </div>
      <div v-else class="history-empty">
        <md-icon>inbox</md-icon>
        暂无扫描记录
      </div>
    </md-elevated-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import moment from 'moment';
import { notifySuccess, notifyError } from '@/utils/notify'

const scanInput = ref(null);
const barcode = ref('');
const scanHistory = ref([]);

// 聚焦输入框，模拟 PDA 扫码准备
const focusInput = () => {
  nextTick(() => {
    if (scanInput.value) {
      scanInput.value.focus();
    }
  });
};

// 模拟扫码处理逻辑
const handleScan = () => {
  const code = barcode.value.trim().toUpperCase();
  if (!code) {
    notifyError('请输入或扫描有效条码');
    return;
  }

  let type = 'info';
  let message = '';

  // 简单的条码规则解析演示
  if (code.startsWith('LOC-')) {
    type = 'success';
    message = `成功定位到库位: ${code.replace('LOC-', '')}`;
  } else if (code.startsWith('MAT-')) {
    type = 'primary';
    message = `识别到原材料: ${code.replace('MAT-', '')}`;
  } else if (code.startsWith('ORD-')) {
    type = 'warning';
    message = `读取到单据号: ${code}`;
  } else {
    type = 'danger';
    message = `未知的条码格式，请核对标签`;
  }

  // 插入历史记录 (最新在前)
  scanHistory.value.unshift({
    code,
    type,
    message,
    time: moment().format('HH:mm:ss')
  });

  // 保持记录在 10 条以内
  if (scanHistory.value.length > 10) {
    scanHistory.value.pop();
  }

  if (type === 'danger') {
    notifyError(message);
  } else {
    notifySuccess(message);
  }
  
  barcode.value = ''; // 清空以备下次扫码
  focusInput();
};

onMounted(() => {
  focusInput();
});
</script>

<style scoped lang="scss">
.scanner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.scanner-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 800;
  color: var(--md-sys-color-on-surface);
}

.camera-icon {
  font-size: 28px;
  color: var(--md-sys-color-primary);
}

.camera-placeholder {
  height: 150px;
  background-color: var(--md-sys-color-surface-container-low);
  border: 2px dashed var(--md-sys-color-outline-variant);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 20px;
}

.camera-placeholder:hover {
  border-color: var(--md-sys-color-primary);
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, var(--md-sys-color-surface-container-low));
}

.camera-placeholder p {
  margin: 5px 0;
  color: var(--md-sys-color-on-surface);
  font-weight: 700;
}

.sub-text {
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant) !important;
  font-weight: normal !important;
}

.history-header {
  font-size: 14px;
  font-weight: 800;
  color: var(--md-sys-color-on-surface);
  margin-bottom: 12px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 16px;
  padding: 12px 14px;
  background: var(--md-sys-color-surface-container-lowest);
}

.history-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
}

.history-code {
  font-weight: 900;
  letter-spacing: 0.3px;
  color: var(--md-sys-color-on-surface);
}

.history-time {
  font-size: 12px;
  font-weight: 700;
  color: var(--md-sys-color-on-surface-variant);
}

.history-msg {
  margin: 4px 0 0;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 13px;
}

.history-empty {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 2px;
  color: var(--md-sys-color-on-surface-variant);
  font-weight: 650;
}
</style>
