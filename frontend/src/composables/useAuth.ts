import { ref, computed } from "vue";
import axios from "axios";

const username = ref<string | null>(null);
const userId = ref<string | null>(null);
const userRole = ref<string | null>(null);
const approved = ref<boolean | null>(null);

export function useAuth() {
  const loadUsername = async () => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      userId.value = storedUserId;
      try {
        const response = await axios.get(`/api/users/${storedUserId}`);
        username.value = response.data.username;
        userRole.value = response.data.role;
        approved.value = response.data.approved;
      } catch (error) {
        console.error("Failed to load username:", error);
      }
    }
  };

  const updateUsername = (newUsername: string) => {
    username.value = newUsername;
  };

  const isAdmin = computed(() => userRole.value === "admin");

  return {
    username: computed(() => username.value),
    userId: computed(() => userId.value),
    userRole: computed(() => userRole.value),
    approved: computed(() => approved.value),
    isAdmin,
    loadUsername,
    updateUsername,
  };
}
