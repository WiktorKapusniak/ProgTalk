<script lang="ts" setup>
const props = defineProps<{
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}>();
const emit = defineEmits<{
  (e: "page-changed", page: number): void;
  (e: "limit-changed", limit: number): void;
}>();
const goToPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages) {
    emit("page-changed", page);
  }
};
const changeLimit = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const newLimit = parseInt(target.value);
  emit("limit-changed", newLimit);
};
</script>
<template>
  <div class="pagination">
    <div class="page-buttons">
      <button @click="goToPage(page - 1)" :disabled="page === 1"><</button>
      <button @click="goToPage(1)">1</button>
      <button @click="goToPage(page + 1)" :disabled="page >= totalPages">></button>
    </div>
    <div class="pagination-info">
      <span>Results {{ page }} - {{ page + limit - 1 }} of {{ total }}</span>
    </div>
  </div>
</template>
<style scoped lang="scss"></style>
