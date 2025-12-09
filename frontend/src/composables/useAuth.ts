import { ref, computed } from "vue";
import axios from "axios";

const username = ref<string | null>(null);

export function useAuth() {
  const loadUsername = async () => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      try {
        const response = await axios.get(`/api/users/${userId}`);
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
    loadUsername,
    updateUsername,
  };
}
