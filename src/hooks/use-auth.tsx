"use client"

import { usePathname, useRouter } from "next/navigation"
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import api from "../services/api"
import { registerPushDevice, unregisterPushDevice } from "../services/notifications"
import { useAlert } from "./use-alert"

export type MenuPermission = {
  nome: string;
  idMenuAcesso: number;
  slug: string;
  visualizar: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
  relatorio: boolean;
}

export type User = {
  nivel_acesso: {
    menus: MenuPermission[]; 
  } & {
    idNivelAcesso: number;
    nome: string;
    descricao: string | null;
  };
  idUser: string;
  name: string;
  avatar: string | null;
  email: string;
  cpf: string | null;
  cep: string | null;
  phone: string | null;
  user_id_create: number | null;
  user_id_update: number | null;
  user_id_delete: number | null;
  dt_delete: Date | null;
  created: Date;
  updated: Date | null;
  active: boolean;
  nivelAcessoId: number;
}

type AuthContextType = {
  user: User | null
  accessToken: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  getPermissions: (slug: string) => MenuPermission | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pushRegistered, setPushRegistered] = useState(false)
  const { setAlert } = useAlert()

  const router = useRouter();

  const path = usePathname();

  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data } = await api.get('/auth/me')
        setUser(data)
      } catch (err) {
        console.error("Nenhuma sessão válida encontrada.", err)
        if (path?.startsWith('/admin')) {
          const redirect = encodeURIComponent(path)
          router.push(`/auth/login?redirect=${redirect}`)
        }
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    loadSession()
  }, [router, path])

  // Notificar Service Worker quando usuário se autentica
  useEffect(() => {
    if (user && accessToken && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.active) {
          console.log('💬 Compartilhando token com Service Worker');
          reg.active.postMessage({
            type: 'USER_AUTHENTICATED',
            token: accessToken,
            apiUrl: process.env?.NEXT_PUBLIC_API_URL,
            userId: user.idUser,
          });
        }
      });
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    } else {
      delete api.defaults.headers.common['Authorization']
    }
  }, [accessToken])

  useEffect(() => {
    if (user && accessToken) {
      if (pushRegistered) return

      registerPushDevice(api)
        .then((res) => setPushRegistered(res.registered))
        .catch((err) => {
          console.error('Falha ao registrar push device:', err)
          setPushRegistered(false)
        })
      return
    }

    if (!user && pushRegistered) {
      unregisterPushDevice(api).finally(() => setPushRegistered(false))
    }
  }, [user, accessToken, pushRegistered])

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login-web', { email, password })
      const data = response.data
      setAccessToken(data.accessToken)
      setUser(data.user)
      setAlert(`Bem-vindo(a), ${data.user.name}`, "success")
    } catch (err: any) {
      setAlert(err.response.data.message || "Email ou senha inválidos", "error")
      throw err
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout-web')
      setAlert("Você saiu com sucesso.", "success")
    } catch (err) {
      console.error("Erro ao invalidar sessão no backend", err)
    } finally {
      setAccessToken(null)
      setUser(null)
      router.push('/auth/login')
    }
  }

  const permissionsMap = useMemo(() => {
    const map = new Map<string, MenuPermission>();
    if (user?.nivel_acesso?.menus) {
      for (const menu of user.nivel_acesso.menus) {
        map.set(menu.slug, menu);
      }
    }
    return map;
  }, [user]); 

  const getPermissions = useCallback((slug: string): MenuPermission | null => {
    return permissionsMap.get(slug) || null;
  }, [permissionsMap]);

  const isAdminRoute = path?.startsWith('/admin')

  if (isAdminRoute && loading) {
    return (
      <AuthContext.Provider value={{ user, accessToken, loading, login, logout, getPermissions }}>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout, getPermissions }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)