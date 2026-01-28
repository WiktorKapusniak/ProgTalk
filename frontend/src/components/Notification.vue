<template>
  <transition name="fade">
    <div v-if="visible" class="notification">
      {{ message }}
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{ message: string; duration?: number }>();
const visible = ref(true);

watch(
  () => props.message,
  () => {
    visible.value = true;
    if (props.duration !== 0) {
      setTimeout(() => (visible.value = false), props.duration || 4000);
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.notification {
  position: fixed;
  right: 24px;
  bottom: 24px;
  background: #323232;
  color: #fff;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  font-size: 1rem;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
