"use client"

import type React from "react"
import { useState } from "react"
import { HeartPulse, Mail, Lock, User, AlertCircle, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"

export function SignInGate() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setError("Please enter your name.")
          setIsLoading(false)
          return
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters.")
          setIsLoading(false)
          return
        }
        const success = await signUp(name, email, password)
        if (!success) {
          setError("An account with this email already exists. Please sign in.")
        }
      } else {
        const success = await signIn(name, email, password)
        if (!success) {
          setError("Invalid email or password. Please try again.")
        }
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />

      <Card className="w-full max-w-md shadow-2xl border-primary/10">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-2xl">
              <HeartPulse className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {mode === "signin" ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-balance">
            {mode === "signin"
              ? "Sign in to access HealthAgg's AI-powered healthcare platform."
              : "Join HealthAgg to find the best healthcare at the best prices."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                  required
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 rounded-xl"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 rounded-xl"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-xl">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/20"
              disabled={isLoading}
            >
              {isLoading
                ? "Please wait..."
                : mode === "signin"
                  ? "Sign In"
                  : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin")
                  setError("")
                }}
                className="text-primary font-semibold hover:underline"
              >
                {mode === "signin" ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
