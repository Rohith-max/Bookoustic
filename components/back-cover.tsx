import { getFontForCategory, getThemeForCategory } from "@/lib/book-fonts"

interface BackCoverProps {
  book: any
  category: string
}

export default function BackCover({ book, category }: BackCoverProps) {
  const font = getFontForCategory(category)
  const theme = getThemeForCategory(category)

  return (
    <div
      className={`book-back-cover h-full w-full flex flex-col items-center justify-center p-8 ${theme.coverGradient}`}
      style={{
        backgroundImage: `url('/leather-texture.jpg')`,
        backgroundSize: 'cover',
        backgroundBlendMode: 'multiply',
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)'
      }}
    >
      {/* Book binding edge */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-[#3a2618] border-l border-[#221914] shadow-lg"></div>
      
      {/* Gold embossed frame */}
      <div className="text-center p-8 w-full max-w-lg border-[12px] border-[#8d7651]/30 rounded-lg mx-12 relative"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(150, 120, 90, 0.2), rgba(200, 175, 140, 0.3), rgba(150, 120, 90, 0.2))',
          boxShadow: '0 0 20px rgba(0,0,0,0.4), inset 0 0 30px rgba(0,0,0,0.3)'
        }}
      >
        <h2
          className="text-2xl font-bold mb-6 text-[#c4a86b] drop-shadow-md"
          style={{
            fontFamily: `"${font.title}", serif`,
            fontWeight: font.titleWeight,
            textShadow: '0 1px 3px rgba(0,0,0,0.3)'
          }}
        >
          About this book
        </h2>

        <p
          className="text-[#c4a86b]/90 mb-8 text-left leading-relaxed"
          style={{
            fontFamily: `"${font.body}", serif`,
            textShadow: '0 1px 1px rgba(0,0,0,0.2)'
          }}
        >
          {book.backCoverText}
        </p>

        <div className="mt-auto pt-8 flex justify-between items-center border-t border-[#8d7651]/30">
          <p
            className="text-lg text-[#c4a86b]/80 italic"
            style={{
              fontFamily: `"${font.body}", serif`,
              textShadow: '0 1px 1px rgba(0,0,0,0.2)'
            }}
          >
            {category}
          </p>

          <p
            className="text-lg text-[#c4a86b]/80"
            style={{
              fontFamily: `"${font.body}", serif`,
              textShadow: '0 1px 1px rgba(0,0,0,0.2)'
            }}
          >
            Bookoustic
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-[-6px] right-[-6px] w-24 h-24 opacity-50">
          <div className="absolute bottom-4 right-4 transform rotate-12">
            <div className="w-16 h-16 rounded-full border-2 border-[#c4a86b]/60 flex items-center justify-center">
              <span className="text-[#c4a86b]/80 text-xs font-serif">ex libris</span>
            </div>
          </div>
        </div>

        {/* ISBN-like barcode for decoration */}
        <div className="mt-4 pt-4">
          <div className="flex justify-center">
            <div className="h-8 w-48 bg-[#c4a86b]/20 border border-[#c4a86b]/30 rounded-sm flex items-center justify-center">
              <div className="text-xs text-[#c4a86b]/90 font-mono">ISBN 978-0-00000-000-0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
