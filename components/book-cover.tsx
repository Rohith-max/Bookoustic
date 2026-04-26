import { getFontForCategory, getThemeForCategory } from "@/lib/book-fonts"

interface BookCoverProps {
  book: any
  category: string
}

export default function BookCover({ book, category }: BookCoverProps) {
  const font = getFontForCategory(category)
  const theme = getThemeForCategory(category)

  return (
    <div 
      className={`book-cover h-full w-full flex flex-col items-center justify-center p-8 ${theme.coverGradient}`}
      style={{
        backgroundImage: `url('/leather-texture.jpg')`,
        backgroundSize: 'cover',
        backgroundBlendMode: 'multiply',
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)'
      }}
    >
      {/* Book binding edge */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-[#3a2618] border-r border-[#221914] shadow-lg"></div>
      
      {/* Gold embossed frame */}
      <div className="text-center p-8 w-full max-w-lg border-[12px] border-[#8d7651]/30 rounded-lg mx-12 relative"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(150, 120, 90, 0.2), rgba(200, 175, 140, 0.3), rgba(150, 120, 90, 0.2))',
          boxShadow: '0 0 20px rgba(0,0,0,0.4), inset 0 0 30px rgba(0,0,0,0.3)'
        }}
      >
        {/* Decorative corner elements */}
        <div className="absolute top-[-2px] left-[-2px] w-16 h-16 border-t-4 border-l-4 border-[#c4a86b]/70 rounded-tl-sm"></div>
        <div className="absolute top-[-2px] right-[-2px] w-16 h-16 border-t-4 border-r-4 border-[#c4a86b]/70 rounded-tr-sm"></div>
        <div className="absolute bottom-[-2px] left-[-2px] w-16 h-16 border-b-4 border-l-4 border-[#c4a86b]/70 rounded-bl-sm"></div>
        <div className="absolute bottom-[-2px] right-[-2px] w-16 h-16 border-b-4 border-r-4 border-[#c4a86b]/70 rounded-br-sm"></div>

        <h1
          className="text-4xl md:text-5xl font-bold mb-6 text-[#c4a86b] drop-shadow-md"
          style={{
            fontFamily: `"${font.title}", serif`,
            fontWeight: font.titleWeight,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          {book.title}
        </h1>

        {book.subtitle && (
          <h2
            className="text-xl md:text-2xl mb-10 text-[#c4a86b]/80"
            style={{
              fontFamily: `"${font.title}", serif`,
              fontWeight: font.titleWeight,
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            {book.subtitle}
          </h2>
        )}

        <div className="mt-auto pt-10">
          <p
            className="text-xl text-[#c4a86b]/90 italic"
            style={{
              fontFamily: `"${font.body}", serif`,
              textShadow: '0 1px 1px rgba(0,0,0,0.3)'
            }}
          >
            By {book.author}
          </p>
        </div>

        {/* Category emblem */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-30">
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-4xl text-[#c4a86b]">
            {category === "Fantasy" && "✦"}
            {category === "Science Fiction" && "⬡"}
            {category === "Mystery" && "?"}
            {category === "Horror" && "☠"}
            {!["Fantasy", "Science Fiction", "Mystery", "Horror"].includes(category) && "❧"}
          </div>
        </div>
      </div>
    </div>
  )
}
