import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Check if API key is available
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY is not defined in environment variables" }, { status: 500 })
    }

    // Make a direct API call to Groq
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // Using a smaller model for quick testing
        messages: [
          { role: "system", content: "You are a helpful assistant. Respond with valid JSON." },
          { role: "user", content: "Return a JSON object with your greeting and the current date." },
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      return NextResponse.json({ error: `Groq API error: ${response.status} ${errorData}` }, { status: 500 })
    }

    const data = await response.json()
    const generatedText = data.choices[0]?.message?.content

    // Try to parse the response as JSON
    let parsedResult
    try {
      parsedResult = JSON.parse(generatedText)
    } catch (error) {
      // If parsing fails, return the raw text
      parsedResult = { raw: generatedText }
    }

    // Return the response
    return NextResponse.json({
      result: parsedResult || "No response",
      rawText: generatedText,
    })
  } catch (error: any) {
    console.error("Error testing Groq API:", error)
    return NextResponse.json({ error: `Failed to test Groq API: ${error.message || "Unknown error"}` }, { status: 500 })
  }
}
