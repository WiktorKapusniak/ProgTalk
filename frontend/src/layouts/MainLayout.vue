<script setup lang="ts">
import Navbar from "@/components/Navbar.vue";
</script>

<template>
  <div class="main-layout">
    <Navbar />
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<style scoped lang="scss">
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
}
</style>
