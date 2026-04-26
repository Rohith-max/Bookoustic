"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function ApiTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const testApi = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/test-groq", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${await response.text()}`)
      }

      const data = await response.json()
      setResult(data.result)
    } catch (err: any) {
      console.error("API test error:", err)
      setError(err.message || "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>API Test</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {result && <div className="bg-gray-100 p-4 rounded">{result}</div>}
      </CardContent>
      <CardFooter>
        <Button onClick={testApi} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing API...
            </>
          ) : (
            "Test Groq API"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
