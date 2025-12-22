<script lang="ts" setup>
import { RouterLink } from "vue-router";
interface Breadcrumb {
  label: string;
  to?: string;
}
const props = defineProps<{
  breadcrumbs: Breadcrumb[];
}>();
</script>
<template>
  <nav aria-label="breadcrumb" class="breadcrumbNav">
    <ol class="breadcrumbList">
      <li v-for="(breadcrumb, index) in breadcrumbs" :key="index" class="breadcrumbItem">
        <RouterLink v-if="breadcrumb.to" :to="breadcrumb.to" class="breadcrumbLink">
          {{ breadcrumb.label }}
        </RouterLink>
        <span v-else class="breadcrumbCurrent">
          {{ breadcrumb.label }}
        </span>
        <span v-if="index < breadcrumbs.length - 1" class="separator"> / </span>
      </li>
    </ol>
  </nav>
</template>

<style lang="scss" scoped>
.breadcrumbNav {
  margin-bottom: 1.5rem;
}

.breadcrumbList {
  display: flex;
  list-style: none;
  padding: 0;
  gap: 0.5rem;
  align-items: center;
}

.breadcrumbLink {
  color: #3b82f6;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.breadcrumbCurrent {
  color: #6b7280;
  font-weight: 500;
}

.separator {
  color: #9ca3af;
}
</style>
