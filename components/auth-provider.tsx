"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type User = {
  name: string
  email: string
}

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  signIn: (name: string, email: string, password: string) => Promise<boolean>
  signUp: (name: string, email: string, password: string) => Promise<boolean>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem("healthagg_user")
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        sessionStorage.removeItem("healthagg_user")
      }
    }
  }, [])

  const signIn = async (name: string, email: string, password: string): Promise<boolean> => {
    if (!email || !password) return false
    const stored = sessionStorage.getItem("healthagg_accounts")
    const accounts: Record<string, { name: string; password: string }> = stored ? JSON.parse(stored) : {}
    const account = accounts[email]
    if (!account || account.password !== password) return false
    const u = { name: account.name, email }
    setUser(u)
    sessionStorage.setItem("healthagg_user", JSON.stringify(u))
    return true
  }

  const signUp = async (name: string, email: string, password: string): Promise<boolean> => {
    if (!name || !email || !password) return false
    const stored = sessionStorage.getItem("healthagg_accounts")
    const accounts: Record<string, { name: string; password: string }> = stored ? JSON.parse(stored) : {}
    if (accounts[email]) return false
    accounts[email] = { name, password }
    sessionStorage.setItem("healthagg_accounts", JSON.stringify(accounts))
    const u = { name, email }
    setUser(u)
    sessionStorage.setItem("healthagg_user", JSON.stringify(u))
    return true
  }

  const signOut = () => {
    setUser(null)
    sessionStorage.removeItem("healthagg_user")
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
