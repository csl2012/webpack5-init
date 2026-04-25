<template>
  <div class="page">
    <h1>{{ msg }}</h1>
  </div>
</template>

<script setup lang="ts">
const msg = '这是关于页面';
</script>

<style scoped lang="scss">
.page {
  padding: 20px;
  font-size: 18px;
}
</style>
