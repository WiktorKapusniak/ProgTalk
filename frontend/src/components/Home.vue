<script lang="ts" setup>
import { onMounted, reactive, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import axios from "axios";
import type Topic from "@/interfaces/Topic";
import Pagination from "./Pagination.vue";
import type PaginationProps from "@/interfaces/Pagination";

const toast = useToast();
const router = useRouter();

const topics = ref<Topic[]>([]);
const pagination = reactive<PaginationProps>({
  page: parseInt(localStorage.getItem("currentPage")!) || 1,
  limit: parseInt(localStorage.getItem("topicsPerPage")!) || 10,
  total: 0,
  totalPages: 0,
});
onMounted(async () => {
  try {
    const response = await axios.get("/api/topics", {
      params: {
        page: localStorage.getItem("currentPage") || 1,
        limit: localStorage.getItem("topicsPerPage") || 10,
        parentId: null,
      },
    });
    topics.value = response.data.topics;
    pagination.page = response.data.page;
    pagination.limit = response.data.limit;
    pagination.total = response.data.total;
    pagination.totalPages = response.data.totalPages;
    localStorage.setItem("currentPage", pagination.page.toString());
    localStorage.setItem("topicsPerPage", pagination.limit.toString());
  } catch (error) {
    toast.error("Failed to load topics.");
  }
});
</script>
<template>
  <div class="breadcrumbs"></div>
  <section class="topic-section">
    <div class="topic-container">
      <div v-if="topics.length === 0" class="empty-state">
        <p>Brak dostępnych tematów</p>
      </div>
      <ul v-else class="topic-list">
        <li v-for="topic in topics" :key="topic._id" class="topic-item">
          <RouterLink :to="`/topic/${topic._id}`" class="topic-link">
            <div class="topic-header">
              <h2 class="topic-title">{{ topic.title }}</h2>
            </div>
            <p class="topic-description">{{ topic.description }}</p>
            <div class="topic-meta">
              <a class="moderator">{{ topic.mainModerator.username }}</a>
            </div>
          </RouterLink>
        </li>
      </ul>
      <Pagination
        :page="pagination.page"
        :limit="pagination.limit"
        :total="pagination.total"
        :totalPages="pagination.totalPages"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
.breadcrumbs {
  padding: $padding-md;
  background: $background-lighter;
}

.topic-section {
  padding: $padding-lg;
  max-width: 700px;
  margin: 0 auto;
}

.topic-container {
  width: 100%;
}

.empty-state {
  text-align: center;
  padding: $padding-lg * 1.5;
  color: $text-light;
  font-size: $font-size-base * 1.1;
}

.topic-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.topic-item {
  background: $background-lighter;
  border-bottom: 1px solid $border-dark;
  transition: background-color 0.2s;

  &:hover {
    background-color: lighten($background-lighter, 2%);
  }
}

.topic-link {
  display: block;
  padding: $padding-md $padding-md * 1.5;
  text-decoration: none;
  color: $text-white;
}

.topic-header {
  margin-bottom: $margin-sm;
}

.topic-title {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-base * 1.3;
  font-weight: 600;
  color: $text-white;
  margin: 0;
  line-height: 1.3;
}

.topic-description {
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-light;
  margin: $margin-sm 0;
  line-height: 1.5;
  font-size: $font-size-base;
}

.topic-meta {
  display: flex;
  align-items: center;
  gap: $margin-md;
  margin-top: $margin-sm;
  font-size: $font-size-base;
  color: $text-lighter;
}

.moderator {
  color: $primary-lighter;
  font-weight: 600;
  font-size: $font-size-base * 0.9;
}
</style>
