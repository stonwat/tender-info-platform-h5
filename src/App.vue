<!-- src/App.vue -->
<template>
  <div id="app">
    <router-view /> <!-- 路由出口，显示页面内容 -->
  </div>
</template>

<script setup>
// 无额外逻辑（路由在 main.js 中配置）
</script>

<style>
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>