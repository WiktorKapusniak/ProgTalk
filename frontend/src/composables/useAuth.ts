import { ref, computed } from "vue";
import axios from "axios";

const username = ref<string | null>(null);
const userId = ref<string | null>(null);

export function useAuth() {
  const loadUsername = async () => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      userId.value = storedUserId;
      try {
        const response = await axios.get(`/api/users/${storedUserId}`);
        username.value = response.data.username;
      } catch (error) {
        console.error("Failed to load username:", error);
      }
    }
  };

  const updateUsername = (newUsername: string) => {
    username.value = newUsername;
  };

  return {
    username: computed(() => username.value),
    userId: computed(() => userId.value),
    loadUsername,
    updateUsername,
  };
}
