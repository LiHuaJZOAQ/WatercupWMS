<template>
  <div class="md3-nav-drawer">
    <div class="logo-container">
      <md-icon class="logo-icon">inventory_2</md-icon>
      <span class="logo-text">General WMS</span>
    </div>

    <div class="nav-content">
      <md-list>
        <md-list-item type="button" :active="selectedIndex === '首页'" @click="handleMenuClick('首页')">
          <md-icon slot="start">home</md-icon>
          <div slot="headline">首页</div>
        </md-list-item>

        <div class="nav-divider"></div>
        <div class="nav-subheader">基础数据</div>

        <md-list-item type="button" :active="selectedIndex === '基础数据/往来单位管理'" @click="handleMenuClick('基础数据/往来单位管理')">
          <md-icon slot="start">group</md-icon>
          <div slot="headline">往来单位管理</div>
        </md-list-item>
        <md-list-item type="button" :active="selectedIndex === '基础数据/部门管理'" @click="handleMenuClick('基础数据/部门管理')">
          <md-icon slot="start">corporate_fare</md-icon>
          <div slot="headline">部门管理</div>
        </md-list-item>
        <md-list-item type="button" :active="selectedIndex === '基础数据/商品档案'" @click="handleMenuClick('基础数据/商品档案')">
          <md-icon slot="start">category</md-icon>
          <div slot="headline">商品档案 (SKU)</div>
        </md-list-item>

        <div class="nav-divider"></div>
        <div class="nav-subheader">仓储业务</div>

        <md-list-item type="button" :active="selectedIndex === '入库管理/通用入库单'" @click="handleMenuClick('入库管理/通用入库单')">
          <md-icon slot="start">arrow_downward</md-icon>
          <div slot="headline">入库单管理</div>
        </md-list-item>
        <md-list-item type="button" :active="selectedIndex === '出库管理/通用出库单'" @click="handleMenuClick('出库管理/通用出库单')">
          <md-icon slot="start">arrow_upward</md-icon>
          <div slot="headline">出库单管理</div>
        </md-list-item>
        <md-list-item type="button" :active="selectedIndex === '出库管理/波次拣货'" @click="handleMenuClick('出库管理/波次拣货')">
          <md-icon slot="start">view_timeline</md-icon>
          <div slot="headline">智能波次拣货</div>
        </md-list-item>
        <md-list-item type="button" :active="selectedIndex === '盘点管理/通用盘点'" @click="handleMenuClick('盘点管理/通用盘点')">
          <md-icon slot="start">fact_check</md-icon>
          <div slot="headline">库存盘点作业</div>
        </md-list-item>
        
        <div class="nav-divider"></div>
        <div class="nav-subheader">库存与仓位</div>

        <md-list-item type="button" :active="selectedIndex === '库存管理/全局库存'" @click="handleMenuClick('库存管理/全局库存')">
          <md-icon slot="start">inventory</md-icon>
          <div slot="headline">全局库存查询</div>
        </md-list-item>
        <md-list-item type="button" :active="selectedIndex === '仓位管理/仓库库位'" @click="handleMenuClick('仓位管理/仓库库位')">
          <md-icon slot="start">place</md-icon>
          <div slot="headline">仓库库位</div>
        </md-list-item>

        <div class="nav-divider"></div>
        <div class="nav-subheader">系统与设置</div>

        <md-list-item type="button" :active="selectedIndex === '系统设置/用户管理'" @click="handleMenuClick('系统设置/用户管理')">
          <md-icon slot="start">manage_accounts</md-icon>
          <div slot="headline">用户管理</div>
        </md-list-item>
        <md-list-item type="button" :active="selectedIndex === '系统设置/角色管理'" @click="handleMenuClick('系统设置/角色管理')">
          <md-icon slot="start">admin_panel_settings</md-icon>
          <div slot="headline">角色管理</div>
        </md-list-item>
        <md-list-item type="button" :active="selectedIndex === '系统设置/操作日志'" @click="handleMenuClick('系统设置/操作日志')">
          <md-icon slot="start">history</md-icon>
          <div slot="headline">操作日志</div>
        </md-list-item>

        <div class="nav-divider"></div>
        <div class="nav-subheader">创新功能</div>
        <md-list-item type="button" :active="selectedIndex === '创新功能/移动扫码台'" @click="handleMenuClick('创新功能/移动扫码台')">
          <md-icon slot="start">qr_code_scanner</md-icon>
          <div slot="headline">移动扫码工作台</div>
        </md-list-item>

      </md-list>
    </div>

    <LogoutView :State="LogoutState" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import LogoutView from '@/views/LogoutView.vue'

const LogoutState = ref(false)
const selectedIndex = ref('首页')
const emit = defineEmits(['onChangeView'])

const sendChangeView = (view: any) => {
  emit('onChangeView', view)
}

const handleMenuClick = (index: string) => {
  selectedIndex.value = index;
  
  if (index === "首页") {
    sendChangeView("MainView")
  } else if (index === "基础数据/往来单位管理") {
    sendChangeView("SupplierManage")
  } else if (index === "基础数据/部门管理") {
    sendChangeView("DepartmentManage")
  } else if (index === "基础数据/商品档案") {
    sendChangeView("FinishedProductManage")
  } else if (index === "入库管理/通用入库单") {
    sendChangeView("InStorageRawMaterial")
  } else if (index === '出库管理/通用出库单') {
    sendChangeView('OutStorageRawMaterial')
  } else if (index === '出库管理/波次拣货') {
    sendChangeView('WavePicking')
  } else if (index === '盘点管理/通用盘点') {
    sendChangeView('CheckStorageRawMaterial')
  } else if (index === '库存管理/全局库存') {
    sendChangeView('InventoryRawMaterial')
  } else if (index === '仓位管理/仓库库位') {
    sendChangeView('LocationRawMaterial')
  } else if (index === '系统设置/用户管理') {
    sendChangeView('UserManage')
  } else if (index === '系统设置/角色管理') {
    sendChangeView('RoleManage')
  } else if (index === '系统设置/操作日志') {
    sendChangeView('OperationLog')
  } else if (index === '创新功能/移动扫码台') {
    sendChangeView('MobileScanner')
  } else if (index === '系统设置/系统退出') {
    LogoutState.value = LogoutState.value == true ? false : true
  }
};
</script>

<style scoped lang="scss">
.md3-nav-drawer {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: var(--md-sys-color-surface-container, #f2f3f5);
  color: var(--md-sys-color-on-surface, #1a1c1e);
}

.logo-container {
  display: flex;
  align-items: center;
  padding: 24px 28px;
  gap: 12px;
  
  .logo-icon {
    font-size: 28px;
    color: var(--md-sys-color-primary, #0061a4);
  }
  
  .logo-text {
    font-size: 20px;
    font-weight: 600;
    color: var(--md-sys-color-on-surface, #1a1c1e);
    letter-spacing: -0.5px;
  }
}

.nav-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 24px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--md-sys-color-outline-variant, #c2c7cf);
    border-radius: 4px;
  }
}

md-list {
  --md-list-container-color: transparent;
}

md-list-item {
  border-radius: 28px;
  margin-bottom: 4px;
  --md-list-item-label-text-weight: 500;
  
  &[active] {
    --md-list-item-container-color: var(--md-sys-color-secondary-container, #d7e2ff);
    --md-list-item-label-text-color: var(--md-sys-color-on-secondary-container, #001a41);
    --md-list-item-leading-icon-color: var(--md-sys-color-on-secondary-container, #001a41);
  }
}

.nav-divider {
  height: 1px;
  background-color: var(--md-sys-color-outline-variant, #c2c7cf);
  margin: 12px 16px;
}

.nav-subheader {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--md-sys-color-primary, #0061a4);
  letter-spacing: 0.1px;
}
</style>
