<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useToast } from "vue-toastification";
import axios from "axios";

const toast = useToast();

interface User {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
  role: string;
  approved?: boolean;
  Banned?: boolean;
}

const pendingUsers = ref<User[]>([]);
const bannedUsers = ref<User[]>([]);
const isLoading = ref(false);

const loadApprovalWaitlist = async () => {
  try {
    isLoading.value = true;
    const response = await axios.get("/api/admin-panel/users/pending-approval");
    pendingUsers.value = response.data;
  } catch (error: any) {
    console.error("Error loading approval waitlist:", error);
    toast.error(error.response?.data?.message || "Failed to load pending users");
  } finally {
    isLoading.value = false;
  }
};

const loadBannedUsers = async () => {
  try {
    isLoading.value = true;
    const response = await axios.get("/api/admin-panel/users/banned");
    bannedUsers.value = response.data;
  } catch (error: any) {
    console.error("Error loading banned users:", error);
    toast.error(error.response?.data?.message || "Failed to load banned users");
  } finally {
    isLoading.value = false;
  }
};

const approveUser = async (userId: string) => {
  try {
    await axios.post(`/api/admin-panel/users/${userId}/approve`);
    toast.success("User approved successfully");
    await loadApprovalWaitlist();
  } catch (error: any) {
    console.error("Error approving user:", error);
    toast.error(error.response?.data?.message || "Failed to approve user");
  }
};

const unbanUser = async (userId: string) => {
  try {
    await axios.post(`/api/admin/unban/${userId}`);
    toast.success("User unbanned successfully");
    await loadBannedUsers();
  } catch (error: any) {
    console.error("Error unbanning user:", error);
    toast.error(error.response?.data?.message || "Failed to unban user");
  }
};

onMounted(async () => {
  await Promise.all([loadApprovalWaitlist(), loadBannedUsers()]);
});
</script>

<template>
  <div class="admin-panel">
    <h1>Admin Panel</h1>

    <div v-if="isLoading" class="loader">
      <p>Loading...</p>
    </div>

    <div v-else class="panel-content">
      <section class="section">
        <h2>Pending Approvals ({{ pendingUsers.length }})</h2>
        <div v-if="pendingUsers.length === 0" class="empty-state">
          <p>No users waiting for approval</p>
        </div>
        <div v-else class="users-list">
          <div v-for="user in pendingUsers" :key="user._id" class="user-card">
            <div class="user-info">
              <h3>{{ user.username }}</h3>
              <p class="email">{{ user.email }}</p>
              <p class="date">Registered: {{ new Date(user.createdAt).toLocaleDateString() }}</p>
            </div>
            <div class="user-actions">
              <button @click="approveUser(user._id)" class="btn-approve">Approve</button>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>Banned Users ({{ bannedUsers.length }})</h2>
        <div v-if="bannedUsers.length === 0" class="empty-state">
          <p>No banned users</p>
        </div>
        <div v-else class="users-list">
          <div v-for="user in bannedUsers" :key="user._id" class="user-card">
            <div class="user-info">
              <h3>{{ user.username }}</h3>
              <p class="email">{{ user.email }}</p>
              <p class="date">Registered: {{ new Date(user.createdAt).toLocaleDateString() }}</p>
            </div>
            <div class="user-actions">
              <button @click="unbanUser(user._id)" class="btn-unban">Unban</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.admin-panel {
  padding: $padding-lg;
  max-width: 1200px;
  margin: 0 auto;

  h1 {
    color: $secondary-color;
    font-size: 2rem;
    margin-bottom: $margin-lg;
    text-align: center;
  }
}

.loader {
  text-align: center;
  padding: $padding-xl;
  color: $text-lighter;
  font-size: $font-size-lg;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: $margin-xl;
}

.section {
  background-color: $background-lighter;
  padding: $padding-lg;
  border-radius: $border-radius-lg;
  box-shadow: $box-shadow;

  h2 {
    color: $primary-lighter;
    font-size: 1.5rem;
    margin-bottom: $margin-lg;
    border-bottom: 2px solid $primary-color;
    padding-bottom: $padding-sm;
  }
}

.empty-state {
  text-align: center;
  padding: $padding-xl;
  color: $text-lighter;
  font-style: italic;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: $margin-md;
}

.user-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $padding-md;
  background-color: $background-dark;
  border-radius: $border-radius;
  border: 1px solid $border-dark;
  transition: all 0.3s ease;

  &:hover {
    border-color: $primary-color;
  }
}

.user-info {
  flex: 1;

  h3 {
    color: $text-white;
    font-size: 1.2rem;
    margin-bottom: $margin-sm;
  }

  .email {
    color: $text-lighter;
    font-size: 0.9rem;
    margin-bottom: $margin-sm;
  }

  .date {
    color: $text-light;
    font-size: 0.85rem;
  }
}

.user-actions {
  display: flex;
  gap: $margin-sm;
}

.btn-approve,
.btn-unban {
  padding: $padding-sm $padding-md;
  border: none;
  border-radius: $border-radius;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.btn-approve {
  background-color: $primary-color;
  color: $text-white;

  &:hover {
    background-color: $primary-lighter;
    transform: scale(1.05);
  }
}

.btn-unban {
  background-color: #28a745;
  color: $text-white;

  &:hover {
    background-color: #34ce57;
    transform: scale(1.05);
  }
}
</style>
