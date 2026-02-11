"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RotateCcw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] Application error:", error)
  }, [error])

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-2">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Something went wrong</h2>
          <p className="text-muted-foreground">
            We encountered an unexpected error while processing your request. Please try again or contact support if the
            problem persists.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="default" size="lg" onClick={() => reset()} className="rounded-xl font-semibold gap-2">
            <RotateCcw className="h-4 w-4" /> Try again
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => (window.location.href = "/")}
            className="rounded-xl font-semibold"
          >
            Return Home
          </Button>
        </div>
      </div>
    </div>
  )
}
