<script setup>
import { ref } from "vue";
import { RouterLink } from "vue-router";
import { useToast } from "vue-toastification";
import axios from "axios";
import router from "../router";

const toast = useToast();

const username = ref();
const password = ref();

const handleSubmit = async () => {
  try {
    const response = await axios.post("/api/auth/login", {
      username: username.value,
      password: password.value,
    });

    localStorage.setItem("token", response.data.token);
    localStorage.setItem("userId", response.data.userId);
    toast.success("Login successful!");
    router.push("/home");
  } catch (err) {
    console.error(err);
    const message = err.response?.data?.message || "Login failed. Please check your credentials.";
    toast.error(message);
  }
};
</script>

<template>
  <section class="loginForm">
    <div class="loginContainer">
      <h1 id="title">Login</h1>
      <form @submit.prevent="handleSubmit">
        <div class="input">
          <label for="username">Username</label>
          <input id="username" v-model="username" type="text" required />
        </div>
        <div class="input">
          <label for="password">Password</label>
          <input id="password" v-model="password" type="password" required />
        </div>
        <button type="submit" id="submitButton">Submit</button>
      </form>
      <RouterLink id="router" to="/register">Don't have an account? Register here.</RouterLink>
    </div>
  </section>
</template>

<style scoped lang="scss">
#router {
  display: block;
  margin-top: $margin-md;
  text-align: center;
  color: $primary-lighter;
  text-decoration: none;
  background-color: $background-lighter;
}
form {
  background-color: $background-lighter;
}
#title {
  background-color: $background-lighter;
  color: $secondary-color;
  font-size: $font-size-lg;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
}
.loginForm {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
.loginContainer {
  background-color: $background-lighter;
  padding: $padding-lg;
  padding-top: $margin-md;
  border-radius: $border-radius-lg;
  box-shadow: $box-shadow;
  width: 500px;
}
h2 {
  color: $text-white;
  text-align: center;
  margin-bottom: $margin-lg;
}
.input {
  margin-bottom: $margin-md;
  display: flex;
  flex-direction: column;
  background-color: $background-lighter;
}
.input label {
  color: $text-lighter;
  margin-bottom: $margin-sm;
  background-color: $background-lighter;
}
.input input {
  padding: $padding-sm;
  border: 1px solid $border-dark;
  background-color: $background-dark;
  border-radius: $border-radius;
  color: $text-white;
  // Wymuszenie koloru tła dla autofill
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
  border: none;
  border-radius: $border-radius;
  background-color: $primary-color;
  color: $text-white;
  font-size: $font-size-base;
  cursor: pointer;
}
#submitButton:hover {
  background-color: $primary-lighter;
}
</style>
