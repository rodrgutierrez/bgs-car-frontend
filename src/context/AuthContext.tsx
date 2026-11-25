import { useState } from 'react';
import type { ReactNode } from 'react';
import type { UserRole } from '../types';
import { clearToken, getToken, setToken } from '../services/api';
import { AuthContext } from './auth-store';

function readUser() {
  return {
    name: localStorage.getItem('bgs_usuario') ?? '',
    surname: localStorage.getItem('bgs_usuario_apellido') ?? '',
    email: localStorage.getItem('bgs_correo') ?? '',
    role: (localStorage.getItem('rol_usuario') as UserRole) ?? null,
    token: getToken(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(readUser);

  const signIn = (
    name: string,
    surname: string,
    email: string,
    role: Exclude<UserRole, null>,
    token?: string
  ) => {
    localStorage.setItem('bgs_usuario', name);
    localStorage.setItem('bgs_usuario_apellido', surname);
    localStorage.setItem('bgs_correo', email);
    localStorage.setItem('rol_usuario', role);
    if (token) {
      setToken(token);
    }
    setUser({ name, surname, email, role, token: token ?? getToken() });
  };

  const signOut = () => {
    localStorage.removeItem('bgs_usuario');
    localStorage.removeItem('bgs_usuario_apellido');
    localStorage.removeItem('bgs_correo');
    localStorage.removeItem('rol_usuario');
    clearToken();
    setUser({ name: '', surname: '', email: '', role: null, token: null });
  };

  return <AuthContext.Provider value={{ ...user, signIn, signOut }}>{children}</AuthContext.Provider>;
}