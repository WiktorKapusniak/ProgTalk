<script lang="ts" setup>
import { onMounted, reactive, ref } from "vue";
import { useToast } from "vue-toastification";
import axios from "axios";
import type Topic from "@/interfaces/Topic";
import type Post from "@/interfaces/Post";
import Pagination from "./Pagination.vue";
import type PaginationProps from "@/interfaces/Pagination";
import { useAuth } from "@/composables/useAuth";
import { useRouter } from "vue-router";
const toast = useToast();
const router = useRouter();
const { username, loadUsername } = useAuth();
const topics = ref<Topic[]>([]);
</script>

<template></template>

<style scoped lang="scss"></style>
