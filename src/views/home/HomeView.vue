<template>
  <div class="md3-layout">
    <div class="md3-aside">
      <NavigationView @onChangeView="changeView" />
    </div>
    <div class="md3-content">
      <header class="md3-header">
        <TopView />
      </header>
      <main class="md3-main">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useCounterStore } from '@/stores/counter'
import { ref } from 'vue';
import { defineOptions, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NavigationView from './components/NavigationView.vue';
import TopView from './components/TopView.vue';
// import MainView from './components/MainView.vue';
// import RawMaterial from './components/InStorage/RawMaterial.vue';
// import Review from './components/InStorage/Review.vue';

// 在 setup 语法糖中无法直接使用 components 选项
// 需要通过以下方式注册：
// defineOptions({
//   components: {
//     MainView,
//     RawMaterial,
//     Review,
// }
// })

const counter = useCounterStore();
const router = useRouter();


// const currentView = ref("MainView");
const changeView = (view: string) => {
  counter.currentView = view;
  console.log(view)
  router.push({ name: view });

};

</script>
<style scoped lang="scss">
.md3-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: var(--md-sys-color-background, #fdfdfd);
  color: var(--md-sys-color-on-background, #1a1c1e);
  overflow: hidden;
}

.md3-aside {
  width: 280px;
  background-color: var(--md-sys-color-surface-container, #f2f3f5);
  border-right: 1px solid var(--md-sys-color-outline-variant, #c2c7cf);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.md3-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.md3-header {
  height: 64px;
  background-color: var(--md-sys-color-surface, #fdfdfd);
  border-bottom: 1px solid var(--md-sys-color-outline-variant, #c2c7cf);
  display: flex;
  align-items: center;
  padding: 0 24px;
}

.md3-main {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background-color: var(--md-sys-color-background, #fdfdfd);
}
</style>
