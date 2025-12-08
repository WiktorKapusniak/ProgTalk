<script setup>
import { reactive } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import axios from "axios";

const toast = useToast();
const router = useRouter();

const form = reactive({
  username: "",
  password: "",
  repeatedPassword: "",
  email: "",
});

const handleSubmit = async () => {
  if (form.password !== form.repeatedPassword) {
    toast.error("Passwords do not match.");
    return;
  }
  try {
    const response = await axios.post("/api/auth/register", {
      username: form.username,
      password: form.password,
      email: form.email,
    });
    console.log("Registration successful:", response.data);
    toast.success("Registration successful! Please log in.");
    router.push("/login");
  } catch (err) {
    console.error(err);
    const message = err.response?.data?.message || "Registration failed. Please try again.";
    toast.error(message);
  }
};
</script>
<template>
  <section class="registerForm">
    <div class="registerContainer">
      <h1 id="title">Register</h1>
      <form @submit.prevent="handleSubmit">
        <div class="input">
          <label for="username">Username</label>
          <input id="username" v-model="form.username" type="text" required />
        </div>

        <div class="input">
          <label for="email">Email</label>
          <input id="email" v-model="form.email" type="email" required />
        </div>

        <div class="input">
          <label for="password">Password</label>
          <input id="password" v-model="form.password" type="password" required />
        </div>

        <div class="input">
          <label for="repeatedPassword">Repeat Password</label>
          <input id="repeatedPassword" v-model="form.repeatedPassword" type="password" required />
        </div>

        <button type="submit" id="submitButton">Submit</button>
      </form>

      <RouterLink id="router" to="/login">Already have an account? Login here.</RouterLink>
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
.registerForm {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
.registerContainer {
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
