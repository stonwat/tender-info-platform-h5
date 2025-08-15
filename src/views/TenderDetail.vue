<template>
  <div class="max-w-lg mx-auto p-4">
    <!-- 返回按钮 -->
    <button class="back-btn mb-4" @click="goBack">
      <i class="fa fa-chevron-left mr-2"></i>
    </button>

    <!-- 详情卡片 -->
    <div class="bg-white rounded-lg shadow p-6">
      <h1 class="text-xl font-bold mb-4" id="title">{{ tender?.title || '加载中...' }}</h1>

      <div class="detail-item flex items-start gap-2">
        <i class="fa fa-money text-primary mt-0.5 w-5 text-center"></i>
        <span>预算：{{ tender?.budget || '——' }}</span>
      </div>
      <div class="detail-item flex items-start gap-2">
        <i class="fa fa-list-alt text-primary mt-0.5 w-5 text-center"></i>
        <span>标的：{{ tender?.matter || '——' }}</span>
      </div>

      <div class="detail-item flex items-start gap-2">
        <i class="fa fa-tags text-primary mt-0.5 w-5 text-center"></i>
        <span>类型：{{ tender?.category || '——' }}</span>
      </div>
      <div class="detail-item flex items-start gap-2">
        <i class="fa fa-map-marker text-primary mt-0.5 w-5 text-center"></i>
        <span>地区：{{ formatRegion(tender?.region) || '——' }} {{  formatCounty(tender?.county) || '' }}</span>
      </div>
      <!-- <div class="detail-item flex items-start gap-2">
        <i class="fa fa-calendar-plus-o text-primary mt-0.5 w-5 text-center"></i>
        <span>报名时间：{{ tender?.startTime || '——' }}</span>
      </div> -->
      <div class="detail-item flex items-start gap-2">
        <i class="fa fa-calendar-plus-o text-primary mt-0.5 w-5 text-center"></i>
        <span>
          {{ route.query.currentTab === 'tender' ? '报名开始时间' : '报名开始时间' }}：
          {{ tender?.startTime || '——' }}
        </span>
      </div>
      <div class="detail-item flex items-start gap-2">
        <i class="fa fa-calendar-times-o text-primary mt-0.5 w-5 text-center"></i>
        <span>报名结束时间：{{ tender?.endTime || '——' }}</span>
      </div>
      <div class="detail-item flex items-start gap-2">
        <i class="fa fa-link text-primary mt-0.5 w-5 text-center"></i>
        链接：
        <a v-if="tender?.url" :href="tender.url" target="_blank" class="flex items-center url-link">
          <i class="fa fa-external-link-square text-primary mr-2 w-5"></i> <!-- 外部链接图标 -->
          <span class="text-blue-600 hover:underline">黑龙江省政府采购网</span> <!-- 固定显示网站名称 -->
        </a>
        <span v-else>——</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getProjectPurchaseDetailByUrl } from '../api/tenders/project-purchase';
import { getServiceMartDetailByUrl } from '../api/tenders/service-mart';
import { formatRegion,formatCounty } from '../utils/format';

// 路由参数
const route = useRoute();
const router = useRouter();
const tender = ref(null);

const goBack = () => {
  // 返回时携带之前的筛选条件
  router.push({
    name: 'TenderList', // 列表页的路由名称
    query: {
      region: route.query.region,  // 保留region
      keyword: route.query.keyword, // 保留keyword
      date: route.query.date,        // 保留date参数
      tab: route.query.currentTab // 保留tab参数
    }
  });
};

// 封装 URL 显示（提取域名或截断）
const formatUrl = (url) => {
  if (!url) return '——';
  try {
    const parsedUrl = new URL(url); // 解析 URL
    return parsedUrl.hostname;      // 显示域名（如 hljcg.hlj.gov.cn）
  } catch (error) {
    // 解析失败时，截断显示前30个字符
    const maxLength = 30;
    return url.length > maxLength
      ? `${url.slice(0, maxLength)}...`
      : url;
  }
};

// 加载详情
onMounted(async () => {
  // 获取路由参数中的 currentTab 和 url
  const currentTab = route.query.currentTab; // 从路由参数获取 currentTab
  const encodedUrl = route.query.url;

  // console.log('当前currentTab:', currentTab, '当前url:', encodedUrl);

  if (!encodedUrl) {
    alert('参数错误：未找到url');
    return;
  }

  // 解码url（处理特殊字符）
  const decodedUrl = decodeURIComponent(encodedUrl);

  try {
    let res;
    let formattedData;
    // 根据 currentTab 调用不同接口
    if (currentTab === 'tender') {
      // 项目采购详情接口
      res = await getProjectPurchaseDetailByUrl(decodedUrl);

      formattedData = {
        ...res, // 保留原有所有字段（id、title、budget等）
      };
    } else if (currentTab === 'other') {
      // 服务工程详情接口
      res = await getServiceMartDetailByUrl(decodedUrl);
      // 安全解析 llm 字段中的项目类型
      let projectType = '——';
      if (res.llm) {
        try {
          const parsedLlm = JSON.parse(res.llm);
          projectType = parsedLlm["项目类型"] || '——';
        } catch (parseError) {
          console.error('解析项目类型失败:', parseError);
          projectType = '——'; // 显示错误提示而非崩溃
        }
      }

      formattedData = {
        ...res,
        budget: `${res.budget}元`,
        category: projectType, // 使用安全解析的项目类型
      };
    } else {
      // 处理异常情况（currentTab 不是预期值）
      throw new Error('参数错误：currentTab值不合法');
    }

    console.log('详情数据:', res, formattedData);
    tender.value = formattedData; // 将结果赋值给tender
  } catch (err) {
    console.error('加载详情失败:', err);
    alert(`加载详情失败：${err.message || '请稍后重试'}`);
  }
});
</script>

<style scoped>
.back-btn {
  @apply inline-block px-4 py-2 bg-primary text-white rounded-lg;
}

.detail-item {
  @apply mb-3 text-gray-700 flex items-start gap-2;
  /* 保持图标与文本顶部对齐 */
}

/* 关键：限制文本宽度，超出部分省略 */
.detail-item span {
  @apply max-w-[90%];
}

.url-link {
  @apply text-primary underline hover:text-secondary;
}
</style>