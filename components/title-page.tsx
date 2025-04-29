import { getFontForCategory } from "@/lib/book-fonts"

interface TitlePageProps {
  book: any
  category: string
}

export default function TitlePage({ book, category }: TitlePageProps) {
  const font = getFontForCategory(category)

  return (
    <div className="title-page h-full w-full flex flex-col items-center justify-center p-8 vintage-paper">
      <div className="text-center max-w-lg relative">
        {/* Decorative ornament at top */}
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
          <div className="w-32 h-12 bg-[url('/ornamental-divider.png')] bg-contain bg-no-repeat bg-center opacity-60"></div>
        </div>
        
        <h1
          className="text-4xl md:text-5xl font-bold mb-6 text-amber-900 dark:text-amber-200"
          style={{
            fontFamily: `"${font.title}", serif`,
            fontWeight: font.titleWeight,
          }}
        >
          {book.title}
        </h1>

        {book.subtitle && (
          <h2
            className="text-xl md:text-2xl mb-12 text-amber-800/80 dark:text-amber-300/80 italic"
            style={{
              fontFamily: `"${font.title}", serif`,
              fontWeight: font.titleWeight,
            }}
          >
            {book.subtitle}
          </h2>
        )}

        <div className="my-16 border-t border-b border-amber-900/20 dark:border-amber-200/20 py-4">
          <p
            className="text-xl text-amber-800 dark:text-amber-300"
            style={{
              fontFamily: `"${font.body}", serif`,
            }}
          >
            By {book.author}
          </p>
        </div>

        {/* Library stamp effect */}
        <div className="absolute -rotate-12 opacity-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-40 h-40 border-4 border-amber-900/30 dark:border-amber-300/30 rounded-full flex items-center justify-center">
            <p className="text-amber-900/40 dark:text-amber-300/40 font-serif text-sm text-center">
              BOOKOUSTIC<br/>LIBRARY
            </p>
          </div>
        </div>

        <div className="mt-auto pt-16">
          <p
            className="text-sm text-amber-700/70 dark:text-amber-400/70 font-serif"
            style={{
              fontFamily: `"${font.body}", serif`,
            }}
          >
            Generated with Bookoustic
          </p>
          <p
            className="text-sm text-amber-700/70 dark:text-amber-400/70 font-serif"
            style={{
              fontFamily: `"${font.body}", serif`,
            }}
          >
            {new Date().toLocaleDateString()}
          </p>
        </div>
        
        {/* Decorative ornament at bottom */}
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 rotate-180">
          <div className="w-32 h-12 bg-[url('/ornamental-divider.png')] bg-contain bg-no-repeat bg-center opacity-60"></div>
        </div>
      </div>
    </div>
  )
}
