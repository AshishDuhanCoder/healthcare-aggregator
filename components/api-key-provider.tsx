"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type ApiKeyContextType = {
  apiKey: string | null
  provider: string
  setApiKey: (key: string, provider: string) => void
  removeApiKey: () => void
  hasApiKey: boolean
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined)

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null)
  const [provider, setProvider] = useState<string>("gemini")

  useEffect(() => {
    const storedKey = sessionStorage.getItem("healthagg_api_key")
    const storedProvider = sessionStorage.getItem("healthagg_api_provider")
    if (storedKey) {
      setApiKeyState(storedKey)
      setProvider(storedProvider || "gemini")
    }
  }, [])

  const setApiKey = (key: string, prov: string) => {
    setApiKeyState(key)
    setProvider(prov)
    sessionStorage.setItem("healthagg_api_key", key)
    sessionStorage.setItem("healthagg_api_provider", prov)
  }

  const removeApiKey = () => {
    setApiKeyState(null)
    setProvider("gemini")
    sessionStorage.removeItem("healthagg_api_key")
    sessionStorage.removeItem("healthagg_api_provider")
  }

  return (
    <ApiKeyContext.Provider value={{ apiKey, provider, setApiKey, removeApiKey, hasApiKey: !!apiKey }}>
      {children}
    </ApiKeyContext.Provider>
  )
}

export function useApiKey() {
  const context = useContext(ApiKeyContext)
  if (!context) throw new Error("useApiKey must be used within ApiKeyProvider")
  return context
}
