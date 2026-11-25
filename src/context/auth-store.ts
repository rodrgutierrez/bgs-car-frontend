import { createContext } from 'react';
import type { UserRole } from '../types';

export interface AuthContextValue {
  name: string;
  surname: string;
  email: string;
  role: UserRole;
  token: string | null;
  signIn: (name: string, surname: string, email: string, role: Exclude<UserRole, null>, token?: string) => void;
signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
