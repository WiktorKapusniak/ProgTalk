<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import Navbar from "@/components/Navbar.vue";
import Notification from "@/components/Notification.vue";
import { useAdminSocket } from "@/composables/socket/adminSocket";
import { useAuth } from "@/composables/useAuth";
const { isAdmin, loadUsername } = useAuth();
const notificationMessage = ref("");
const notificationKey = ref(0);

const { subscribeToAdmin, unsubscribeFromAdmin, onNewRegistration, offNewRegistration, onNewApproval, offNewApproval } =
  useAdminSocket();

function showNotification(msg: string) {
  notificationMessage.value = msg;
  notificationKey.value++;
}

onMounted(async () => {
  await loadUsername();
  if (isAdmin.value) {
    subscribeToAdmin();
    console.log("test");
    onNewRegistration((data: any) => {
      showNotification(data?.message || "Nowy użytkownik czeka na approval");
    });
    onNewApproval((data: any) => {
      showNotification(data?.message || "Użytkownik został zaaprobowany przez admina");
    });
  }
});
onUnmounted(() => {
  if (isAdmin.value) {
    console.log("test off");
    offNewRegistration();
    offNewApproval();
    unsubscribeFromAdmin();
  }
});
</script>

<template>
  <div class="main-layout">
    <Navbar />
    <main class="content">
      <router-view />
    </main>
    <Notification v-if="notificationMessage" :key="notificationKey" :message="notificationMessage" />
  </div>
</template>

<style scoped lang="scss">
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
}
</style>
