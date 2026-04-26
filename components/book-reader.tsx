"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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

// Utility to split HTML content into pages by rendered height
function paginateByHeight(paragraphs: string[], pageHeightPx: number, font: any, theme: any, chapterTitle?: string) {
  if (typeof window === "undefined") return [];
  const tempDiv = document.createElement("div");
  tempDiv.style.position = "absolute";
  tempDiv.style.visibility = "hidden";
  tempDiv.style.width = "700px"; // match .book-page width
  tempDiv.style.fontFamily = `"${font.body}", serif`;
  tempDiv.style.fontSize = "1.05rem";
  tempDiv.style.lineHeight = "1.8";
  tempDiv.style.padding = "2.5rem";
  tempDiv.style.background = theme.contentPage?.backgroundColor || "#fff";
  document.body.appendChild(tempDiv);

  const pages: any[] = [];
  let currentPageContent = "";
  let isFirstPage = true;
  let pageCount = 0;
  let i = 0;
  while (i < paragraphs.length) {
    let testContent = currentPageContent;
    // Do NOT inject chapter title as HTML
    testContent += paragraphs[i];
    tempDiv.innerHTML = testContent;
    if (tempDiv.scrollHeight > pageHeightPx && currentPageContent !== "") {
      pages.push({
        type: "chapter",
        content: currentPageContent,
        chapterTitle: isFirstPage ? chapterTitle : "",
        chapterIndex: undefined, // will be set by caller
        pageNumber: pageCount + 1,
      });
      currentPageContent = "";
      isFirstPage = false;
      pageCount++;
      // do not increment i
    } else {
      currentPageContent = testContent;
      i++;
    }
  }
  // Push last page
  if (currentPageContent.trim() !== "") {
    pages.push({
      type: "chapter",
      content: currentPageContent,
      chapterTitle: isFirstPage ? chapterTitle : "",
      chapterIndex: undefined, // will be set by caller
      pageNumber: pageCount + 1,
    });
  }
  document.body.removeChild(tempDiv);
  return pages;
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

  // Load current page from localStorage on mount (per book)
  useEffect(() => {
    if (typeof window !== "undefined" && book && book.title) {
      const key = `bookoustic_current_page_${book.title}`
      const savedPage = localStorage.getItem(key)
      if (savedPage) {
        setCurrentPage(Number(savedPage))
      }
    }
  }, [book && book.title])

  // Save current page to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined" && book && book.title) {
      const key = `bookoustic_current_page_${book.title}`
      localStorage.setItem(key, String(currentPage))
    }
  }, [currentPage, book && book.title])

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
    if (!book || isLoading) return;
    setCurrentPage(0); // Reset to first page on book change
    const pages: any[] = [];
    pages.push({ type: "cover", content: book });
    pages.push({ type: "title", content: book });
    pages.push({ type: "toc", content: book });
    const pageHeightPx = 700; // match .book-page min-height
    if (book.chapters && Array.isArray(book.chapters)) {
      book.chapters.forEach((chapter: any, chapterIndex: number) => {
        if (!chapter.content || chapter.content.trim() === "") return;
        const paragraphs = chapter.content.split("\n").filter((p: string) => p.trim() !== "").map(formatParagraph);
        const chapterPages = paginateByHeight(paragraphs, pageHeightPx, font, theme, chapter.title).map((p, idx) => ({
          ...p,
          chapterIndex,
          pageNumber: idx + 1,
        }));
        pages.push(...chapterPages);
      });
    }
    pages.push({ type: "backcover", content: book });
    setPageContent(pages);
    setTotalPages(pages.length);
  }, [book, isLoading]);

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

  // Keyboard navigation for page turning
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isLoading) return;
      if (e.key === "ArrowRight") {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentPage((prev) => Math.max(prev - 1, 0));
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isLoading, totalPages])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <Loader2 className="h-12 w-12 animate-spin text-amber-700 dark:text-amber-300 mb-4" />
        <div className="text-center">
          <p className="text-2xl font-serif text-amber-900 dark:text-amber-100 drop-shadow-md animate-pulse">Writing your book...</p>
          <p className="text-amber-700 dark:text-amber-300 italic mt-2">Let the story unfold, page by page.</p>
        </div>
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
      {/* Book display with side navigation */}
      <div className="relative w-full max-w-3xl mx-auto aspect-[1/1.4] border-amber-800/10 shadow-2xl flex items-center justify-center">
        {/* Previous button (left side) */}
        <Button
          variant="outline"
          onClick={prevPage}
          disabled={currentPage === 0}
          className="absolute left-0 top-1/2 -translate-y-1/2 px-3 py-1 h-auto border-amber-800/30 bg-amber-50/80 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 z-10"
          style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
          aria-label="Previous Page"
        >
          <ChevronLeft className="h-5 w-5 text-amber-700 dark:text-amber-500" />
        </Button>
        <div
          ref={bookContainerRef}
          className="book-container flex-1 w-full h-full flex items-center justify-center"
        >
          <div className={`book-content ${isFlipping ? `flipping-${flipDirection}` : ""}`} style={{ width: '100%' }}>
            {pageContent.length > 0 && renderPage(pageContent[currentPage])}
          </div>
        </div>
        {/* Next button (right side) */}
        <Button
          variant="outline"
          onClick={nextPage}
          disabled={currentPage === totalPages - 1}
          className="absolute right-0 top-1/2 -translate-y-1/2 px-3 py-1 h-auto border-amber-800/30 bg-amber-50/80 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 z-10"
          style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
          aria-label="Next Page"
        >
          <ChevronRight className="h-5 w-5 text-amber-700 dark:text-amber-500" />
        </Button>
      </div>
      {/* Page indicator and slider below the book */}
      <div className="flex flex-col items-center w-full max-w-2xl">
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

      {/* PDF Download button */}
      <Button
        onClick={handleDownloadPDF}
        disabled={isDownloading}
        className="flex items-center bg-amber-800 hover:bg-amber-900 text-amber-50 font-serif mb-6"
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

// PenOnPathSVG component (placed above BookReader)
function PenOnPathSVG() {
  // Animate the pen along the SVG flourish path with visually even speed
  const penRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const path = document.getElementById('flourish-path') as SVGPathElement | null
    if (!path || !penRef.current) return
    // Sample the path at many points to get arc length parameterization
    const N = 200
    const points: {x: number, y: number, len: number}[] = []
    let prev = path.getPointAtLength(0)
    let totalLen = 0
    points.push({x: prev.x, y: prev.y, len: 0})
    for (let i = 1; i <= N; ++i) {
      const l = (path.getTotalLength() * i) / N
      const pt = path.getPointAtLength(l)
      const dx = pt.x - prev.x, dy = pt.y - prev.y
      totalLen += Math.sqrt(dx*dx + dy*dy)
      points.push({x: pt.x, y: pt.y, len: totalLen})
      prev = pt
    }
    // Animate based on arc length
    let start: number | null = null
    const duration = 1800 // ms
    function animatePen(ts: number) {
      if (!penRef.current) return
      if (start === null) start = ts
      const elapsed = Math.min(ts - start, duration)
      const progress = elapsed / duration
      const targetLen = totalLen * progress
      // Find the segment where targetLen falls
      let idx = 0
      while (idx < points.length-1 && points[idx+1].len < targetLen) idx++
      const p0 = points[idx], p1 = points[Math.min(idx+1, points.length-1)]
      const segLen = p1.len - p0.len
      const segT = segLen === 0 ? 0 : (targetLen - p0.len) / segLen
      const x = p0.x + (p1.x - p0.x) * segT
      const y = p0.y + (p1.y - p0.y) * segT
      penRef.current.style.left = `${x + 210 - 16}px`
      penRef.current.style.top = `${y + 110 - 16}px`
      penRef.current.style.opacity = '1'
      if (elapsed < duration) {
        requestAnimationFrame(animatePen)
      } else {
        penRef.current.style.opacity = '0.7'
      }
    }
    penRef.current.style.opacity = '0'
    requestAnimationFrame(animatePen)
    return () => { start = null }
  }, [])
  return (
    <div
      ref={penRef}
      style={{
        position: 'absolute',
        width: 32,
        height: 32,
        zIndex: 10,
        left: 210 - 16,
        top: 110 - 16,
        opacity: 0,
        transition: 'opacity 0.3s',
        pointerEvents: 'none',
      }}
    >
      {/* SVG Pen: barrel + gold band + nib */}
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Pen barrel */}
        <rect x="13" y="2" width="6" height="18" rx="3" fill="#222" />
        {/* Gold band */}
        <rect x="13" y="16" width="6" height="3" rx="1.5" fill="#c4a86b" />
        {/* Pen nib */}
        <polygon points="16,20 13,30 19,30" fill="#c4a86b" stroke="#a88b4a" strokeWidth="1.2" />
        <circle cx="16" cy="24" r="1.1" fill="#fffbe6" />
      </svg>
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
