"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const isSignUp = mode === "sign-up"

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setLoading(true)
    const result = isSignUp
      ? await authClient.signUp.email({ name, email, password })
      : await authClient.signIn.email({ email, password })
    setLoading(false)
    if (result.error) {
      setError("Unable to authenticate. Check your details and try again.")
      return
    }
    router.push("/")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isSignUp && <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />}
      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={loading}>{loading ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}</button>
    </form>
  )
}
