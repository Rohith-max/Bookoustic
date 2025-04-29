"use server"

export async function generateBook(prompt: string, category: string, bookLength = "medium"): Promise<any> {
  try {
    // Check if API key is available
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not defined in environment variables")
    }

    // Determine chapter count, content length, and token allocation based on book length
    let chapterCount, maxTokens, wordCount, pagesEstimate, wordsPerChapter, minChapters, maxChapters

    switch (bookLength) {
      case "short":
        minChapters = 3
        maxChapters = 5
        maxTokens = 20000
        wordCount = "5,000-8,000"
        pagesEstimate = "12"
        wordsPerChapter = "1,500-2,000"
        break
      case "medium":
        minChapters = 5
        maxChapters = 8
        maxTokens = 35000
        wordCount = "10,000-15,000"
        pagesEstimate = "22"
        wordsPerChapter = "2,000-2,500"
        break
      case "long":
        minChapters = 8
        maxChapters = 12
        maxTokens = 50000
        wordCount = "15,000-20,000"
        pagesEstimate = "32"
        wordsPerChapter = "2,000-3,000"
        break
      default:
        minChapters = 5
        maxChapters = 8
        maxTokens = 35000
        wordCount = "10,000-15,000"
        pagesEstimate = "22"
        wordsPerChapter = "2,000-2,500"
    }

    chapterCount = `${minChapters}-${maxChapters}`

    // Extract potential character perspective from prompt
    const characterPerspective = extractCharacterPerspective(prompt)
    let styleGuidance = ""

    if (characterPerspective) {
      styleGuidance = `
CRITICAL: This book MUST be written from the FIRST-PERSON perspective of ${characterPerspective}. 
You MUST fully embody their unique voice, vocabulary, mannerisms, and thought patterns throughout the ENTIRE text.

If this is a known character (fictional or real), you MUST accurately reflect their personality traits in the writing style:
- If they're childlike (like Luffy from One Piece), use simple vocabulary, express wonder, and write with enthusiasm and naivety
- If they're scholarly, use sophisticated language and reference academic concepts
- If they're humorous, incorporate jokes and playful language
- If they're poetic, use metaphors and vivid imagery

The reader should IMMEDIATELY recognize who is "speaking" from the writing style alone. The character's personality must shine through in EVERY paragraph.

For example:
- Luffy (One Piece) would write: "Man, being Pirate King is the COOLEST thing ever! I get to have all these awesome adventures with my crew. Meat tastes even better when you're the king! Shishishi!"
- Sherlock Holmes would write: "Upon careful observation of the facts presented, I deduced the only logical conclusion. Watson, as usual, failed to notice the telling mud pattern on the suspect's boots."
- Ernest Hemingway would write in short, direct sentences. No fluff. Just facts. The way it happened. The way it was.

DO NOT simply write ABOUT the character - write AS the character, with their exact speech patterns, vocabulary, and worldview.
`
    } else if (category === "Autobiography" || category === "Memoir") {
      // For autobiographies without a specific character, use a first-person perspective
      styleGuidance = `
This book MUST be written in the FIRST-PERSON perspective, as a genuine autobiography or memoir.
The narrator should have a distinct personality and voice that remains consistent throughout.
Include personal reflections, emotional reactions, and subjective interpretations of events.
Use "I" and "my" throughout the text, and write as if the narrator is sharing their life story directly with the reader.
`
    }

    // Add category-specific guidance
    const categoryGuidance = getCategorySpecificGuidance(category)

    const systemPrompt = `You are a professional book author specializing in ${category} books.
Write a complete, professional book based on the following prompt.

Your book MUST include:
1. A compelling title and subtitle
2. A proper book structure with EXACTLY ${bookLength === "long" ? maxChapters : minChapters} chapters - NO LESS
3. Each chapter MUST be SUBSTANTIAL with ${wordsPerChapter} words per chapter
4. The total book should be approximately ${wordCount} words (${pagesEstimate} pages)
5. An engaging introduction/prologue
6. A satisfying conclusion/epilogue
7. A detailed description for the cover design
8. Compelling back cover text

${styleGuidance}

${categoryGuidance}

Format your response as a valid JSON object with this exact structure:
{
  "title": "Main Title",
  "subtitle": "Subtitle if applicable",
  "author": "Bookoustic AI",
  "coverDescription": "A detailed description of what should be on the cover",
  "backCoverText": "The text that would appear on the back cover of the book",
  "tableOfContents": ["Chapter 1: Title", "Chapter 2: Title", ...],
  "chapters": [
    {
      "title": "Chapter title",
      "content": "Full chapter content with paragraphs separated by newlines. Each chapter MUST be ${wordsPerChapter} words, with proper paragraph breaks, dialogue formatting, and narrative flow."
    },
    ...more chapters...
  ]
}

IMPORTANT WRITING GUIDELINES:
1. QUANTITY: Each chapter MUST be ${wordsPerChapter} words. This is CRITICAL. Short chapters will make the book feel incomplete.
2. QUALITY: Ensure proper grammar, punctuation, and paragraph structure throughout
3. VARIETY: Vary sentence length and structure for readability
4. VOCABULARY: Use appropriate vocabulary for the genre and target audience
5. BALANCE: Include dialogue, description, and narrative in balanced proportions
6. CONSISTENCY: Maintain consistent point of view and tense throughout
7. FLOW: Ensure chapters flow logically and build upon each other
8. PACING: Incorporate appropriate pacing - slower for character development, faster for action
9. STRUCTURE: Use chapter breaks at natural transition points in the narrative
10. COMPLETENESS: You MUST generate ALL ${bookLength === "long" ? maxChapters : minChapters} chapters with full content - do not stop early

Make the book substantial - use the full token limit available to create a rich, detailed work.
Do NOT use markdown formatting or special characters - use plain text only.
The book should be appropriate for the ${category} genre in style, tone, and content.
REMEMBER: Your entire response must be a valid JSON object that can be parsed with JSON.parse().
CRITICAL: You MUST generate ALL ${bookLength === "long" ? maxChapters : minChapters} chapters with full content.`

    // Make a direct API call to Groq
    console.log("Making API call to Groq...")
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-r1-distill-llama-70b", // Using a more capable model
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
        response_format: { type: "json_object" }, // Force JSON response format
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API Error Response:", errorText)
      throw new Error(`Groq API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const generatedText = data.choices[0]?.message?.content

    if (!generatedText) {
      throw new Error("No response received from Groq API")
    }

    console.log("Raw API response received, length:", generatedText.length)
    console.log("Response preview:", generatedText.substring(0, 200) + "...")

    // Try to parse the JSON response
    try {
      const parsedBook = JSON.parse(generatedText)

      // Validate that we have all the chapters
      if (!parsedBook.chapters || !Array.isArray(parsedBook.chapters)) {
        throw new Error("Invalid book format: missing chapters array")
      }

      // Always set the author to "Bookoustic AI" regardless of what the API returns
      parsedBook.author = "Bookoustic AI";

      // Check if we have the expected number of chapters
      const expectedChapters = bookLength === "long" ? maxChapters : minChapters
      if (parsedBook.chapters.length < expectedChapters * 0.8) {
        // Allow for some flexibility (80% of expected)
        console.warn(`Warning: Expected ${expectedChapters} chapters but only got ${parsedBook.chapters.length}`)
      }

      // Ensure table of contents matches chapters
      if (parsedBook.tableOfContents && parsedBook.tableOfContents.length !== parsedBook.chapters.length) {
        // Fix table of contents to match chapters
        parsedBook.tableOfContents = parsedBook.chapters.map(
          (chapter: any, index: number) => `Chapter ${index + 1}: ${chapter.title.replace(/^Chapter \d+: /, "")}`,
        )
      }

      return parsedBook
    } catch (parseError) {
      console.error("JSON parsing error:", parseError)

      // Try to extract JSON from the text
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0])
        } catch (extractError) {
          console.error("Failed to extract JSON:", extractError)
        }
      }

      // If we still can't parse it, throw an error
      throw new Error("Failed to parse API response as JSON. Please try again.")
    }
  } catch (error) {
    console.error("Error generating book:", error)
    throw error
  }
}

// Function to extract potential character perspective from prompt
function extractCharacterPerspective(prompt: string): string | null {
  // Look for phrases that indicate a character perspective
  const perspectivePatterns = [
    /from the perspective of ([^,.]+)/i,
    /in the voice of ([^,.]+)/i,
    /written by ([^,.]+)/i,
    /as if ([^,.]+) wrote it/i,
    /in ([^,.]+)'s style/i,
    /from ([^,.]+)'s point of view/i,
    /as ([^,.]+) would write/i,
    /in the style of ([^,.]+)/i,
  ]

  for (const pattern of perspectivePatterns) {
    const match = prompt.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return null
}

// Define the type for the guidance map
type GuidanceMap = {
  [key: string]: string;
};

// Function to get category-specific guidance
function getCategorySpecificGuidance(category: string): string {
  const guidanceMap: GuidanceMap = {
    Fiction: `
For Fiction, create a compelling narrative with well-developed characters and an engaging plot.
Include rich descriptions, meaningful dialogue, and a satisfying story arc.
Establish a clear setting, conflict, and resolution while maintaining reader interest throughout.
`,
    "Science Fiction": `
For Science Fiction, create a world with innovative technology, scientific concepts, or futuristic settings.
Explore the implications of scientific or technological advancements on society and individuals.
Balance technical explanations with character development and plot progression.
Include thought-provoking "what if" scenarios that challenge readers' perspectives.
`,
    Fantasy: `
For Fantasy, create a richly detailed world with its own rules, magic systems, creatures, or mythologies.
Develop unique cultures, landscapes, and histories that feel authentic and immersive.
Balance world-building with character development and plot progression.
Include elements of wonder, adventure, and the extraordinary while maintaining internal consistency.
`,
    Mystery: `
For Mystery, create an intriguing puzzle or crime that needs solving.
Plant subtle clues and red herrings throughout the narrative.
Develop a detective or protagonist with unique methods of investigation.
Build tension and suspense, leading to a satisfying revelation that readers could theoretically have predicted.
`,
    Thriller: `
For Thriller, create high-stakes situations with urgent pacing and intense conflict.
Develop a protagonist facing significant threats or challenges.
Build tension through time constraints, dangerous antagonists, or moral dilemmas.
Include plot twists and moments of suspense that keep readers on edge.
`,
    Horror: `
For Horror, create an atmosphere of dread, fear, or unease throughout the narrative.
Develop threats that are psychologically disturbing, supernatural, or physically terrifying.
Build tension through the unknown, isolation, vulnerability, or the corruption of the familiar.
Explore primal fears while creating emotional investment in the characters' survival.
`,
    Romance: `
For Romance, develop two main characters with strong chemistry and compelling reasons to be drawn to each other.
Create meaningful obstacles that prevent their immediate union.
Show character growth as they overcome these obstacles individually and together.
Balance emotional intimacy with conflict, leading to a satisfying resolution of their relationship.
`,
    "Historical Fiction": `
For Historical Fiction, research and accurately portray a specific time period's social norms, technology, and events.
Weave fictional characters and plots seamlessly into the historical context.
Balance historical detail with engaging storytelling without overwhelming readers with facts.
Provide insight into how historical circumstances affected individuals' lives and choices.
`,
    Autobiography: `
For this Autobiography, write in a compelling first-person voice that feels authentic and personal.
Share meaningful life experiences, challenges, triumphs, and lessons learned.
Include vivid sensory details and emotional reactions to make experiences come alive.
Balance vulnerability with insight, showing both struggles and growth throughout the narrative.
The narrator should have a distinct personality that comes through in their writing style, word choice, and observations.
`,
    Memoir: `
For this Memoir, focus on specific themes or periods in the narrator's life rather than a comprehensive biography.
Write in an intimate first-person voice that draws readers into personal experiences.
Use sensory details, dialogue, and scene-setting to make memories vivid and immediate.
Reflect on how these experiences shaped the narrator's identity, beliefs, or life path.
The narrator's unique personality should be evident in their writing style, observations, and reflections.
`,
    "Self-Help": `
For Self-Help, identify specific problems or challenges readers might face.
Provide clear, actionable advice and strategies for addressing these challenges.
Support recommendations with research, examples, case studies, or personal experiences.
Include exercises, reflection questions, or step-by-step instructions for implementing advice.
`,
    "Children's": `
For Children's literature, use age-appropriate language, concepts, and themes.
Create engaging characters that children can relate to or aspire to be like.
Include elements of wonder, humor, or adventure to maintain interest.
Incorporate subtle lessons or values without being overly didactic.
`,
    "Young Adult": `
For Young Adult fiction, create protagonists dealing with issues relevant to teen/young adult experiences.
Balance coming-of-age themes with engaging plots and relatable characters.
Address complex topics in accessible ways without condescension.
Include authentic dialogue and perspectives that resonate with younger readers.
`,
  }

  return (
    guidanceMap[category] ||
    `
For this ${category} book, focus on the unique elements that define this genre.
Create content that meets reader expectations while offering fresh perspectives or approaches.
Balance genre conventions with innovative storytelling to engage readers.
Develop depth in characters, settings, and themes appropriate to ${category} literature.
`
  )
}
