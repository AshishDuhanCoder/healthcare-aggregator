"use client"

import { createContext, useContext, type ReactNode } from "react"
import { authClient } from "@/lib/auth-client"

type AuthContextValue = {
  user: typeof authClient.$Infer.Session.user | null
  isAuthenticated: boolean
  isPending: boolean
  signIn: (name: string, email: string, password: string) => Promise<boolean>
  signUp: (name: string, email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession()
  const value: AuthContextValue = {
    user: session?.user ?? null,
    isAuthenticated: Boolean(session?.user),
    isPending,
    signIn: async (_name, email, password) => {
      const result = await authClient.signIn.email({ email, password })
      return !result.error
    },
    signUp: async (name, email, password) => {
      const result = await authClient.signUp.email({ name, email, password })
      return !result.error
    },
    signOut: async () => {
      await authClient.signOut()
    },
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
