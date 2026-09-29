import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'SUPER_ADMIN' | 'CAMPUS_ADMIN' | 'LECTURER' | 'STUDENT' | 'SCHOOL_ADMIN' | 'TEACHER' | 'PUPIL' | 'SCHOOL_APPLICANT';

export interface AuthUser {
  user_id: string;
  campus_id: string | null;
  name: string;
  email: string;
  role: Role;
  ref_id: string | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'akademika-auth' },
  ),
);
