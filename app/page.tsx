import BookousticInterface from "@/components/bookoustic-interface"

export default function Home() {
  return (
    <main className="min-h-screen bg-[url('/cozy-library-bg.jpg')] bg-cover bg-center bg-fixed">
      <div className="min-h-screen bg-[#4b3621]/80 dark:bg-[#1a1209]/90 backdrop-blur-sm">
        <div className="container mx-auto py-8 px-4">
          <div className="relative">
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
