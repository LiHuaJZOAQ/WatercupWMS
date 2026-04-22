<template>
  <el-row class="tac">
    <el-menu active-text-color="#ffd04b" background-color="#545c64" class="el-menu-vertical-demo" default-active="首页"
      text-color="#fff" @select="handleMenuClick" @open="handleOpen" @close="handleClose">
      <el-menu-item index="首页">
        <template #title>
          <el-icon>
            <HomeFilled />
          </el-icon>
          <span>首页</span>
        </template>
      </el-menu-item>
      <el-sub-menu index="入库管理">
        <template #title>
          <el-icon>
            <Sell />
          </el-icon>
          <span>入库管理</span>
        </template>
        <el-menu-item index="入库管理/原料入库">原料入库</el-menu-item>
        <el-menu-item index="入库管理/产品入库">产品入库</el-menu-item>
        <el-menu-item index="入库管理/其他入库">其他入库</el-menu-item>
      </el-sub-menu>
      <el-sub-menu index="出库管理">
        <template #title>
          <el-icon>
            <Van />
          </el-icon>
          <span>出库管理</span>
        </template>
        <el-menu-item index="出库管理/原料出库">原料出库</el-menu-item>
        <el-menu-item index="出库管理/产品出库">产品出库</el-menu-item>
        <el-menu-item index="出库管理/其他出库">其他出库</el-menu-item>
      </el-sub-menu>
      <el-sub-menu index="盘点管理">
        <template #title>
          <el-icon>
            <DocumentChecked />
          </el-icon>
          <span>盘点管理</span>
        </template>
        <el-menu-item index="盘点管理/原料盘点">原料盘点</el-menu-item>
        <el-menu-item index="盘点管理/产品盘点">产品盘点</el-menu-item>
        <el-menu-item index="盘点管理/其他盘点">其他盘点</el-menu-item>
      </el-sub-menu>
      <el-sub-menu index="库存管理">
        <template #title>
          <el-icon>
            <Coin />
          </el-icon>
          <span>库存管理</span>
        </template>
        <el-menu-item index="库存管理/原料库存">原料库存</el-menu-item>
        <el-menu-item index="库存管理/产品库存">产品库存</el-menu-item>
        <el-menu-item index="库存管理/其他库存">其他库存</el-menu-item>
      </el-sub-menu>
      <el-sub-menu index="仓位管理">
        <template #title>
          <el-icon>
            <Location />
          </el-icon>
          <span>仓位管理</span>
        </template>
        <el-menu-item index="仓位管理/原料仓位">一般仓位</el-menu-item>
        <!-- <el-menu-item index="仓位管理/产品仓位">仓位</el-menu-item> -->
        <el-menu-item index="仓位管理/其他仓位">其他仓位</el-menu-item>
      </el-sub-menu>
      <el-sub-menu index="系统设置">
        <template #title>
          <el-icon>
            <setting />
          </el-icon>
          <span>系统设置</span>
        </template>
        <el-sub-menu index="系统管理">
          <template #title>
            <span>系统管理</span>
          </template>
          <el-menu-item index="系统设置/用户管理">用户管理</el-menu-item>
          <el-menu-item index="系统设置/权限管理">权限管理</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="数据管理">
          <template #title>
            <span>数据管理</span>
          </template>
          <el-menu-item index="系统设置/数据备份">数据备份</el-menu-item>
          <el-menu-item index="系统设置/数据恢复">数据恢复</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="系统设置/系统退出">退出登录</el-menu-item>
        <el-menu-item index="系统设置/系统修改密码">修改密码</el-menu-item>
      </el-sub-menu>
    </el-menu>
  </el-row>
  <template>
    <LogoutView :State="LogoutState" />
  </template>
</template>

<script lang="ts" setup>
import {
  Document,
  Menu as IconMenu,
  Location,
  Setting,
} from '@element-plus/icons-vue'
import { ref } from 'vue'
import LogoutView from '@/views/LogoutView.vue'
import { fa } from 'element-plus/es/locales.mjs'

const LogoutState = ref(false)
const selectedIndex = ref('首页')
const emit = defineEmits(['onChangeView'])
const sendChangeView = (view: any) => {
  emit('onChangeView', view)
}
const handleMenuClick = (index: string) => {
  if (index === "首页") {
    console.log("首页")
    sendChangeView("MainView")
  } else if (index === "入库管理/原料入库") {
    sendChangeView("InStorageRawMaterial")
  } else if (index === '出库管理/原料出库') {
    sendChangeView('OutStorageRawMaterial')
  } else if (index === '盘点管理/原料盘点') {
    sendChangeView('CheckStorageRawMaterial')
  } else if (index === '库存管理/原料库存') {
    sendChangeView('InventoryRawMaterial')
  } else if (index === '仓位管理/原料仓位') {
    sendChangeView('LocationRawMaterial')
  } else if (index === '系统设置/系统退出') {
    LogoutState.value = LogoutState.value == true ? false : true
  }
};
const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
</script>

<style scoped lang="scss">
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
  height: 100vh;
}
</style>