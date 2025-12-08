<script lang="ts" setup>
import { RouterLink } from "vue-router";
</script>
<template>
  <nav class="navbar">
    <div class="navbar-brand">ProgTalk</div>
    <div class="navbar-links">
      <RouterLink to="/home" class="nav-link">Home</RouterLink>
      <RouterLink to="/profile" class="nav-link">Profile</RouterLink>
      <RouterLink to="/settings" class="nav-link">Settings</RouterLink>
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
  font-size: 1.5rem;
  font-weight: bold;
  color: $secondary-color;
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
</style>
