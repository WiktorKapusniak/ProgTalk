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
    <div class="buttons-and-limit">
      <div class="page-buttons">
        <button @click="goToPage(page - 1)" :disabled="page === 1"><</button>
        <button @click="goToPage(1)">1</button>
        <button @click="goToPage(page + 1)" :disabled="page >= totalPages">></button>
      </div>
      <div class="limit-selector">
        <label for="limit">Items per page:</label>
        <select id="limit" @change="changeLimit" :value="limit">
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </div>
    </div>

    <div class="pagination-info">
      <span>Results {{ (page - 1) * limit + 1 }} - {{ Math.min(page * limit, total) }} of {{ total }}</span>
    </div>
  </div>
</template>
<style scoped lang="scss">
.pagination {
  display: flex;
  flex-direction: column;
  gap: $margin-sm;
  padding: $padding-sm $padding-md;
  margin: $margin-md auto 0;
  margin-top: 3rem;
  max-width: 400px;
  border-radius: $border-radius;
}

.buttons-and-limit {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $margin-sm;
  flex-wrap: wrap;
}

.page-buttons {
  display: flex;
  gap: $margin-sm * 0.5;
  align-items: center;

  button {
    padding: $padding-sm * 0.6 $padding-sm * 1.2;
    border: 1px solid $border-dark;
    background-color: $primary-color;
    color: $text-white;
    border-radius: $border-radius;
    cursor: pointer;
    font-size: $font-size-base * 0.9;
    min-width: 32px;
    transition: background-color 0.2s;

    &:hover:not(:disabled) {
      background-color: $primary-lighter;
    }

    &:disabled {
      background-color: $background-lighter;
      color: $text-light;
      cursor: not-allowed;
      border-color: $border-dark;
    }
  }
}

.limit-selector {
  display: flex;
  align-items: center;
  gap: $margin-sm * 0.5;

  label {
    color: $text-lighter;
    font-size: $font-size-base * 0.85;
  }

  select {
    padding: $padding-sm * 0.5 $padding-sm * 0.8;
    border: 1px solid $border-dark;
    background-color: $background-dark;
    color: $text-white;
    border-radius: $border-radius;
    cursor: pointer;
    font-size: $font-size-base * 0.85;

    &:hover {
      background-color: lighten($background-dark, 5%);
    }

    option {
      background-color: $background-dark;
      color: $text-white;
    }
  }
}

.pagination-info {
  text-align: center;
  color: $text-light;
  font-size: $font-size-base * 0.8;
}
</style>
