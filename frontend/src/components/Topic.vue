<script lang="ts" setup>
import { onMounted, ref, computed, watch, nextTick, onBeforeUnmount, reactive } from "vue";
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
import Pagination from "./Pagination.vue";
import type PaginationProps from "@/interfaces/Pagination";
const toast = useToast();
const route = useRoute();
const { username, userId, isAdmin, loadUsername } = useAuth();

const currentTopic = ref<Topic>({} as Topic);
const subTopics = ref<Topic[]>([]);
const mainPosts = ref<Post[]>([]);
const repliesMap = ref<Record<string, Post[]>>({});
const hoveredPostId = ref<string | null>(null);
const banHoveredTopicId = ref<string | null>(null);
const banHoveredPostId = ref<string | null>(null);
const blockedUsers = ref<{ _id: string; username: string; blockedAt: string }[]>([]);

let subtopicHandlers: ReturnType<typeof useSubtopicSocket> | null = null;

interface BreadcrumbItem {
  label: string;
  to?: string;
}

const pagination = reactive<PaginationProps>({
  page: 1,
  limit: parseInt(localStorage.getItem("topicsPerPage")!) || 10,
  total: 0,
  totalPages: 0,
});
const handlePageChange = async (newPage: number) => {
  await fetchMainPosts(newPage, pagination.limit);
};
const handleLimitChange = async (newLimit: number) => {
  await fetchMainPosts(1, newLimit);
  localStorage.setItem("topicsPerPage", newLimit.toString());
};
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
const addModerator = async (modUsername: string) => {
  try {
    await axios.post(`/api/topics/${currentTopic.value._id}/moderators`, {
      username: modUsername,
    });
    toast.success(`Użytkownik ${modUsername} został mianowany moderatorem.`);
  } catch (error) {
    toast.error(`Nie udało się mianować moderatora. ${(error as any).response?.data?.message || ""}`);
  }
};
const deleteModerator = async (modUsername: string) => {
  try {
    await axios.delete(`/api/topics/${currentTopic.value._id}/moderators/${modUsername}`);
    toast.success(`Użytkownik ${modUsername} przestał być moderatorem.`);
  } catch (error) {
    toast.error(`Nie udało się usunąć moderatora. ${(error as any).response?.data?.message || ""}`);
  }
};
const BlockFromTopicAndAllSubtopics = async (blockedUsername: string) => {
  try {
    await axios.post(`/api/topics/${currentTopic.value._id}/block-user`, {
      username: blockedUsername,
    });
    fetchBlockedUsers();
    toast.success(`Użytkownik ${blockedUsername} został zablokowany w tym temacie i wszystkich podtematach.`);
  } catch (error) {
    toast.error(`Nie udało się zablokować użytkownika. ${(error as any).response?.data?.message || ""}`);
  }
};
const UnblockFromTopicAndAllSubtopics = async (unblockedUsername: string) => {
  try {
    await axios.post(`/api/topics/${currentTopic.value._id}/unblock-user`, {
      username: unblockedUsername,
    });
    fetchBlockedUsers();
    toast.success(`Użytkownik ${unblockedUsername} został odblokowany w tym temacie i wszystkich podtematach.`);
  } catch (error) {
    toast.error(`Nie udało się odblokować użytkownika. ${(error as any).response?.data?.message || ""}`);
  }
};
const hideTopic = async (topicId: string) => {
  if (!confirm("Czy na pewno chcesz schować ten temat?")) {
    return;
  }

  const topic = subTopics.value.find((t) => t._id === topicId);

  try {
    await axios.post(`/api/topics/${topicId}/hide`);

    if (topic) {
      topic.isHidden = true;
    }

    toast.success("Temat został schowany");
  } catch (error) {
    if (topic) {
      topic.isHidden = false;
    }
    toast.error("Nie udało się schować tematu");
  }
};
const unhideTopic = async (topicId: string) => {
  if (!confirm("Czy na pewno chcesz odkryć ten temat?")) {
    return;
  }

  const topic = subTopics.value.find((t) => t._id === topicId);

  try {
    await axios.post(`/api/topics/${topicId}/unhide`);

    if (topic) {
      topic.isHidden = false;
    }

    toast.success("Temat został odkryty");
  } catch (error) {
    if (topic) {
      topic.isHidden = true;
    }
    toast.error("Nie udało się odkryć tematu");
  }
};
const closeTopic = async (topicId: string) => {
  if (!confirm("Czy na pewno chcesz zamknąć ten temat?")) {
    return;
  }

  const topic = subTopics.value.find((t) => t._id === topicId);

  try {
    await axios.post(`/api/topics/${topicId}/close`);

    if (topic) {
      topic.isClosed = true;
    }

    toast.success("Temat został zamknięty");
  } catch (error) {
    if (topic) {
      topic.isClosed = false;
    }
    toast.error("Nie udało się zamknąć tematu");
  }
};
const openTopic = async (topicId: string) => {
  if (!confirm("Czy na pewno chcesz otworzyć ten temat?")) {
    return;
  }

  const topic = subTopics.value.find((t) => t._id === topicId);

  try {
    await axios.post(`/api/topics/${topicId}/open`);

    if (topic) {
      topic.isClosed = false;
    }

    toast.success("Temat został otwarty");
  } catch (error) {
    if (topic) {
      topic.isClosed = true;
    }
    toast.error("Nie udało się otworzyć tematu");
  }
};
const ban = async (banUsername: string) => {
  try {
    await axios.post(`/api/admin/ban/${banUsername}`);
    toast.success(`Użytkownik ${banUsername} został zbanowany.`);
  } catch (error) {
    toast.error(`Nie udało się zbanować użytkownika. ${(error as any).response?.data?.message || ""}`);
  }
};
const deletePost = async (postId: string) => {
  if (!confirm("Czy na pewno chcesz usunąć ten post?")) return;

  try {
    await axios.delete(`/api/posts/${postId}`);
    toast.success("Post został usunięty");
  } catch (err) {
    toast.error("Nie udało się usunąć posta");
  }
};

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
    await fetchMainPosts(pagination.page, pagination.limit);
    highlightCode();
  } catch (error) {
    toast.error("Failed to load topic data.");
  }
};
const fetchMainPosts = async (page = 1, limit = 10) => {
  try {
    const topicId = route.params.id;
    const mainRes = await axios.get(`/api/topics/${topicId}/posts`, {
      params: { page, limit },
    });
    mainPosts.value = mainRes.data.posts;
    pagination.page = mainRes.data.pagination.page;
    pagination.limit = mainRes.data.pagination.limit;
    pagination.total = mainRes.data.pagination.total;
    pagination.totalPages = mainRes.data.pagination.totalPages;

    if (mainPosts.value.length > 0) {
      const mainIds = mainPosts.value.map((p) => p._id);
      const repliesRes = await axios.get(`/api/posts/replies`, {
        params: { parentIds: mainIds.join(",") },
      });
      repliesMap.value = {};
      for (const reply of repliesRes.data.replies) {
        if (!repliesMap.value[reply.reference]) repliesMap.value[reply.reference] = [];
        repliesMap.value[reply.reference]!.push(reply);
      }
    } else {
      repliesMap.value = {};
    }
  } catch (error) {
    toast.error("Failed to load posts.");
  }
};
const fetchBlockedUsers = async () => {
  try {
    if (currentTopic.value.mainModerator?.username !== username.value) return;

    const res = await axios.get(`/api/topics/${currentTopic.value._id}/blocked-users`);
    blockedUsers.value = res.data;
  } catch (err) {
    console.error(err);
  }
};
onMounted(async () => {
  await loadUsername();
  await fetchTopicData();
  fetchBlockedUsers();

  await nextTick();
  if (route.hash) {
    const element = document.querySelector(route.hash);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  subtopicHandlers = useSubtopicSocket(currentTopic.value._id);
  subtopicHandlers.subscribeToSubtopic();

  subtopicHandlers.onNewSubtopic((data: { newSubtopic: Topic }) => {
    subTopics.value.unshift(data.newSubtopic);
  });

  subtopicHandlers.onNewPost((data: { newPost: Post }) => {
    const post = data.newPost;

    if (!post.reference) {
      if (pagination.page === 1) {
        mainPosts.value.unshift(post);

        if (mainPosts.value.length > pagination.limit) {
          mainPosts.value.pop();
        }
      }

      pagination.total += 1;
      pagination.totalPages = Math.ceil(pagination.total / pagination.limit);
    } else {
      if (!repliesMap.value[post.reference]) {
        repliesMap.value[post.reference] = [];
      }
      repliesMap.value[post.reference]!.push(post);
    }

    highlightCode();
  });

  subtopicHandlers.onPostLiked((data: { postId: string; likes: string[] }) => {
    const main = mainPosts.value.find((p) => p._id === data.postId);
    if (main) {
      main.likes = data.likes;
      return;
    }

    Object.values(repliesMap.value).forEach((replies) => {
      const reply = replies.find((r) => r._id === data.postId);
      if (reply) {
        reply.likes = data.likes;
      }
    });
  });

  subtopicHandlers.onPostUnliked((data: { postId: string; likes: string[] }) => {
    const main = mainPosts.value.find((p) => p._id === data.postId);
    if (main) {
      main.likes = data.likes;
      return;
    }

    Object.values(repliesMap.value).forEach((replies) => {
      const reply = replies.find((r) => r._id === data.postId);
      if (reply) {
        reply.likes = data.likes;
      }
    });
  });

  subtopicHandlers.onPostDeleted((data: { postId: string }) => {
    const { postId } = data;

    mainPosts.value = mainPosts.value.filter((p) => p._id !== postId);

    Object.keys(repliesMap.value).forEach((key) => {
      repliesMap.value[key] = repliesMap.value[key]!.filter((r) => r._id !== postId);
    });
  });
});

onBeforeUnmount(() => {
  if (subtopicHandlers) {
    subtopicHandlers.unsubscribeFromSubtopic();
    subtopicHandlers.offNewSubtopic();
    subtopicHandlers.offNewPost();
    subtopicHandlers.offPostLiked();
    subtopicHandlers.offPostUnliked();
    subtopicHandlers.offPostDeleted();
  }
});
watch(
  () => route.params.id,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      await fetchTopicData();
    }
  },
);
watch(
  [mainPosts, repliesMap],
  () => {
    highlightCode();
  },
  { deep: true },
);
</script>

<template>
  <div class="topic-layout">
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
          <RouterLink
            v-if="isModerator"
            :to="`/topic/${currentTopic._id}/create-subtopic`"
            class="add-button"
            title="Dodaj podtemat"
          >
            <i class="pi pi-plus"></i>
            <span>Dodaj podtemat</span>
          </RouterLink>
        </div>

        <div v-if="subTopics.length === 0" class="empty-state">
          <p>Brak podtematów</p>
        </div>
        <ul v-else class="subtopic-list">
          <li
            v-for="subtopic in subTopics"
            :key="subtopic._id"
            class="subtopic-item"
            @mouseleave="banHoveredTopicId = null"
          >
            <RouterLink
              v-if="userId && subtopic.mainModerator._id === userId"
              :to="`/edit-topic/${subtopic._id}`"
              class="edit-topic-btn"
              @click.stop
            >
              <i class="pi pi-pencil"></i>
            </RouterLink>
            <RouterLink :to="`/topic/${subtopic._id}`" class="subtopic-link">
              <div v-if="subtopic.isClosed">
                <i
                  v-if="isAdmin"
                  class="pi pi-lock locked-lock-icon"
                  title="Temat jest zamknięty"
                  @click.prevent="openTopic(subtopic._id)"
                ></i>
              </div>
              <div v-else>
                <i
                  v-if="isAdmin"
                  class="pi pi-lock-open lock-icon"
                  title="Temat jest otwarty"
                  @click.prevent="closeTopic(subtopic._id)"
                ></i>
              </div>
              <div v-if="subtopic.isClosed && !isAdmin">
                <i class="pi pi-lock user-lock-icon" title="Temat jest zamknięty"></i>
              </div>
              <div v-if="!subtopic.isHidden">
                <i v-if="isAdmin" class="pi pi-eye hide-icon" @click.prevent="hideTopic(subtopic._id)"></i>
              </div>
              <div v-else>
                <i
                  class="pi pi-eye-slash hidden-hide-icon"
                  title="Temat jest ukryty"
                  @click.prevent="unhideTopic(subtopic._id)"
                ></i>
              </div>
              <div class="subtopic-header">
                <h2 class="subtopic-title">{{ subtopic.title }}</h2>
              </div>
              <p class="subtopic-description">{{ subtopic.description }}</p>
              <div class="topic-meta">
                <span class="moderator moderator-wrapper" @mouseenter="banHoveredTopicId = subtopic._id">
                  {{ subtopic.mainModerator.username }}

                  <div
                    v-if="isAdmin && banHoveredTopicId === subtopic._id && subtopic.mainModerator.username !== username"
                    class="moderator-actions-box"
                  >
                    <button class="moderator-action-btn" @click.prevent="ban(subtopic.mainModerator.username)">
                      Zbanuj
                    </button>
                  </div>
                </span>
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

        <div v-if="mainPosts.length === 0" class="empty-state">
          <p>Brak postów. Bądź pierwszy!</p>
        </div>
        <ul v-else class="posts-list">
          <li v-for="post in mainPosts" :key="post._id">
            <div
              :id="`post-${post._id}`"
              class="post-item"
              @mouseleave="
                hoveredPostId = null;
                banHoveredPostId = null;
              "
            >
              <div class="post-header">
                <span
                  class="post-author moderator-wrapper"
                  @mouseenter="
                    hoveredPostId = post._id;
                    banHoveredPostId = post._id;
                  "
                >
                  @{{ post.author.username }}

                  <div
                    v-if="isAdmin && banHoveredPostId === post._id && post.author.username !== username"
                    class="moderator-actions-box"
                  >
                    <button class="moderator-action-btn" @click.prevent="ban(post.author.username)">Zbanuj</button>
                  </div>

                  <div
                    v-if="hoveredPostId === post._id && isModerator && post.author.username !== username"
                    class="nick-box"
                  >
                    <button @click="addModerator(post.author.username)" class="nick-box-button">
                      Mianuj moderatorem
                    </button>
                    <button @click="deleteModerator(post.author.username)" class="nick-box-button">
                      Zabierz moderatora
                    </button>
                    <button @click="BlockFromTopicAndAllSubtopics(post.author.username)" class="nick-box-button">
                      Zablokuj
                    </button>
                    <button @click="UnblockFromTopicAndAllSubtopics(post.author.username)" class="nick-box-button">
                      Odblokuj
                    </button>
                  </div>
                </span>
                <span class="post-date">
                  <RouterLink
                    v-if="post.author._id === userId"
                    :to="`/topic/${currentTopic._id}/edit-post/${post._id}`"
                    class="edit-post-btn"
                    title="Edytuj post"
                  >
                    <i class="pi pi-pencil"></i>
                  </RouterLink>
                  <button
                    v-if="post.author._id === userId || isAdmin"
                    class="delete-post-btn"
                    @click.prevent="deletePost(post._id)"
                  >
                    <i class="pi pi-trash"></i></button
                  >{{ new Date(post.createdAt).toLocaleDateString() }}</span
                >
              </div>
              <div class="post-content">{{ post.content }}</div>

              <pre v-if="post.code" class="post-code"><code>{{ post.code }}</code></pre>
              <div class="post-footer" v-if="post.tags && post.tags.length">
                <div v-if="post.tags && post.tags.length" class="post-tags">
                  <span v-for="tag in post.tags" :key="tag" class="post-tag">#{{ tag }}</span>
                </div>
                <div>
                  <button @click.prevent="handleLikePost(post)" class="like-button">
                    <i :class="isLiked(post) ? 'pi pi-heart-fill' : 'pi pi-heart'"></i>
                    {{ post.likes.length }}
                  </button>
                  <RouterLink
                    :to="`/topic/${currentTopic._id}/create-post/${post._id}`"
                    class="like-button"
                    title="Odpowiedz na post"
                  >
                    <i class="pi pi-reply"></i>
                  </RouterLink>
                </div>
              </div>
              <div v-else class="post-footer-empty-tags">
                <div>
                  <button @click.prevent="handleLikePost(post)" class="like-button">
                    <i :class="isLiked(post) ? 'pi pi-heart-fill' : 'pi pi-heart'"></i>
                    {{ post.likes.length }}
                  </button>
                  <RouterLink
                    :to="`/topic/${currentTopic._id}/create-post/${post._id}`"
                    class="like-button"
                    title="Odpowiedz na post"
                  >
                    <i class="pi pi-reply"></i>
                  </RouterLink>
                </div>
              </div>
            </div>
            <ul v-if="repliesMap[post._id] && repliesMap[post._id]!.length > 0" class="posts-list">
              <li
                v-for="reply in repliesMap[post._id]"
                :key="reply._id"
                :id="`post-${reply._id}`"
                class="post-item"
                @mouseleave="
                  hoveredPostId = null;
                  banHoveredPostId = null;
                "
              >
                <div class="post-header">
                  <span
                    class="post-author moderator-wrapper"
                    @mouseenter="
                      hoveredPostId = reply._id;
                      banHoveredPostId = reply._id;
                    "
                  >
                    @{{ reply.author.username }}

                    <div
                      v-if="isAdmin && banHoveredPostId === reply._id && reply.author.username !== username"
                      class="moderator-actions-box"
                    >
                      <button class="moderator-action-btn" @click.prevent="ban(reply.author.username)">Zbanuj</button>
                    </div>

                    <div
                      v-if="hoveredPostId === reply._id && isModerator && reply.author.username !== username"
                      class="nick-box"
                    >
                      <button @click="addModerator(reply.author.username)" class="nick-box-button">
                        Mianuj moderatorem
                      </button>
                      <button @click="deleteModerator(reply.author.username)" class="nick-box-button">
                        Zabierz moderatora
                      </button>
                      <button @click="BlockFromTopicAndAllSubtopics(reply.author.username)" class="nick-box-button">
                        Zablokuj
                      </button>
                      <button @click="UnblockFromTopicAndAllSubtopics(reply.author.username)" class="nick-box-button">
                        Odblokuj
                      </button>
                    </div>
                  </span>

                  <span class="post-date">
                    <RouterLink
                      v-if="reply.author._id === userId"
                      :to="`/topic/${currentTopic._id}/edit-post/${reply._id}`"
                      class="edit-post-btn"
                      title="Edytuj post"
                    >
                      <i class="pi pi-pencil"></i>
                    </RouterLink>
                    <button
                      v-if="reply.author._id === userId || isAdmin"
                      class="delete-post-btn"
                      @click.prevent="deletePost(reply._id)"
                    >
                      <i class="pi pi-trash"></i></button
                    >{{ new Date(reply.createdAt).toLocaleDateString() }}</span
                  >
                </div>
                <div class="post-content">{{ reply.content }}</div>

                <pre v-if="reply.code" class="post-code"><code>{{ reply.code }}</code></pre>

                <div v-if="reply.tags && reply.tags.length" class="post-footer">
                  <div v-if="reply.tags && reply.tags.length" class="post-tags">
                    <span v-for="tag in reply.tags" :key="tag" class="post-tag">#{{ tag }}</span>
                  </div>
                  <div>
                    <button @click.prevent="handleLikePost(reply)" class="like-button">
                      <i :class="isLiked(reply) ? 'pi pi-heart-fill' : 'pi pi-heart'"></i>
                      {{ reply.likes.length }}
                    </button>
                  </div>
                </div>
                <div v-else class="post-footer-empty-tags">
                  <div>
                    <button @click.prevent="handleLikePost(reply)" class="like-button">
                      <i :class="isLiked(post) ? 'pi pi-heart-fill' : 'pi pi-heart'"></i>
                      {{ reply.likes.length }}
                    </button>
                  </div>
                </div>
              </li>
            </ul>
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
      </section>
      <aside v-if="currentTopic.mainModerator?.username === username" class="blocked-users-panel">
        <h3>Zablokowani użytkownicy</h3>

        <p v-if="blockedUsers.length === 0" class="empty">Brak zablokowanych użytkowników</p>

        <ul v-else>
          <li v-for="user in blockedUsers" :key="user._id">
            <div class="user-row">
              <span class="username">@{{ user.username }}</span>
              <button @click="UnblockFromTopicAndAllSubtopics(user.username)">Odblokuj</button>
            </div>
            <small>{{ new Date(user.blockedAt).toLocaleDateString() }}</small>
          </li>
        </ul>
      </aside>
    </div>
  </div>
</template>

<style scoped lang="scss">
.topic-view {
  max-width: 800px;
  width: 100%;
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

.posts-list .posts-list li {
  margin-top: $margin-md;
  margin-left: $padding-lg * 1.5;

  .post-item {
    padding: $padding-md * 1.5;
    border-radius: $border-radius-lg;
    border-left: 3px solid $primary-lighter;
  }
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
      cursor: pointer;
      .nick-box {
        position: absolute;
        background: $background-dark;
        color: $text-white;
        padding: $padding-sm $padding-md;
        border-radius: $border-radius;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        margin-top: $margin-sm;
        font-size: $font-size-base * 0.9;
      }
      .nick-box-button {
        display: block;
        width: 100%;
        background: transparent;
        border: none;
        color: $text-white;
        text-align: left;
        padding: $padding-sm 0;
        cursor: pointer;

        &:hover {
          color: $primary-color;
        }
      }
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
    justify-content: space-between;
    align-items: center;
  }
  .post-footer-empty-tags {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
}
.like-button {
  background: transparent;
  border: 1px solid $border-dark;
  color: $text-light;
  padding: $padding-sm $padding-md;
  margin-right: 1rem;

  border-radius: $border-radius;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: lighten($background-lighter, 5%);
    border-color: $primary-color;
  }
}
.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;
  margin: 0.5em 0 0.5em 0;
}
.post-tag {
  background: $background-dark;
  color: $primary-lighter;
  border-radius: $border-radius;
  padding: 0.2em 0.7em;
  font-size: $font-size-base * 0.95;
  font-weight: 500;
  border: 1px solid $primary-color;
  letter-spacing: 0.02em;
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
.topic-layout {
  display: flex;
  gap: 2rem;
}

.blocked-users-panel {
  width: 260px;
  background: $background-dark;
  border: 1px solid $border-dark;
  border-radius: $border-radius;
  padding: $padding-md;
  height: fit-content;
  position: absolute;
  top: 100px;
  right: 20px;

  h3 {
    margin-bottom: 1rem;
    color: $text-white;
    font-size: $font-size-base * 1.1;
  }

  .empty {
    color: $text-light;
    font-style: italic;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid $border-dark;
  }

  .user-row {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .username {
      color: $primary-lighter;
      font-weight: 600;
    }

    button {
      background: transparent;
      border: none;
      color: $primary-color;
      cursor: pointer;

      &:hover {
        color: lighten($primary-color, 10%);
      }
    }
  }
}
.delete-post-btn {
  background: transparent;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  font-size: 1rem;
  margin-left: 0.5rem;
  margin-right: 10px;

  &:hover {
    color: lighten(#e74c3c, 10%);
  }
}
.edit-post-btn {
  background: transparent;
  border: none;
  color: #f1c40f;
  cursor: pointer;
  font-size: 1rem;
  margin-right: 8px;
  text-decoration: none;

  &:hover {
    color: lighten(#f1c40f, 10%);
  }
}
.edit-topic-btn {
  position: absolute;
  right: 6rem;
  top: $padding-sm;
  align-items: center;
  color: $text-white;
  border: none;
  cursor: pointer;
  text-decoration: none;
}
.edit-topic-btn:hover {
  color: $primary-lighter;
}
</style>
