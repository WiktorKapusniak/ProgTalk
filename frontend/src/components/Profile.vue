<script lang="ts" setup>
import { onMounted, reactive } from "vue";
import { useToast } from "vue-toastification";
import { useAuth } from "../composables/useAuth";
import axios from "axios";

const toast = useToast();
const { username, loadUsername, updateUsername } = useAuth();

const form = reactive({
  username: "",
  email: "",
  password: "",
  repeatPassword: "",
});
onMounted(async () => {
  const userId = localStorage.getItem("userId");
  const data = await axios.get(`/api/users/${userId}`);
  form.username = data.data.username;
  form.email = data.data.email;
});
const handleUsernameChange = async () => {
  await loadUsername();
  if (form.username.trim() === "") {
    toast.error("Username cannot be empty.");
    return;
  }
  if (form.username == username.value) {
    toast.error("Please enter a new username.");
    return;
  }
  const userId = localStorage.getItem("userId");
  const response = await axios.patch(`/api/users/${userId}`, {
    username: form.username,
  });
  if (response.status === 200) {
    updateUsername(form.username);
    toast.success("Username changed successfully!");
  } else {
    toast.error("Failed to change username. Please try again.");
  }
};
const handlePasswordChange = async () => {
  if (form.password !== form.repeatPassword) {
    toast.error("Passwords do not match.");
    return;
  }
  const userId = localStorage.getItem("userId");
  const response = await axios.patch(`/api/users/${userId}`, {
    password: form.password,
  });
  if (response.status === 200) {
    toast.success("Password changed successfully!");
  } else {
    toast.error("Failed to change password. Please try again.");
  }
};
</script>
<template>
  <section class="profileSection">
    <div class="profileContainer">
      <h2>Change your data</h2>
      <form @submit.prevent="handleUsernameChange">
        <div class="input">
          <label for="username">Username</label>
          <input id="username" v-model="form.username" type="text" required />
        </div>
        <button type="submit" id="submitButton">Change</button>
      </form>
      <div class="input">
        <label for="email">Email</label>
        <input id="email" v-model="form.email" type="email" disabled />
      </div>
      <form @submit.prevent="handlePasswordChange">
        <div class="password">
          <label for="password">New Password</label>
          <input id="password" v-model="form.password" type="password" autocomplete="new-password" />
        </div>
        <div class="repeatPassword">
          <label for="repeatPassword">Repeat New Password</label>
          <input id="repeatPassword" v-model="form.repeatPassword" type="password" autocomplete="new-password" />
        </div>
        <button type="submit" id="submitButton">Change</button>
      </form>
    </div>
  </section>
</template>

<style scoped lang="scss">
.profileSection {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 60px);
  padding: $padding-lg;
}

.profileContainer {
  background-color: $background-lighter;
  padding: $padding-lg;
  border-radius: $border-radius-lg;
  box-shadow: $box-shadow;
  width: 100%;
  max-width: 600px;
}

h2 {
  color: $secondary-color;
  font-size: $font-size-lg;
  font-weight: bold;
  margin-bottom: $margin-lg;
  text-align: center;
}

form {
  margin-bottom: $margin-lg;
  padding-bottom: $padding-lg;
  border-bottom: 1px solid $border-dark;

  &:last-of-type {
    border-bottom: none;
    margin-bottom: 0;
  }
}

.input,
.password,
.repeatPassword {
  margin-bottom: $margin-md;
  display: flex;
  flex-direction: column;
}

label {
  color: $text-lighter;
  margin-bottom: $margin-sm;
  font-weight: 500;
}

input {
  padding: $padding-sm;
  border: 1px solid $border-dark;
  background-color: $background-dark;
  border-radius: $border-radius;
  color: $text-white;
  font-size: $font-size-base;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:focus {
    outline: none;
    border-color: $primary-color;
  }

  // Wymuszenie koloru tła dla autofilli
  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px $background-dark inset !important;
    -webkit-text-fill-color: $text-white !important;
  }
}

#submitButton {
  width: 40%;
  padding: 0.75rem;
  margin: 0 auto;
  display: block;
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
