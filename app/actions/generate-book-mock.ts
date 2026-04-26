"use server"

// This is a mock version of the generate-book function for testing
export async function generateBookMock(prompt: string, category: string, bookLength = "medium"): Promise<any> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Adjust content based on book length
  let chapterCount = 3
  let contentLength = 1
  let paragraphsPerChapter = 5

  switch (bookLength) {
    case "short":
      chapterCount = 8
      contentLength = 2
      paragraphsPerChapter = 10
      break
    case "medium":
      chapterCount = 15
      contentLength = 3
      paragraphsPerChapter = 20
      break
    case "long":
      chapterCount = 25
      contentLength = 4
      paragraphsPerChapter = 30
      break
  }

  // Generate chapters
  const chapters = []
  const tableOfContents = []

  for (let i = 1; i <= chapterCount; i++) {
    const chapterTitle = `Chapter ${i}: ${getRandomTitle()}`
    tableOfContents.push(chapterTitle)

    let content = ""
    for (let j = 0; j < paragraphsPerChapter * contentLength; j++) {
      content += getRandomParagraph() + "\n\n"
    }

    chapters.push({
      title: chapterTitle,
      content: content,
    })
  }

  // Return a mock book
  return {
    title: `The ${getRandomAdjective()} ${getRandomNoun()}`,
    subtitle: `A Tale of ${getRandomNoun()}`,
    author: `AI Author (${category} Specialist)`,
    coverDescription: `A ${getRandomAdjective().toLowerCase()} scene featuring ${getRandomNoun().toLowerCase()} with ${getRandomNoun().toLowerCase()} in the background.`,
    backCoverText: `This ${category.toLowerCase()} book explores the themes of ${getRandomNoun().toLowerCase()} and ${getRandomNoun().toLowerCase()}. Join the protagonist on an incredible journey through ${getRandomAdjective().toLowerCase()} lands, discovering the true meaning of ${getRandomNoun().toLowerCase()} and ${getRandomNoun().toLowerCase()} along the way.`,
    tableOfContents: tableOfContents,
    chapters: chapters,
  }
}

// Helper functions to generate random content
function getRandomTitle() {
  const titles = [
    "The Beginning",
    "The Challenge",
    "The Discovery",
    "The Journey",
    "The Revelation",
    "The Confrontation",
    "The Resolution",
    "The Transformation",
    "The Awakening",
    "The Return",
    "The Decision",
    "The Mystery",
  ]
  return titles[Math.floor(Math.random() * titles.length)]
}

function getRandomParagraph() {
  const paragraphs = [
    "It was a bright morning when our story began. The sun was shining through the curtains, casting long shadows across the wooden floor. Our protagonist awoke with a sense of purpose, knowing that today would be different from all the days that came before. There was something in the air, a feeling of anticipation that couldn't be ignored.",
    "The path ahead was not going to be easy. Obstacles loomed large on the horizon, casting doubt on whether success was even possible. But our hero was determined. With each step forward, their resolve only strengthened. The challenges that lay ahead were not just barriers to overcome, but opportunities to grow and learn.",
    "After days of struggle and nights of doubt, the breakthrough finally came. It wasn't what anyone expected, least of all our protagonist. The discovery wasn't something tangible that could be held in one's hands. It was a realization, an understanding that had been there all along, waiting to be acknowledged.",
    "The conversation lasted well into the night, voices rising and falling like the tide. Words were exchanged, some harsh, others gentle, but all necessary. By the time the first light of dawn crept through the window, a new understanding had been reached. Nothing would be the same again.",
    "The landscape stretched out before them, vast and untamed. Mountains rose in the distance, their peaks shrouded in mist. Forests carpeted the valleys, dark and mysterious. And somewhere out there, hidden from view, lay the answer they had been seeking for so long.",
    "Time seemed to stand still in that moment. The world around them faded away, leaving only the two of them, face to face at last. Words failed, but they weren't needed. In the silence, everything that needed to be said was understood. A lifetime of questions answered in a single glance.",
    '"I never thought it would come to this," she said, her voice barely above a whisper. The weight of her words hung in the air between them, heavy with implication. He wanted to reach out, to bridge the gap that had formed, but something held him back. Perhaps it was pride, or perhaps it was fear of what might happen if he did.',
    "The old building stood at the end of the street, its windows dark and empty like the eye sockets of a skull. No one had lived there for years, decades even, yet stories about it persisted. Children dared each other to touch its peeling paint, to peer through its dusty windows. Adults crossed to the other side of the street when passing by, though few would admit why.",
    "Rain fell in sheets, drumming against the roof with a rhythm that might have been soothing under different circumstances. But tonight, each drop felt like an accusation, a reminder of promises broken and truths concealed. She sat by the window, watching rivulets of water race down the glass, each one charting its own unique path to the bottom.",
    "The letter arrived on Tuesday, unremarkable in its plain white envelope, distinguished only by the foreign stamps in the corner. It sat on the hall table for hours before anyone thought to open it. How could they have known that its contents would change everything? That the words written on those pages would set in motion events that could not be undone?",
    "Laughter echoed through the room, genuine and uninhibited. It had been so long since they had shared a moment like this, a moment of pure joy unmarred by the complications of their past. For just a little while, they could pretend that nothing had changed, that they were still the same people they had been before life had intervened.",
    "The decision wasn't an easy one, but then again, the important ones rarely are. It meant leaving behind everything familiar, everything safe, and stepping into the unknown. But staying meant accepting a life half-lived, a future constrained by fear and regret. When viewed that way, there was really no choice at all.",
  ]
  return paragraphs[Math.floor(Math.random() * paragraphs.length)]
}

function getRandomAdjective() {
  const adjectives = [
    "Mysterious",
    "Enchanted",
    "Hidden",
    "Lost",
    "Ancient",
    "Forgotten",
    "Secret",
    "Magical",
    "Eternal",
    "Celestial",
    "Shadowy",
    "Radiant",
  ]
  return adjectives[Math.floor(Math.random() * adjectives.length)]
}

function getRandomNoun() {
  const nouns = [
    "Journey",
    "Kingdom",
    "Forest",
    "Mountain",
    "River",
    "Castle",
    "Temple",
    "Garden",
    "Island",
    "Village",
    "City",
    "Path",
    "Quest",
    "Adventure",
    "Mystery",
    "Secret",
    "Legend",
    "Tale",
    "Dream",
    "Destiny",
    "Prophecy",
    "Artifact",
    "Treasure",
    "Portal",
    "Realm",
    "Dimension",
    "Warrior",
    "Wizard",
    "Oracle",
    "Sorcerer",
  ]
  return nouns[Math.floor(Math.random() * nouns.length)]
}
