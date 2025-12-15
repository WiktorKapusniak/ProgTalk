<script lang="ts" setup>
import { onMounted, reactive } from "vue";
import { useToast } from "vue-toastification";
import axios from "axios";
import { useRouter } from "vue-router";
const toast = useToast();
const router = useRouter();
// const { username, loadUsername, updateUsername } = useAuth();
interface TopicForm {
  topic: string;
  description: string;
}
const form: TopicForm = reactive({
  topic: "",
  description: "",
});
onMounted(async () => {});
const handleAddTopic = async () => {
  const response = await axios.post("/api/topics", {
    title: form.topic,
    description: form.description,
  });
  if (response.status === 201) {
    toast.success("Topic added successfully!");
    form.topic = "";
    form.description = "";
    router.push("/home");
  } else {
    toast.error("Failed to add topic. Please try again.");
  }
};
</script>
<template>
  <section class="addTopicSection">
    <div class="addTopicContainer">
      <h2>Add Topic</h2>
      <form @submit.prevent="handleAddTopic">
        <div class="input">
          <label for="topic">Topic</label>
          <textarea id="topic" v-model="form.topic" rows="2" required></textarea>
        </div>
        <div class="input">
          <label for="description">Description</label>
          <textarea id="description" v-model="form.description" rows="4" required></textarea>
        </div>
        <button type="submit" id="submitButton">Add</button>
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
</style>
