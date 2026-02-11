"use client"

import Link from "next/link"
import { HeartPulse, Menu, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"

export function Navbar() {
  const { user, isAuthenticated, signOut } = useAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container px-4 mx-auto h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <HeartPulse className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">HealthAgg</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="#" className="hover:text-primary transition-colors">
            Find Doctors
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            Lab Tests
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            Medicines
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            AI Checker
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <div className="hidden md:flex items-center gap-2 text-sm text-foreground">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">{user.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl gap-2 text-muted-foreground hover:text-foreground"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" /> <span className="hidden md:inline">Sign Out</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hidden md:flex gap-2 rounded-xl">
                <User className="h-4 w-4" /> Sign In
              </Button>
              <Button size="sm" className="rounded-xl px-5 font-bold">
                Get Started
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </nav>
  )
}
