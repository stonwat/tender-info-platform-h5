<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 导航栏 -->
    <Navbar :selected-region="selectedRegion" :search-query="searchQuery" :selected-date="selectedDate"
      @region-change="handleRegionChange" @date-change="handleDateChange" @refresh="handleRefresh"
      @search="handleSearch" />

    <!-- 主体内容 -->
    <main class="container mx-auto px-4 py-4">
      <!-- Tab 导航栏（响应式换行+渐变下划线） -->
      <div class="tab-nav flex flex-wrap border-b border-gray-200 mb-4">
        <button class="tab-btn flex-1 sm:flex-auto px-2 sm:px-4 py-2 text-sm font-medium transition-colors" :class="{
          'text-gray-500 hover:text-primary': currentTab !== 'tender',
          'text-primary font-semibold': currentTab === 'tender'
        }" @click="switchTab('tender')">
          项目采购
          <div v-if="currentTab === 'tender'" class="w-full h-1 mt-1 bg-gradient-to-r from-primary to-accent"></div>
        </button>
        <button class="tab-btn flex-1 sm:flex-auto px-2 sm:px-4 py-2 text-sm font-medium transition-colors" :class="{
          'text-gray-500 hover:text-primary': currentTab !== 'other',
          'text-primary font-semibold': currentTab === 'other'
        }" @click="switchTab('other')">
          服务工程
          <div v-if="currentTab === 'other'" class="w-full h-1 mt-1 bg-gradient-to-r from-primary to-accent"></div>
        </button>
      </div>

      <!-- 筛选标签（带清除Icon） -->
      <FilterTags :selected-region="selectedRegion" :search-query="searchQuery" @clear-region="handleClearRegion"
        @clear-search="handleClearSearch" @clear-all="handleClearAll" />

      <!-- 列表计数（增强对比） -->
      <div class="text-xs text-neutral mb-4 flex justify-between items-center">
        <span>共找到
          <span class="text-primary font-medium">{{ currentTotalCount }}</span> 条信息
        </span>
        <span v-if="currentTotalCount > 0" class="text-xs text-gray-400">
          显示 {{ startIndex }}-{{ endIndex }} 条
        </span>
      </div>

      <!-- 列表内容 -->
      <ul class="space-y-3">
        <!-- 加载中（渐变骨架屏） -->
        <template v-if="isLoading && currentTenders.length === 0">
          <li v-for="i in 5" :key="i" class="loading-skeleton rounded-lg p-4">
            <div class="flex items-center space-x-4">
              <div class="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div class="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          </li>
        </template>

        <!-- 有数据 -->
        <template v-else-if="currentTenders.length > 0">
          <TenderItem v-for="(tender, index) in currentTenders" :key="tender.url" :tender="tender" :index="index"
            :current-tab="currentTab" :serial-number="getSerialNumber(index)" />
        </template>

        <!-- 无数据（引导性提示） -->
        <template v-else>
          <li class="py-8 text-center space-y-3">
            <div class="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <i class="fa fa-search text-3xl text-gray-300"></i>
            </div>
            <p class="text-neutral">暂无匹配的{{ currentTab === 'tender' ? '招标' : '服务工程' }}信息</p>
            <button @click="handleRefresh"
              class="mt-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">
              重新加载
            </button>
          </li>
        </template>

        <!-- 👇 下拉加载的观察占位符 -->
        <div ref="observeTarget" class="observe-target"></div>

        <!-- 无更多数据提示 -->
        <li v-if="!hasMore && currentPage > 1" class="no-more-data py-4 text-center text-sm text-neutral">
          <div class="inline-flex items-center gap-2">
            <i class="fa fa-check-circle text-success"></i>
            <span>已加载全部数据</span>
          </div>
        </li>
      </ul>
    </main>

    <!-- 页脚、回到顶部按钮、错误提示 保持原有代码不变 -->
    <footer class="py-4 text-center text-xs text-neutral border-t border-gray-100">
      <p>© 2025 招标信息平台. 保留所有权利.</p>
    </footer>

    <button @click="scrollToTop"
      class="fixed bottom-6 right-6 bg-primary text-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all z-50"
      :class="{
        'opacity-0 invisible': !showBackToTop,
        'opacity-100 visible': showBackToTop,
        'scale-90 hover:scale-100': showBackToTop
      }">
      <i class="fa fa-arrow-up text-sm"></i>
    </button>

    <div v-if="errorMessage"
      class="error-toast fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg z-50 animate-fade-in">
      <div class="flex items-center gap-2">
        <i class="fa fa-exclamation-circle"></i>
        <span>{{ errorMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onActivated, onUnmounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Navbar from '../components/Navbar.vue';
import TenderItem from '../components/TenderItem.vue';
import FilterTags from '../components/FilterTags.vue';

import { getProjectPurchaseList } from '../api/project-purchase';
import { getServiceMartList } from '../api/service-mart';
import { formatDateForApi } from '../utils/format';

// 👇 新增：观察目标和观察者实例
const observeTarget = ref(null);
let observer = null;

// 核心刷新逻辑（保持不变）
const handleRefresh = () => {
  loadInitialData();
};

// 加载初始数据（保持不变）
const loadInitialData = async () => {
  isLoading.value = true;
  currentPage.value = 1;
  try {
    const params = {
      page: currentPage.value - 1,
      size: itemsPerPage.value,
      region: selectedRegion.value || '',
      keyword: searchQuery.value.trim() || '',
      date: selectedDate.value || ''
    };

    let data;
    if (currentTab.value === 'tender') {
      data = await getProjectPurchaseList(params);
      const formattedTenders = data.content.map(item => ({
        ...item, // 保留原有字段（如title、url等）
      }));
      tenders.value = formattedTenders; // 赋值处理后的数据
      // tenders.value = data.content;
      totalCounts.value.tender = data.totalElements;
    } else {
      data = await getServiceMartList(params);
      const formattedTenders = data.content.map(item => ({
        ...item, // 保留原有字段（如title、url等）
        budget: `${item.budget}元`,
        matter: '——' 
      }));
      otherTenders.value = formattedTenders; // 赋值处理后的数据
      // console.log(otherTenders,'other')
      // otherTenders.value = data.content;
      totalCounts.value.other = data.totalElements;
    }

    hasMore.value = (currentPage.value * itemsPerPage.value) < currentTotalCount.value;
    errorMessage.value = '';
  } catch (err) {
    errorMessage.value = `加载${currentTab.value === 'tender' ? '项目采购' : '服务工程'}信息失败，请稍后重试`;
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

// 加载更多数据（保持不变）
const loadMoreData = async () => {
  if (isLoading.value || !hasMore.value) return;
  isLoading.value = true;
  currentPage.value++;

  try {
    const params = {
      page: currentPage.value - 1,
      size: itemsPerPage.value,
      region: selectedRegion.value || '',
      keyword: searchQuery.value.trim() || '',
      date: selectedDate.value || ''
    };

    let data;
    if (currentTab.value === 'tender') {
      data = await getProjectPurchaseList(params);
      const formattedTenders = data.content.map(item => ({
        ...item, // 保留原有字段（如title、url等）
      }));
      tenders.value = [...tenders.value, ...formattedTenders];
      totalCounts.value.tender = data.totalElements;
    } else {
      data = await getServiceMartList(params);
      const formattedTenders = data.content.map(item => ({
        ...item, // 保留原有字段（如title、url等）
        budget: `${item.budget}元`,
        matter: '——' 
      }));
      otherTenders.value = [...otherTenders.value, ...formattedTenders];
      totalCounts.value.other = data.totalElements;
    }

    hasMore.value = (currentPage.value * itemsPerPage.value) < currentTotalCount.value;
  } catch (err) {
    errorMessage.value = `加载更多${currentTab.value === 'tender' ? '项目采购' : '服务工程'}信息失败，请稍后重试`;
    currentPage.value--;
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

// 👇 新增：初始化 Intersection Observer
const initObserver = () => {
  // 断开旧观察者（避免重复监听）
  if (observer) {
    observer.disconnect();
  }
  // 绑定新观察者
  if (observeTarget.value) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 当占位符进入视口、有更多数据、且未在加载中时，触发加载
          if (entry.isIntersecting && hasMore.value && !isLoading.value) {
            loadMoreData();
          }
        });
      },
      {
        threshold: 0.1, // 占位符 10% 进入视口即触发
      }
    );
    observer.observe(observeTarget.value);
  }
};

// 路由和状态管理（保持不变）
const router = useRouter();
const route = useRoute();

const currentTab = ref('tender');
const tenders = ref([]);
const otherTenders = ref([]);
const totalCounts = ref({ tender: 0, other: 0 });
const currentPage = ref(1);
const itemsPerPage = ref(10);
const isLoading = ref(true);
const hasMore = ref(true);
const searchQuery = ref('');
const selectedRegion = ref('');
const selectedDate = ref('');
const errorMessage = ref('');
const showBackToTop = ref(false);

// 计算属性（保持不变）
const currentTenders = computed(() => {
  return currentTab.value === 'tender' ? tenders.value : otherTenders.value;
});
const currentTotalCount = computed(() => {
  return totalCounts.value[currentTab.value] || 0;
});

const getSerialNumber = (index) => {
  return index + 1;//( currentPage.value - 1) * itemsPerPage.value + index + 1
};

const startIndex = computed(() => {
  return 1;
});
const endIndex = computed(() => {
  return Math.min(currentPage.value * itemsPerPage.value, currentTotalCount.value);
});

// 交互函数（保持不变）
const switchTab = (tab) => {
  if (currentTab.value === tab) return;
  currentTab.value = tab;
  currentPage.value = 1;
  handleRefresh();
};

const handleSearch = (query) => {
  searchQuery.value = query;
  handleRefresh();
};

const handleDateChange = (date) => {
  selectedDate.value = date;
  handleRefresh();
};

const handleRegionChange = (region) => {
  selectedRegion.value = region;
  handleRefresh();
};

const handleClearSearch = () => {
  searchQuery.value = '';
  handleRefresh();
};

const handleClearRegion = () => {
  selectedRegion.value = '';
  handleRefresh();
};

const handleClearAll = () => {
  selectedRegion.value = '';
  searchQuery.value = '';
  handleRefresh();
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  showBackToTop.value = scrollTop > 300;
};

// 监听筛选条件和 currentTab 变化，更新路由参数
watch(
  [() => selectedRegion.value, () => selectedDate.value, () => searchQuery.value, () => currentTab.value],
  ([newRegion, newDate, newKeyword, newTab]) => {
    router.replace({
      name: 'TenderList',
      query: {
        region: newRegion || '',
        date: newDate || '',
        keyword: newKeyword || '',
        tab: newTab || '' // 新增：将 currentTab 存入路由参数（用 tab 作为键）
      }
    });
  },
  { immediate: true }
);

// 👇 监听数据变化，重新初始化观察者
watch(currentTenders, () => {
  nextTick(() => { // 确保 DOM 渲染完成后再初始化
    initObserver();
  });
});

// 生命周期（新增观察者管理）
onMounted(() => {
  // 原有逻辑：恢复 URL 参数、加载数据
  const urlParams = new URLSearchParams(window.location.search);
  selectedRegion.value = urlParams.get('region') || '';
  selectedDate.value = urlParams.get('date') || '';
  searchQuery.value = urlParams.get('keyword') || '';
  const tabFromUrl = urlParams.get('tab');
  if (tabFromUrl && ['tender', 'other'].includes(tabFromUrl)) {
    currentTab.value = tabFromUrl;
  }
  if (!selectedDate.value) {
    selectedDate.value = formatDateForApi(new Date());
  }
  handleRefresh();
  window.addEventListener('scroll', handleScroll);

  // 初始化观察者
  initObserver();
});

onUnmounted(() => {
  // 销毁观察者，避免内存泄漏
  if (observer) {
    observer.disconnect();
  }
  window.removeEventListener('scroll', handleScroll);
});

onActivated(() => {
  handleRefresh();
  // 切换回页面时，重新初始化观察者
  nextTick(() => {
    initObserver();
  });
});
</script>

<style scoped>
/* 原有样式保持不变 */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 骨架屏动画 */
.loading-skeleton {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: skeleton-animation 1.5s infinite;
}

@keyframes skeleton-animation {
  0% {
    background-position: -200% 0;
  }

  100% {
    background-position: 200% 0;
  }
}

/* 错误提示动效 */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translate(-50%, -10px);
  }

  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .tab-btn {
    @apply px-2;
  }
}

/* 👇 新增：观察占位符样式（透明，不影响布局） */
.observe-target {
  height: 1px;
  visibility: hidden;
}
</style>