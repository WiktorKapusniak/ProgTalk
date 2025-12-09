<script lang="ts" setup>
import { RouterLink, useRouter } from "vue-router";
import { onMounted } from "vue";
import { useAuth } from "../composables/useAuth";

const { username, loadUsername } = useAuth();
const router = useRouter();

onMounted(async () => {
  await loadUsername();
});

const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  router.push("/login");
};
</script>
<template>
  <nav class="navbar">
    <div class="navbar-brand">ProgTalk</div>
    <RouterLink to="/profile" class="username" v-if="username">{{ username }}</RouterLink>
    <div class="navbar-links">
      <RouterLink to="/home" class="nav-link">Home</RouterLink>
      <RouterLink to="/profile" class="nav-link">Profile</RouterLink>
      <button @click="handleLogout" class="nav-link logout-btn">Logout</button>
    </div>
  </nav>
</template>

<style scoped lang="scss">
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: $background-lighter;
  padding: $padding-md $padding-lg;
  box-shadow: $box-shadow;
}

.navbar-brand {
  font-size: 1.75rem;
  font-weight: 800;
  color: $secondary-color;
}

.username {
  color: $primary-lighter;
  font-size: 1.1rem;
  font-weight: 700;
  font-size: 1.5rem;
  text-decoration: none;
}

.navbar-links {
  display: flex;
  gap: $padding-lg;
}

.nav-link {
  color: $text-lighter;
  text-decoration: none;
  padding: $padding-sm $padding-md;
  border-radius: $border-radius;
  transition: all 0.3s ease;

  &:hover {
    background-color: $background-dark;
    color: $primary-lighter;
  }

  &.router-link-active {
    background-color: $primary-color;
    color: $text-white;
  }
}

.logout-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: inherit;
  font-family: inherit;
}
</style>
