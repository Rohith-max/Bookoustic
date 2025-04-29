"use client"

import { getFontForCategory } from "@/lib/book-fonts"
import { BookOpen } from "lucide-react"

interface TableOfContentsProps {
  book: any
  category: string
  onNavigate: (chapterIndex: number) => void
}

export default function TableOfContents({ book, category, onNavigate }: TableOfContentsProps) {
  const font = getFontForCategory(category)

  return (
    <div className="table-of-contents h-full w-full flex flex-col p-8 vintage-paper">
      <h2
        className="text-3xl font-bold mb-8 text-center text-amber-900 dark:text-amber-200"
        style={{
          fontFamily: `"${font.title}", serif`,
          fontWeight: font.titleWeight,
        }}
      >
        Table of Contents
      </h2>

      <div className="mx-auto w-16 h-1 bg-amber-700/30 dark:bg-amber-700/30 mb-8 rounded"></div>

      <div className="space-y-2 max-w-xl mx-auto w-full">
        {book.tableOfContents &&
          book.tableOfContents.map((item: string, index: number) => (
            <div
              key={index}
              className="flex justify-between items-center border-b border-amber-800/20 dark:border-amber-700/20 pb-2 group cursor-pointer hover:bg-amber-100/40 dark:hover:bg-amber-900/20 px-3 py-2 rounded"
              onClick={() => onNavigate(index)}
            >
              <div className="flex items-center space-x-3">
                <BookOpen className="h-4 w-4 text-amber-700/60 dark:text-amber-500/60 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors" />
                <span 
                  className="text-amber-900 dark:text-amber-200 group-hover:text-amber-800 dark:group-hover:text-amber-100 transition-colors"
                  style={{ fontFamily: `"${font.body}", serif` }}
                >
                  {item}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-px flex-grow w-12 bg-amber-800/20 dark:bg-amber-700/20"></div>
                <span className="text-amber-800/70 dark:text-amber-500/70 text-sm font-serif">
                  {index + 1}
                </span>
              </div>
            </div>
          ))}
      </div>

      <div className="mt-auto pt-6 flex justify-center">
        <div className="w-32 h-8 bg-[url('/ornamental-flourish.png')] bg-contain bg-no-repeat bg-center opacity-50"></div>
      </div>
    </div>
  )
}
