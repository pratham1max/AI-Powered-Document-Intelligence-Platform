import { create } from "zustand";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";
import { logout as firebaseLogout } from "../firebase/authService";

export const useAuthStore = create((set) => ({
  user: null,
  idToken: null,
  loading: true, // stays true until Firebase resolves initial auth state

  setUser: (user, idToken) => set({ user, idToken, loading: false }),
  clearUser: () => set({ user: null, idToken: null, loading: false }),

  logout: async () => {
    await firebaseLogout();
    set({ user: null, idToken: null });
  },
}));

// Resolve auth state once on app load
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const idToken = await user.getIdToken();
    useAuthStore.getState().setUser(user, idToken);
  } else {
    useAuthStore.getState().clearUser();
  }
});
