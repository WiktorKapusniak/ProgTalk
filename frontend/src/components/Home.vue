<script lang="ts" setup>
import "primeicons/primeicons.css";
import { onMounted, reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import { useToast } from "vue-toastification";
import axios from "axios";
import type Topic from "@/interfaces/Topic";
import Pagination from "./Pagination.vue";
import type PaginationProps from "@/interfaces/Pagination";
import { useAuth } from "@/composables/useAuth";

const toast = useToast();
const { username, loadUsername } = useAuth();

const topics = ref<Topic[]>([]);
const pagination = reactive<PaginationProps>({
  page: parseInt(localStorage.getItem("currentPage")!) || 1,
  limit: parseInt(localStorage.getItem("topicsPerPage")!) || 10,
  total: 0,
  totalPages: 0,
});
const handlePageChange = async (newPage: number) => {
  try {
    const response = await axios.get("/api/topics", {
      params: {
        page: newPage,
        limit: pagination.limit,
        parentId: null,
      },
    });
    topics.value = response.data.topics;
    pagination.page = response.data.pagination.page;
    pagination.limit = response.data.pagination.limit;
    pagination.total = response.data.pagination.total;
    pagination.totalPages = response.data.pagination.totalPages;
    localStorage.setItem("currentPage", pagination.page.toString());
  } catch (error) {
    toast.error("Failed to load topics.");
  }
};
const handleLimitChange = async (newLimit: number) => {
  try {
    const response = await axios.get("/api/topics", {
      params: {
        page: 1,
        limit: newLimit,
        parentId: null,
      },
    });
    topics.value = response.data.topics;
    pagination.page = response.data.pagination.page;
    pagination.limit = response.data.pagination.limit;
    pagination.total = response.data.pagination.total;
    pagination.totalPages = response.data.pagination.totalPages;
    localStorage.setItem("currentPage", pagination.page.toString());
    localStorage.setItem("topicsPerPage", pagination.limit.toString());
  } catch (error) {
    toast.error("Failed to load topics.");
  }
};

const deleteTopic = async (topicId: string) => {
  if (!confirm("Czy na pewno chcesz usunąć ten temat?")) {
    return;
  }

  try {
    await axios.delete(`/api/topics/${topicId}`);
    toast.success("Temat został usunięty");
    await handlePageChange(pagination.page);
  } catch (error) {
    toast.error("Nie udało się usunąć tematu");
  }
};

onMounted(async () => {
  try {
    await loadUsername();
    const response = await axios.get("/api/topics", {
      params: {
        page: localStorage.getItem("currentPage") || 1,
        limit: localStorage.getItem("topicsPerPage") || 10,
        parentId: null,
      },
    });
    topics.value = response.data.topics;
    pagination.page = response.data.pagination.page;
    pagination.limit = response.data.pagination.limit;
    pagination.total = response.data.pagination.total;
    pagination.totalPages = response.data.pagination.totalPages;
    localStorage.setItem("currentPage", pagination.page.toString());
    localStorage.setItem("topicsPerPage", pagination.limit.toString());
  } catch (error) {
    toast.error("Failed to load topics.");
  }
});
</script>
<template>
  <div class="add-topic-section">
    <RouterLink to="/create-topic" class="add-topic-button">
      <i class="pi pi-plus"></i>
    </RouterLink>
  </div>
  <section class="topic-section">
    <div class="topic-container">
      <div v-if="topics.length === 0" class="empty-state">
        <p>Brak dostępnych tematów</p>
      </div>
      <ul v-else class="topic-list">
        <li v-for="topic in topics" :key="topic._id" class="topic-item">
          <RouterLink :to="`/topic/${topic._id}`" class="topic-link">
            <i
              v-if="username === topic.mainModerator.username"
              class="pi pi-trash delete-icon"
              @click.prevent="deleteTopic(topic._id)"
            ></i>
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
        @page-changed="handlePageChange"
        @limit-changed="handleLimitChange"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
.add-topic-section {
  display: flex;
  justify-content: center;
  margin-top: $margin-md;
}
.add-topic-button {
  background-color: $primary-color;
  color: $text-white;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  text-decoration: none;
  box-shadow: $box-shadow;
  transition: background-color 0.2s, transform 0.2s;

  &:hover {
    background-color: darken($primary-color, 5%);
    transform: scale(1.1);
  }
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
  position: relative;

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

.delete-icon {
  position: absolute;
  top: $padding-sm;
  right: $padding-md;
  color: #e74c3c;
  cursor: pointer;
  font-size: 1.3rem;
  transition: color 0.2s;

  &:hover {
    color: #c0392b;
  }
}
</style>
