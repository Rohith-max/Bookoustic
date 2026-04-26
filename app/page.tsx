"use client"
import BookousticInterface from "@/components/bookoustic-interface"

export default function Home() {
  return (
    <main className="min-h-screen bg-[url('/cozy-library-bg.jpg')] bg-cover bg-center bg-fixed relative overflow-hidden">
      {/* Soft vignette overlay */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-amber-100/40 via-transparent to-amber-900/40" />
      <div className="min-h-screen bg-[#4b3621]/80 dark:bg-[#1a1209]/90 backdrop-blur-sm flex items-center justify-center">
        <div className="container mx-auto py-8 px-4 relative">
          {/* Decorative frame */}
          <div className="absolute inset-0 pointer-events-none z-20 border-8 border-amber-900/30 rounded-3xl shadow-[0_0_60px_10px_rgba(75,54,33,0.15)]" style={{boxShadow: '0 0 80px 20px #4b3621aa, 0 0 0 12px #c4a86b55 inset'}}></div>
          <div className="relative z-30">
            <div className="absolute -top-4 left-0 right-0">
              <div className="library-shelf"></div>
              <div className="library-shelf-shadow"></div>
            </div>
            <BookousticInterface />
            <div className="absolute -bottom-4 left-0 right-0">
              <div className="library-shelf"></div>
              <div className="library-shelf-shadow"></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
