<script lang="ts" setup>
import { onMounted, ref, computed, watch, nextTick, onBeforeUnmount } from "vue";
import { useToast } from "vue-toastification";
import axios from "axios";
import { useRoute, RouterLink } from "vue-router";
import type Topic from "@/interfaces/Topic";
import type Post from "@/interfaces/Post";
import { useAuth } from "@/composables/useAuth";
import "primeicons/primeicons.css";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import Breadcrumbs from "./Breadcrumbs.vue";
import { useSubtopicSocket } from "@/composables/socket/subtopicSocket";
const toast = useToast();
const route = useRoute();
const { username, userId, loadUsername } = useAuth();

const currentTopic = ref<Topic>({} as Topic);
const subTopics = ref<Topic[]>([]);
const posts = ref<Post[]>([]);
let subtopicHandlers: ReturnType<typeof useSubtopicSocket> | null = null;

interface BreadcrumbItem {
  label: string;
  to?: string;
}

const isModerator = computed(() => {
  if (!currentTopic.value || !username.value) return false;

  const isMainMod = currentTopic.value.mainModerator?.username === username.value;
  const isPromotedMod = currentTopic.value.moderators?.some((mod) => mod.username === username.value);

  return isMainMod || isPromotedMod;
});

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [{ label: "Home", to: "/home" }];

  if (currentTopic.value.title) {
    items.push({
      label: currentTopic.value.title,
    });
  }

  return items;
});
const isLiked = (post: Post) => {
  return post.likes.includes(userId.value || "");
};

const handleLikePost = async (post: Post) => {
  if (!userId.value) return;

  const currentlyLiked = isLiked(post);

  if (currentlyLiked) {
    const index = post.likes.indexOf(userId.value);
    if (index > -1) post.likes.splice(index, 1);
  } else {
    post.likes.push(userId.value);
  }

  try {
    if (currentlyLiked) {
      await axios.delete(`/api/posts/${post._id}/like`);
    } else {
      await axios.post(`/api/posts/${post._id}/like`);
    }
  } catch (error) {
    console.error(error);
    toast.error("Failed to update like");
  }
};

const deleteTopic = async (topicId: string) => {};

const highlightCode = () => {
  nextTick(() => {
    document.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
  });
};

const fetchTopicData = async () => {
  try {
    const topicId = route.params.id;

    const topicResponse = await axios.get(`/api/topics/${topicId}`);
    currentTopic.value = topicResponse.data;

    const subtopicsResponse = await axios.get(`/api/topics/${topicId}/subtopics`);
    subTopics.value = subtopicsResponse.data;

    const postsResponse = await axios.get(`/api/topics/${topicId}/posts`);
    posts.value = postsResponse.data.posts;

    highlightCode();
  } catch (error) {
    toast.error("Failed to load topic data.");
  }
};

onMounted(async () => {
  await loadUsername();
  await fetchTopicData();
  subtopicHandlers = useSubtopicSocket(currentTopic.value._id);
  subtopicHandlers.subscribeToSubtopic();
  subtopicHandlers.onNewSubtopic(async (data: { newSubtopic: Topic }) => {
    subTopics.value.unshift(data.newSubtopic);
  });
  subtopicHandlers.onNewPost(async (data: { newPost: Post }) => {
    posts.value.unshift(data.newPost);
    highlightCode();
  });
  subtopicHandlers.onPostLiked((data: { postId: string; likes: string[] }) => {
    const post = posts.value.find((p) => p._id === data.postId);
    if (post) {
      post.likes = data.likes;
    }
  });
  subtopicHandlers.onPostUnliked((data: { postId: string; likes: string[] }) => {
    const post = posts.value.find((p) => p._id === data.postId);
    if (post) {
      post.likes = data.likes;
    }
  });
});
onBeforeUnmount(() => {
  if (subtopicHandlers) {
    subtopicHandlers.unsubscribeFromSubtopic();
    subtopicHandlers.offNewSubtopic();
    subtopicHandlers.offNewPost();
    subtopicHandlers.offPostLiked();
    subtopicHandlers.offPostUnliked();
  }
});
watch(
  () => route.params.id,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      await fetchTopicData();
    }
  }
);

watch(
  posts,
  () => {
    highlightCode();
  },
  { deep: true }
);
</script>

<template>
  <div class="topic-view">
    <Breadcrumbs :breadcrumbs="breadcrumbs" />
    <section class="topic-header">
      <h1 class="topic-title">{{ currentTopic.title }}</h1>
      <p class="topic-description">{{ currentTopic.description }}</p>
      <div class="topic-meta">
        <span class="moderator">{{ currentTopic.mainModerator?.username }}</span>
      </div>
    </section>

    <section class="subtopics-section">
      <div class="section-header">
        <h2>Podtematy</h2>
        <RouterLink v-if="isModerator" :to="`/topic/${currentTopic._id}/create-subtopic`" class="add-button" title="Dodaj podtemat">
          <i class="pi pi-plus"></i>
          <span>Dodaj podtemat</span>
        </RouterLink>
      </div>

      <div v-if="subTopics.length === 0" class="empty-state">
        <p>Brak podtematów</p>
      </div>
      <ul v-else class="subtopic-list">
        <li v-for="subtopic in subTopics" :key="subtopic._id" class="subtopic-item">
          <RouterLink :to="`/topic/${subtopic._id}`" class="subtopic-link">
            <i v-if="username === subtopic.mainModerator.username" class="pi pi-trash delete-icon" @click.prevent="deleteTopic(subtopic._id)"></i>
            <div class="subtopic-header">
              <h2 class="subtopic-title">{{ subtopic.title }}</h2>
            </div>
            <p class="subtopic-description">{{ subtopic.description }}</p>
            <div class="subtopic-meta">
              <a class="moderator">{{ subtopic.mainModerator.username }}</a>
            </div>
          </RouterLink>
        </li>
      </ul>
    </section>

    <section class="posts-section">
      <div class="section-header">
        <h2>Posty</h2>
        <RouterLink :to="`/topic/${currentTopic._id}/create-post`" class="add-button" title="Dodaj post">
          <i class="pi pi-plus"></i>
          <span>Dodaj post</span>
        </RouterLink>
      </div>

      <div v-if="posts.length === 0" class="empty-state">
        <p>Brak postów. Bądź pierwszy!</p>
      </div>
      <ul v-else class="posts-list">
        <li v-for="post in posts" :key="post._id" class="post-item">
          <div class="post-header">
            <span class="post-author">@{{ post.author.username }}</span>
            <span class="post-date">{{ new Date(post.createdAt).toLocaleDateString() }}</span>
          </div>
          <div class="post-content">{{ post.content }}</div>
          <pre v-if="post.code" class="post-code"><code>{{ post.code }}</code></pre>
          <div class="post-footer">
            <button @click.prevent="handleLikePost(post)" class="like-button">
              <i :class="isLiked(post) ? 'pi pi-heart-fill' : 'pi pi-heart'"></i>
              {{ post.likes.length }}
            </button>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped lang="scss">
.topic-view {
  max-width: 800px;
  margin: 0 auto;
  padding: $padding-lg;
}

.topic-header {
  margin-bottom: $margin-lg * 2;
  padding-bottom: $padding-lg;
  border-bottom: 2px solid $border-dark;

  .topic-title {
    font-size: $font-size-lg * 1.5;
    color: $text-white;
    margin: 0 0 $margin-md 0;
  }

  .topic-description {
    color: $text-light;
    font-size: $font-size-base * 1.1;
    margin: 0 0 $margin-md 0;
    line-height: 1.6;
  }

  .topic-meta {
    .moderator {
      color: $primary-lighter;
      font-weight: 600;
    }
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $margin-lg;

  h2 {
    font-size: $font-size-lg;
    color: $text-white;
    margin: 0;
  }
}

.add-button {
  display: flex;
  align-items: center;
  gap: $margin-sm;
  padding: $padding-sm $padding-md;
  background: $primary-color;
  color: $text-white;
  border-radius: $border-radius;
  text-decoration: none;
  font-weight: 600;
  transition: background 0.2s;

  &:hover {
    background: $primary-lighter;
  }

  i {
    font-size: $font-size-base * 1.2;
  }
}
.subtopics-section {
  margin-bottom: 2rem;
}
.subtopic-container {
  width: 100%;
}

.empty-state {
  text-align: center;
  padding: $padding-lg * 1.5;
  color: $text-light;
  font-size: $font-size-base * 1.1;
}

.subtopic-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.subtopic-item {
  background: $background-lighter;
  border-bottom: 1px solid $border-dark;
  transition: background-color 0.2s;
  position: relative;

  &:hover {
    background-color: lighten($background-lighter, 2%);
  }
}

.subtopic-link {
  display: block;
  padding: $padding-md $padding-md * 1.5;
  text-decoration: none;
  color: $text-white;
}

.subtopic-header {
  margin-bottom: $margin-sm;
}

.subtopic-title {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-base * 1.3;
  font-weight: 600;
  color: $text-white;
  margin: 0;
  line-height: 1.3;
}

.subtopic-description {
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-light;
  margin: $margin-sm 0;
  line-height: 1.5;
  font-size: $font-size-base;
}

.subtopic-meta {
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

.posts-section {
  margin-bottom: $margin-lg;
}

.empty-state {
  text-align: center;
  padding: $padding-lg * 2;
  color: $text-light;
  font-style: italic;
}

.posts-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: $margin-lg;
}

.post-item {
  background: $background-lighter;
  padding: $padding-md * 1.5;
  border-radius: $border-radius-lg;
  border-left: 3px solid $primary-color;

  .post-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $margin-md;

    .post-author {
      color: $primary-lighter;
      font-weight: 600;
    }

    .post-date {
      color: $text-light;
      font-size: $font-size-base * 0.85;
    }
  }

  .post-content {
    color: $text-white;
    line-height: 1.6;
    margin-bottom: $margin-md;
  }

  .post-code {
    background: $background-dark;
    padding: $padding-md;
    border-radius: $border-radius;
    overflow-x: auto;
    margin-bottom: $margin-md;

    code {
      color: $secondary-color;
      font-family: "Courier New", monospace;
      font-size: $font-size-base * 0.9;
    }
  }

  .post-footer {
    display: flex;
    justify-content: flex-end;
    gap: $margin-md;

    .like-button {
      background: transparent;
      border: 1px solid $border-dark;
      color: $text-light;
      padding: $padding-sm $padding-md;

      border-radius: $border-radius;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: lighten($background-lighter, 5%);
        border-color: $primary-color;
      }
    }
  }
}
</style>
