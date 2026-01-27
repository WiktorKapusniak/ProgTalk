<script lang="ts" setup>
import { onMounted, reactive, ref, computed } from "vue";
import { useToast } from "vue-toastification";
import axios from "axios";
import { useRouter, useRoute } from "vue-router";

const toast = useToast();
const router = useRouter();
const route = useRoute();

const postId = route.params.postId as string | undefined;
const parentPostId = route.params.parentPostId as string | undefined;

const isEditMode = computed(() => !!postId);
const isReplyMode = computed(() => !!parentPostId && !postId);

const parentPost = ref<any>(null);

interface PostForm {
  content: string;
  code?: string;
  tags?: string[];
  reference?: string;
}

const form: PostForm = reactive({
  content: "",
  code: "",
  tags: [],
  reference: undefined,
});

const tags = ref<string[]>([]);

/* ===== INIT ===== */
onMounted(async () => {
  try {
    const tagsRes = await axios.get("/api/tags");
    tags.value = tagsRes.data.tags.map((t: any) => t.name);
  } catch {
    toast.error("Nie udało się załadować tagów");
  }

  /* ===== EDYCJA ===== */
  if (isEditMode.value && postId) {
    try {
      const res = await axios.get(`/api/posts/${postId}`);
      const post = res.data.post;

      form.content = post.content;
      form.code = post.code || "";
      form.tags = Array.isArray(post.tags) ? post.tags : [];
      form.reference = post.reference || undefined;

      parentPost.value = null;
      return;
    } catch {
      toast.error("Nie udało się załadować posta do edycji");
      router.push(`/topic/${route.params.id}`);
      return;
    }
  }

  /* ===== ODPOWIEDŹ ===== */
  if (isReplyMode.value && parentPostId) {
    try {
      const res = await axios.get(`/api/posts/${parentPostId}`);
      parentPost.value = res.data.post;
      form.reference = parentPostId;
    } catch {
      parentPost.value = null;
      form.reference = undefined;
    }
  }
});

/* ===== SUBMIT ===== */
const handleSubmit = async () => {
  try {
    const topicId = route.params.id as string;

    /* ===== EDYTOWANIE ===== */
    if (isEditMode.value && postId) {
      await axios.patch(`/api/posts/${postId}`, {
        content: form.content,
        code: form.code,
        tags: form.tags,
      });

      toast.success("Post został zaktualizowany");
      router.push(`/topic/${topicId}`);
      return;
    }

    /* ===== TWORZENIE / ODPOWIEDŹ ===== */
    await axios.post(`/api/topics/${topicId}/posts`, {
      content: form.content,
      code: form.code,
      tags: form.tags,
      reference: form.reference,
    });

    toast.success("Post dodany pomyślnie!");
    router.push(`/topic/${topicId}`);
  } catch {
    toast.error("Operacja nie powiodła się");
  }
};
</script>

<template>
  <section class="addTopicSection">
    <div class="addTopicContainer">
      <h2>
        <span v-if="isEditMode">Edytuj post</span>
        <span v-else-if="isReplyMode">Odpowiedz na post</span>
        <span v-else>Dodaj post</span>
      </h2>

      <div v-if="parentPost && isReplyMode" class="quoted-post">
        <div class="quoted-author">Odpowiedź do: @{{ parentPost.author?.username }}</div>
        <div class="quoted-content">{{ parentPost.content }}</div>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="input">
          <label for="content">Content</label>
          <textarea id="content" v-model="form.content" rows="3" required></textarea>
        </div>

        <div class="input">
          <label for="code">Code (optional)</label>
          <textarea id="code" v-model="form.code" rows="4"></textarea>
        </div>

        <div class="input">
          <label for="tags">Tags</label>
          <div class="tags-container">
            <div class="tag-item" v-for="tag in tags" :key="tag">
              {{ tag }}
              <input type="checkbox" :value="tag" v-model="form.tags" />
            </div>
          </div>
        </div>

        <button type="submit" id="submitButton">
          {{ isEditMode ? "Zapisz zmiany" : "Dodaj post" }}
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped lang="scss">
.addTopicSection {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 60px);
  padding: $padding-lg;
}

.addTopicContainer {
  background-color: $background-lighter;
  padding: $padding-lg;
  border-radius: $border-radius-lg;
  box-shadow: $box-shadow;
  width: 100%;
  max-width: 800px;
}

h2 {
  color: $secondary-color;
  font-size: $font-size-lg;
  font-weight: bold;
  margin-bottom: $margin-lg;
  text-align: center;
}

.input {
  margin-bottom: $margin-md;
  display: flex;
  flex-direction: column;
  height: auto;
}

label {
  color: $text-lighter;
  margin-bottom: $margin-sm;
  font-weight: 500;
}

input,
textarea {
  padding: $padding-sm;
  border: 1px solid $border-dark;
  background-color: $background-dark;
  border-radius: $border-radius;
  color: $text-white;
  font-size: $font-size-base;
  font-family: inherit;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: $primary-color;
  }

  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px $background-dark inset !important;
    -webkit-text-fill-color: $text-white !important;
  }
}

#submitButton {
  width: 100%;
  padding: 0.75rem;
  margin-top: $margin-sm;
  border: none;
  border-radius: $border-radius;
  background-color: $primary-color;
  color: $text-white;
  font-size: $font-size-base;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: $primary-lighter;
  }
}
.quoted-post {
  background: $background-dark;
  border-left: 3px solid $primary-color;
  padding: $padding-md;
  margin-bottom: $margin-md;
  border-radius: $border-radius;
}
.quoted-author {
  color: $primary-lighter;
  font-weight: 600;
  margin-bottom: 0.3em;
}
.quoted-content {
  color: $text-light;
  font-size: $font-size-base;
}
.tags-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: $margin-sm;
}
.tag-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: $padding-sm;
  background-color: $background-dark;
  border-radius: 0.75rem;
  border: 1px solid $border-dark;
  color: $text-white;
  font-size: $font-size-base;
  font-weight: 500;

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: $primary-color;
    cursor: pointer;
  }
}
</style>
