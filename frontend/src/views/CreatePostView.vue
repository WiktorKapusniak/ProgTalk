<script setup lang="ts">
import CreatePost from "@/components/CreatePost.vue";
import { useRoute } from "vue-router";
const route = useRoute();
</script>
<template>
  <CreatePost :parent-post-id="route.params.parentPostId" />
</template>

<style scoped lang="scss"></style>
