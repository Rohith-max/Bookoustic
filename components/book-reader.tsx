"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Loader2, AlertTriangle, Download, BookOpenIcon, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getFontForCategory, getThemeForCategory } from "@/lib/book-fonts"
import BookCover from "./book-cover"
import BackCover from "./back-cover"
import TitlePage from "./title-page"
import TableOfContents from "./table-of-contents"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { generatePDF } from "@/lib/pdf-generator"
import { useToast } from "@/hooks/use-toast"

interface BookDisplayProps {
  content: string | null
  isLoading: boolean
  prompt: string
  category: string
}

interface BookReaderProps {
  book: any
  isLoading: boolean
  category: string
}

export default function BookReader({ book, isLoading, category }: BookReaderProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [pageContent, setPageContent] = useState<any[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next")
  const [pdfProgress, setPdfProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const bookContainerRef = useRef<HTMLDivElement>(null)
  const font = getFontForCategory(category)
  const theme = getThemeForCategory(category)
  const { toast } = useToast()

  // Set up progress callback for PDF generation
  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as any).pdfGenerationProgress = setPdfProgress
    }

    return () => {
      if (typeof window !== "undefined") {
        ;(window as any).pdfGenerationProgress = null
      }
    }
  }, [])

  // This function renders a single page based on its type
  const renderPage = (page: any, pageCategory: string = category) => {
    if (!page) return null

    switch (page.type) {
      case "cover":
        return <BookCover book={page.content} category={pageCategory} />
      case "title":
        return <TitlePage book={page.content} category={pageCategory} />
      case "toc":
        return (
          <TableOfContents
            book={page.content}
            category={pageCategory}
            onNavigate={(index) => {
              // Find the page index for the selected chapter
              const chapterPageIndex = pageContent.findIndex((p) => p.type === "chapter" && p.chapterIndex === index)
              if (chapterPageIndex >= 0) {
                jumpToPage(chapterPageIndex)
              }
            }}
          />
        )
      case "chapter":
        return (
          <div
            className={`book-page chapter-page ${isFlipping ? `page-flip-${flipDirection}` : ""}`}
            style={{
              ...theme.contentPage,
              fontFamily: `"${font.body}", serif`,
              padding: "2.5rem",
              lineHeight: "1.8",
            }}
          >
            {/* Chapter title at the top of the page */}
            {page.chapterTitle && (
              <h2
                className="text-2xl md:text-3xl font-bold mb-8 text-center"
                style={{
                  fontFamily: `"${font.title}", serif`,
                  fontWeight: font.titleWeight,
                  color: theme.titleColor,
                }}
              >
                {page.chapterTitle}
              </h2>
            )}

            {/* Chapter header (for continuation pages) */}
            {!page.chapterTitle && page.chapterIndex !== undefined && (
              <div
                className="chapter-header"
                style={{
                  color: theme.headerColor,
                }}
              >
                {book.chapters[page.chapterIndex]?.title || `Chapter ${page.chapterIndex + 1}`}
              </div>
            )}

            {/* Chapter content */}
            <div
              dangerouslySetInnerHTML={{ __html: page.content }}
              className="chapter-content"
              style={{
                color: theme.textColor,
              }}
            />
            <div
              className="page-number"
              style={{
                color: theme.pageNumberColor,
              }}
            >
              {currentPage}
            </div>
            {theme.decorativeElement && (
              <div className="decorative-element" dangerouslySetInnerHTML={{ __html: theme.decorativeElement }} />
            )}
          </div>
        )
      case "backcover":
        return <BackCover book={page.content} category={pageCategory} />
      default:
        return null
    }
  }

  // Process book content into pages
  useEffect(() => {
    if (!book || isLoading) return

    const pages = []

    // Front cover (only once)
    pages.push({ type: "cover", content: book })

    // Title page
    pages.push({ type: "title", content: book })

    // Table of contents
    pages.push({ type: "toc", content: book })

    // Determine optimal characters per page based on book length and chapter count
    let charsPerPage = 1200 // Default value

    // Adjust based on book size
    if (book.chapters && book.chapters.length > 10) {
      // For longer books (more chapters)
      charsPerPage = 1000 // Fewer chars per page for large books
    } else if (book.chapters && book.chapters.length < 5) {
      // For shorter books (fewer chapters)
      charsPerPage = 1500 // More chars per page for short books
    }

    // Chapters - now with dynamic scaling
    if (book.chapters && Array.isArray(book.chapters)) {
      book.chapters.forEach((chapter: any, chapterIndex: number) => {
        // Skip empty chapters
        if (!chapter.content || chapter.content.trim() === "") {
          return
        }

        // Split chapter content into paragraphs
        const paragraphs = chapter.content.split("\n").filter((p: string) => p.trim() !== "")

        // Create pages for this chapter
        let currentPageContent = ""
        let currentCharCount = 0
        let isFirstPage = true
        let pageCount = 0

        paragraphs.forEach((paragraph: string) => {
          // If adding this paragraph would exceed our target page size and it's not the first paragraph
          // of the first page (we want at least one paragraph on the first page with the title)
          if (currentCharCount + paragraph.length > charsPerPage && (!isFirstPage || currentCharCount > 0)) {
            // Add the current page
            pages.push({
              type: "chapter",
              content: currentPageContent,
              chapterTitle: isFirstPage ? chapter.title : "", // Only include title on first page
              chapterIndex: chapterIndex,
              pageNumber: pageCount + 1,
            })

            // Reset for the next page
            currentPageContent = ""
            currentCharCount = 0
            isFirstPage = false
            pageCount++
          }

          // Format the paragraph with enhanced typography before adding it
          const formattedParagraph = formatParagraph(paragraph)
          currentPageContent += formattedParagraph
          currentCharCount += paragraph.length
        })

        // Add the final page for this chapter if there's any content
        if (currentPageContent.trim() !== "") {
          pages.push({
            type: "chapter",
            content: currentPageContent,
            chapterTitle: isFirstPage ? chapter.title : "", // Only include title if this is the first page
            chapterIndex: chapterIndex,
            pageNumber: pageCount + 1,
          })
        }
      })
    }

    // Back cover
    pages.push({ type: "backcover", content: book })

    setPageContent(pages)
    setTotalPages(pages.length)
  }, [book, isLoading])

  // Format paragraphs with enhanced typography
  const formatParagraph = (paragraph: string): string => {
    // Check if the paragraph is dialogue (starts with a quote or dash)
    const isDialogue = /^[\"\'\"]|^—|^-/.test(paragraph.trim())

    // Apply appropriate styling
    if (isDialogue) {
      return `<p class="dialogue">${paragraph}</p>`
    } else if (paragraph.trim() === "***" || paragraph.trim() === "---" || paragraph.trim() === "* * *") {
      return `<div class="section-break">⁂</div>` // Create decorative section break
    } else {
      return `<p>${paragraph}</p>`
    }
  }

  // Navigation functions
  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setFlipDirection("next")
      setIsFlipping(true)
      setTimeout(() => {
        setCurrentPage((prev) => prev + 1)
        setIsFlipping(false)
      }, 300)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setFlipDirection("prev")
      setIsFlipping(true)
      setTimeout(() => {
        setCurrentPage((prev) => prev - 1)
        setIsFlipping(false)
      }, 300)
    }
  }

  const jumpToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < totalPages) {
      setCurrentPage(pageIndex)
    }
  }

  // PDF download
  const handleDownloadPDF = async () => {
    if (!book) return

    try {
      setIsDownloading(true)
      setPdfProgress(0)

      // Show toast notification
      toast({
        title: "Creating PDF",
        description: "Generating your book as a PDF. This may take a moment...",
      })

      const pdfDataUri = await generatePDF(book, category, renderBookPage)

      const link = document.createElement("a")
      link.href = pdfDataUri
      link.download = `${book.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "PDF Ready",
        description: "Your book has been downloaded as a PDF.",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        variant: "destructive",
        title: "PDF Generation Failed",
        description: "There was an error creating your PDF. Please try again.",
      })
    } finally {
      setIsDownloading(false)
      setPdfProgress(0)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="relative w-32 h-40 bg-amber-100 dark:bg-amber-900/30 rounded shadow-md flex items-center justify-center">
          <div className="absolute inset-0 animate-pulse rounded bg-gradient-to-br from-amber-200 to-amber-50 dark:from-amber-800/60 dark:to-amber-950/60"></div>
          <Loader2 className="w-8 h-8 animate-spin text-amber-800 dark:text-amber-200 relative z-10" />
        </div>
        <p className="text-center text-amber-800 dark:text-amber-200 font-serif italic">Crafting your book, please wait...</p>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-32 h-40 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded shadow-md flex items-center justify-center">
          <BookOpenIcon className="w-12 h-12 text-amber-300 dark:text-amber-700" />
        </div>
        <p className="text-center text-amber-900 dark:text-amber-200 font-serif">
          Enter a prompt and click "Generate Book" to create your own book.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Book display */}
      <div
        ref={bookContainerRef}
        className="book-container w-full max-w-3xl mx-auto aspect-[1/1.4] border-amber-800/10 shadow-2xl"
      >
        <div className={`book-content ${isFlipping ? `flipping-${flipDirection}` : ""}`}>
          {pageContent.length > 0 && renderPage(pageContent[currentPage])}
        </div>
      </div>

      {/* Navigation controls */}
      <div className="flex items-center justify-between w-full max-w-2xl">
        <Button
          variant="outline"
          onClick={prevPage}
          disabled={currentPage === 0}
          className="px-3 py-1 h-auto border-amber-800/30 bg-amber-50/80 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200"
        >
          <ChevronLeft className="h-5 w-5 text-amber-700 dark:text-amber-500" />
          <span className="ml-1 font-serif">Previous</span>
        </Button>

        <div className="flex-1 px-4">
          <div className="text-center text-sm mb-2 font-serif text-amber-800 dark:text-amber-300">
            Page {currentPage + 1} of {totalPages}
          </div>
          <Slider
            value={[currentPage]}
            min={0}
            max={totalPages - 1}
            step={1}
            onValueChange={(values) => jumpToPage(values[0])}
            className="w-full"
          />
        </div>

        <Button
          variant="outline"
          onClick={nextPage}
          disabled={currentPage === totalPages - 1}
          className="px-3 py-1 h-auto border-amber-800/30 bg-amber-50/80 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200"
        >
          <span className="mr-1 font-serif">Next</span>
          <ChevronRight className="h-5 w-5 text-amber-700 dark:text-amber-500" />
        </Button>
      </div>

      {/* PDF Download button */}
      <Button
        onClick={handleDownloadPDF}
        disabled={isDownloading}
        className="flex items-center bg-amber-800 hover:bg-amber-900 text-amber-50 font-serif"
      >
        {isDownloading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating PDF ({Math.round(pdfProgress)}%)
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Download as PDF
          </>
        )}
      </Button>

      {/* PDF Progress bar */}
      {isDownloading && (
        <div className="pdf-progress-container">
          <div className="pdf-progress-bar">
            <div className="pdf-progress-value" style={{ width: `${pdfProgress}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}

// Export the renderPage function for PDF generation
export function renderBookPage(page: any, category: string) {
  const font = getFontForCategory(category)
  const theme = getThemeForCategory(category)

  switch (page.type) {
    case "cover":
      return <BookCover book={page.content} category={category} />
    case "title":
      return <TitlePage book={page.content} category={category} />
    case "toc":
      return <TableOfContents book={page.content} category={category} onNavigate={() => {}} />
    case "chapter":
      return (
        <div
          className="book-page chapter-page"
          style={{
            ...theme.contentPage,
            fontFamily: `"${font.body}", serif`,
            padding: "2rem",
            lineHeight: "1.8",
          }}
        >
          {/* Chapter title at the top of the page */}
          {page.chapterTitle && (
            <h2
              className="text-2xl md:text-3xl font-bold mb-6 text-center"
              style={{
                fontFamily: `"${font.title}", serif`,
                fontWeight: font.titleWeight,
                color: theme.titleColor,
              }}
            >
              {page.chapterTitle}
            </h2>
          )}

          {/* Chapter content */}
          <div
            dangerouslySetInnerHTML={{ __html: page.content }}
            className="chapter-content"
            style={{
              color: theme.textColor,
            }}
          />
          {theme.decorativeElement && (
            <div className="decorative-element" dangerouslySetInnerHTML={{ __html: theme.decorativeElement }} />
          )}
        </div>
      )
    case "backcover":
      return <BackCover book={page.content} category={category} />
    default:
      return null
  }
}
