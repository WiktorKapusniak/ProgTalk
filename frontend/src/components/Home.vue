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
import { useTopicSocket } from "@/composables/socket/topicSocket";
import { onBeforeUnmount } from "vue";

const toast = useToast();
const { isAdmin, loadUsername, username } = useAuth();
const { subscribeToTopics, unsubscribeFromTopics, onNewTopic, offNewTopic } = useTopicSocket();
const hoveredTopicId = ref<string | null>(null);

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

const hideTopic = async (topicId: string) => {
  if (!confirm("Czy na pewno chcesz schować ten temat?")) {
    return;
  }
  try {
    await axios.post(`/api/topics/${topicId}/hide`);
    toast.success("Temat został schowany");
    await handlePageChange(pagination.page);
  } catch (error) {
    toast.error("Nie udało się schować tematu");
  }
};
const unhideTopic = async (topicId: string) => {
  if (!confirm("Czy na pewno chcesz odkryć ten temat?")) {
    return;
  }
  try {
    await axios.post(`/api/topics/${topicId}/unhide`);
    toast.success("Temat został odkryty");
    await handlePageChange(pagination.page);
  } catch (error) {
    toast.error("Nie udało się odkryć tematu");
  }
};
const closeTopic = async (topicId: string) => {
  if (!confirm("Czy na pewno chcesz zamknąć ten temat?")) {
    return;
  }
  try {
    await axios.post(`/api/topics/${topicId}/close`);
    toast.success("Temat został zamknięty");
    await handlePageChange(pagination.page);
  } catch (error) {
    toast.error("Nie udało się zamknąć tematu");
  }
};
const openTopic = async (topicId: string) => {
  if (!confirm("Czy na pewno chcesz otworzyć ten temat?")) {
    return;
  }
  try {
    await axios.post(`/api/topics/${topicId}/open`);
    toast.success("Temat został otwarty");
    await handlePageChange(pagination.page);
  } catch (error) {
    toast.error("Nie udało się otworzyć tematu");
  }
};
const ban = async (banUsername: string) => {
  if (!confirm(`Czy na pewno chcesz zbanować użytkownika ${banUsername}?`)) return;

  try {
    await axios.post(`/api/admin/ban/${banUsername}`);
    toast.success(`Użytkownik ${banUsername} został zbanowany.`);
  } catch (error: any) {
    toast.error(`Nie udało się zbanować użytkownika. ${error?.response?.data?.message || ""}`);
  }
};

const HandleNewTopic = (data: { newTopic: Topic }) => {
  topics.value.unshift(data.newTopic);
  pagination.total += 1;
  pagination.totalPages = Math.ceil(pagination.total / pagination.limit);
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
    subscribeToTopics();
    onNewTopic(HandleNewTopic);
  } catch (error) {
    toast.error("Failed to load topics.");
  }
});
onBeforeUnmount(() => {
  unsubscribeFromTopics();
  offNewTopic(HandleNewTopic);
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
        <li v-for="topic in topics" :key="topic._id" class="topic-item" @mouseleave="hoveredTopicId = null">
          <RouterLink :to="`/topic/${topic._id}`" class="topic-link">
            <div v-if="topic.isClosed">
              <i
                v-if="isAdmin"
                class="pi pi-lock locked-lock-icon"
                title="Temat jest zamknięty"
                @click.prevent="openTopic(topic._id)"
              ></i>
            </div>
            <div v-else>
              <i
                v-if="isAdmin"
                class="pi pi-lock-open lock-icon"
                title="Temat jest otwarty"
                @click.prevent="closeTopic(topic._id)"
              ></i>
            </div>
            <div v-if="topic.isClosed && !isAdmin">
              <i class="pi pi-lock user-lock-icon" title="Temat jest zamknięty"></i>
            </div>
            <div v-if="!topic.isHidden">
              <i v-if="isAdmin" class="pi pi-eye hide-icon" @click.prevent="hideTopic(topic._id)"></i>
            </div>
            <div v-else>
              <i
                class="pi pi-eye-slash hidden-hide-icon"
                title="Temat jest ukryty"
                @click.prevent="unhideTopic(topic._id)"
              ></i>
            </div>
            <div class="topic-header">
              <h2 class="topic-title">{{ topic.title }}</h2>
            </div>
            <p class="topic-description">{{ topic.description }}</p>
            <div class="topic-meta">
              <span class="moderator moderator-wrapper" @mouseenter="hoveredTopicId = topic._id">
                {{ topic.mainModerator.username }}

                <div
                  v-if="isAdmin && hoveredTopicId === topic._id && topic.mainModerator.username !== username"
                  class="moderator-actions-box"
                >
                  <button class="moderator-action-btn" @click.prevent="ban(topic.mainModerator.username)">
                    Zbanuj
                  </button>
                </div>
              </span>
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
  transition:
    background-color 0.2s,
    transform 0.2s;

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

.hide-icon {
  position: absolute;
  top: $padding-sm;
  right: $padding-md;
  // color: #e74c3c;
  cursor: pointer;
  font-size: 1.3rem;
  transition: color 0.2s;

  &:hover {
    color: #c0392b;
  }
}
.hidden-hide-icon {
  position: absolute;
  top: $padding-sm;
  right: $padding-md;
  cursor: pointer;
  font-size: 1.3rem;
  color: rgb(190, 0, 0);
  &:hover {
    color: #2980b9;
  }
}
.lock-icon {
  position: absolute;
  top: $padding-sm;
  right: $padding-md * 3.5;
  cursor: pointer;
  font-size: 1.3rem;
  transition: color 0.2s;

  &:hover {
    color: #2980b9;
  }
}
.locked-lock-icon {
  position: absolute;
  top: $padding-sm;
  right: $padding-md * 3.5;
  font-size: 1.3rem;
  color: rgb(190, 0, 0);
  &:hover {
    color: #2980b9;
  }
}
.user-lock-icon {
  position: absolute;
  top: $padding-sm;
  right: $padding-md * 3.5;
  font-size: 1.3rem;
  color: rgb(190, 0, 0);
}
.moderator-wrapper {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.moderator-actions-box {
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-right: 10px;

  background: $background-dark;
  border: 1px solid $border-dark;
  border-radius: $border-radius;
  padding: 6px 10px;
  box-shadow: $box-shadow;
  z-index: 20;
}

.moderator-action-btn {
  background: transparent;
  border: none;
  color: #e74c3c;
  font-weight: 600;
  font-size: $font-size-base * 0.9;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    color: lighten(#e74c3c, 10%);
  }
}
</style>
