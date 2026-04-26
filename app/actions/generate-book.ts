"use server"

export async function generateBook(prompt: string, category: string, bookLength = "medium"): Promise<any> {
  try {
    // Check if API key is available
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not defined in environment variables")
    }

    // Determine chapter count, content length, and token allocation based on book length
    let minChapters, maxChapters, chapterMaxTokens, wordCount, pagesEstimate, wordsPerChapter
    let max_tokens = 32768
    
    switch (bookLength) {
      case "short":
        minChapters = 3
        maxChapters = 5
        chapterMaxTokens = max_tokens // Tokens per chapter
        wordCount = "5,000-8,000"
        pagesEstimate = "12"
        wordsPerChapter = "1,500-2,000"
        break
      case "medium":
        minChapters = 5
        maxChapters = 8
        chapterMaxTokens = max_tokens // Tokens per chapter
        wordCount = "10,000-15,000"
        pagesEstimate = "22"
        wordsPerChapter = "2,000-2,500"
        break
      case "long":
        minChapters = 8
        maxChapters = 12
        chapterMaxTokens = max_tokens // Tokens per chapter
        wordCount = "15,000-20,000"
        pagesEstimate = "32"
        wordsPerChapter = "2,000-3,000"
        break
      default:
        minChapters = 5
        maxChapters = 8
        chapterMaxTokens = 15000 // Tokens per chapter
        wordCount = "10,000-15,000"
        pagesEstimate = "22"
        wordsPerChapter = "2,000-2,500"
    }

    const chapterCount = `${minChapters}-${maxChapters}`
    const expectedChapters = bookLength === "long" ? maxChapters : minChapters

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
    
    // First generate book structure
    console.log("Generating book structure...")
    
    const structurePrompt = `You are a professional book author specializing in ${category} books.
Create a detailed outline for a book based on the following prompt: "${prompt}"

Your outline MUST include:
1. A compelling title and subtitle
2. A proper book structure with EXACTLY ${expectedChapters} chapters
3. A detailed description for the cover design
4. Compelling back cover text

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
  "chapterSummaries": [
    {
      "title": "Chapter 1: Title",
      "summary": "Brief 2-3 sentence summary of what this chapter will cover"
    }
    ...more chapters...
  ]
}

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON output with NO additional text before or after.
2. Do NOT include any AI thoughts, explanations, or meta-commentary in your response.
3. The JSON must be perfectly valid and parseable.

IMPORTANT: You MUST create EXACTLY ${expectedChapters} chapters.
REMEMBER: Your entire response must be a valid JSON object that can be parsed with JSON.parse().`

    // Call API to get book structure with retry for network errors
    let bookStructure;
    try {
      bookStructure = await makeApiRequest(structurePrompt, prompt, 10000, "json");
    } catch (error) {
      console.error("Failed to generate book structure:", error);
      throw new Error("Failed to generate book structure. Please try again.");
    }
    
    // Create empty chapters array with the structure
    const bookContent = {
      ...bookStructure,
      chapters: []
    }
    
    // Delete chapterSummaries as we don't need them in the final output
    const chapterSummaries = bookStructure.chapterSummaries;
    delete bookContent.chapterSummaries;
    
    // Generate each chapter one by one
    console.log("Starting chapter-by-chapter generation...");
    
    // Track rate limit approaches
    let requestCount = 0;
    const MAX_REQUESTS_BEFORE_COOLDOWN = 5; // Adjust based on your API's limits
    
    // Generate each chapter
    for (let chapterIndex = 0; chapterIndex < expectedChapters; chapterIndex++) {
      // Check if we need to apply rate limit cooldown
      if (requestCount >= MAX_REQUESTS_BEFORE_COOLDOWN) {
        console.log("Approaching rate limit, pausing for cooldown...");
        await new Promise(resolve => setTimeout(resolve, 62000)); // 1 minute and 2 seconds
        requestCount = 0;
        console.log("Cooldown complete, resuming generation...");
      }
      
      // Special handling for the final chapter
      const isFinalChapter = chapterIndex === expectedChapters - 1;
      
      console.log(`Generating chapter ${chapterIndex + 1} of ${expectedChapters}...${isFinalChapter ? " (Final chapter)" : ""}`);
      
      const chapterTitle = chapterSummaries[chapterIndex].title;
      const chapterSummary = chapterSummaries[chapterIndex].summary;
      
      // Generate context from previous chapters if needed
      let previousChaptersContext = "";
      if (chapterIndex > 0) {
        // Add a brief summary of previous chapters for continuity
        previousChaptersContext = "Previous chapters summary:\n";
        for (let i = 0; i < chapterIndex; i++) {
          previousChaptersContext += `${chapterSummaries[i].title}: ${chapterSummaries[i].summary}\n`;
        }
      }
      
      // Create chapter generation prompt
      const chapterPrompt = `You are continuing to write a ${category} book titled "${bookContent.title}".

You are now writing Chapter ${chapterIndex + 1}: "${chapterTitle.replace(/^Chapter \d+: /, "")}".

This chapter should cover: ${chapterSummary}

${styleGuidance}

${previousChaptersContext}

${categoryGuidance}

Write a complete, engaging chapter with approximately ${wordsPerChapter} words.
Include proper paragraph breaks, dialogue (if appropriate), and narrative flow.
Your writing should be professional quality, with varied sentence structure and appropriate pacing.

${chapterIndex === 0 ? "This is the first chapter, so introduce the main elements of the story or subject." : ""}
${chapterIndex === expectedChapters - 1 ? "This is the final chapter, so provide a satisfying conclusion to the book." : ""}

CRITICAL INSTRUCTIONS:
1. ONLY output the pure chapter content as if it was written by a professional author. 
2. NEVER include ANY meta-commentary, explanations, notes about your process, or AI thoughts.
3. Do NOT start with phrases like "Chapter X begins with..." or "In this chapter..."
4. Do NOT end with comments like "This concludes the chapter" or "Next chapter will..."
5. Act EXACTLY like a professional human author who is writing directly in the book's style.
6. Just write the raw narrative text with no headers, formatting instructions, or explanations.
7. UNDER NO CIRCUMSTANCES include text like "As an AI" or "As a language model" or anything similar.

IMPORTANT: ONLY output the raw text content for this chapter. Do NOT include any formatting, headers, or explanations.`

      // Generate this chapter's content
      try {
        // For the final chapter, we'll add an extra delay to ensure API readiness
        if (isFinalChapter) {
          console.log("Preparing for final chapter generation, adding a precautionary delay...");
          await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second pause before final chapter
        }
        
        // Use a slightly lower token limit for the final chapter to reduce timeout risk
        const adjustedTokenLimit = isFinalChapter 
          ? Math.floor(chapterMaxTokens * 0.8)  // 80% of the regular token limit for final chapter
          : chapterMaxTokens;
        
        console.log(`Using token limit of ${adjustedTokenLimit} for chapter ${chapterIndex + 1}`);
        
        const chapterContent = await makeApiRequest(chapterPrompt, prompt, adjustedTokenLimit, "completion");
        requestCount++;
        
        // Add chapter to book
        bookContent.chapters.push({
          title: chapterTitle,
          content: chapterContent
        });
      } catch (error) {
        console.error(`Failed to generate chapter ${chapterIndex + 1}:`, error);
        
        // Special handling for final chapter failure - create a reasonable conclusion
        const fallbackContent = isFinalChapter
          ? `As the story drew to a close, all the narrative threads woven throughout the previous chapters found their resolution. The journey that began in the opening pages reached its natural conclusion, leaving readers with a sense of completion and satisfaction.\n\nWhile the ending might not be what everyone expected, it remained true to the themes and character arcs established throughout. The final moments provided both closure and a sense that the world of the story continued beyond these pages.\n\n[Note: This is a placeholder conclusion. The complete final chapter can be regenerated later.]`
          : `[This chapter failed to generate. Please try regenerating this chapter later.]`;
        
        // Add placeholder chapter if generation fails
        bookContent.chapters.push({
          title: chapterTitle,
          content: fallbackContent
        });
        
        // If the final chapter failed, add a small delay before continuing
        if (isFinalChapter) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      // --- Progress callback for chapter generation ---
      if (typeof window !== "undefined" && typeof (window as any).chapterGenerationProgress === "function") {
        const percent = Math.round(((chapterIndex + 1) / expectedChapters) * 100);
        (window as any).chapterGenerationProgress(percent);
      }

      // Allow a break between chapters to avoid hitting rate limits
      if (chapterIndex < expectedChapters - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second pause between chapters
      }
    }
    
    // Add keyboard navigation metadata
    bookContent.metadata = {
      navigationEnabled: true,
      keyboardShortcuts: {
        nextPage: "Right Arrow",
        previousPage: "Left Arrow"
      }
    };

    return bookContent;
  } catch (error) {
    console.error("Error generating book:", error);
    throw error;
  }
}

// Helper function to make API calls with robust error handling
async function makeApiRequest(systemPrompt: string, userPrompt: string, maxTokens: number, responseType: "json" | "completion" = "json"): Promise<any> {
  const MAX_RETRIES = 3;
  let retryCount = 0;
  
  while (retryCount <= MAX_RETRIES) {
    try {
      console.log(`API request (Attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
      
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: maxTokens,
          response_format: responseType === "json" ? { type: "json_object" } : undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // If rate limited, wait and retry (pause for 62 seconds)
        if (response.status === 429) {
          console.log("Rate limited, waiting for 62 seconds...");
          await new Promise(resolve => setTimeout(resolve, 62000));
          continue; // Try again
        }
        throw new Error(`API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const generatedText = data.choices[0]?.message?.content;

      if (!generatedText) {
        throw new Error("No response received from API");
      }

      console.log("Response received successfully");
      
      if (responseType === "completion") {
        return generatedText;
      }

      // Try to parse the JSON response
      try {
        const parsedResponse = JSON.parse(generatedText);
        
        // For book structure, ensure we have the author
        if (parsedResponse.title) {
          parsedResponse.author = "Bookoustic AI";
        }
        
        return parsedResponse;
      } catch (parseError) {
        // Try to extract JSON from the text
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (extractError) {
            // If we still can't parse it, throw an error
            throw new Error("Failed to parse API response as JSON");
          }
        }
        throw new Error("Failed to parse API response as JSON");
      }
    } catch (error: any) {
      // Network or API error
      console.error(`Request failed:`, error.message || error);
      
      // Retry for network errors
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Max retries reached
      throw error;
    }
  }
  
  throw new Error("Maximum retry attempts reached");
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
