import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import * as ReactDOM from "react-dom/client"

export async function generatePDF(
  bookContent: any,
  category: string,
  renderPageFunction: (page: any, category: string) => JSX.Element,
): Promise<string> {
  try {
    // Create a new PDF document
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // Set PDF properties
    pdf.setProperties({
      title: bookContent.title,
      subject: "Generated with Bookoustic",
      author: bookContent.author || "Bookoustic AI",
      keywords: `${category}, AI-generated book`,
      creator: "Bookoustic",
    })

    // Create a temporary container for rendering pages
    const tempContainer = document.createElement("div")
    tempContainer.style.position = "absolute"
    tempContainer.style.left = "-9999px"
    tempContainer.style.top = "-9999px"
    tempContainer.style.width = "210mm" // A4 width
    tempContainer.style.height = "297mm" // A4 height
    document.body.appendChild(tempContainer)

    // Process each page in the book content
    const pageContent = generateBookPages(bookContent, category)
    const totalPages = pageContent.length

    // Add a progress callback
    const progressCallback = typeof window !== "undefined" ? (window as any).pdfGenerationProgress : null

    for (let i = 0; i < totalPages; i++) {
      const page = pageContent[i]

      // Update progress if callback exists
      if (progressCallback && typeof progressCallback === "function") {
        progressCallback(Math.round((i / totalPages) * 100))
      }

      // Create a container for this page
      const pageContainer = document.createElement("div")
      pageContainer.className = "book-container"
      pageContainer.style.width = "100%"
      pageContainer.style.height = "100%"
      pageContainer.style.overflow = "hidden"

      // Render the page content
      const pageElement = document.createElement("div")
      pageElement.className = "book-content"
      pageElement.style.width = "100%"
      pageElement.style.height = "100%"
      pageElement.style.position = "relative"
      pageElement.style.boxShadow = "none"
      pageElement.style.border = "none"
      pageElement.style.background = "white"

      // Clear the container and add the new page
      tempContainer.innerHTML = ""
      tempContainer.appendChild(pageContainer)
      pageContainer.appendChild(pageElement)

      // Use React to render the page content
      const root = ReactDOM.createRoot(pageElement)
      const jsx = renderPageFunction(page, category)
      root.render(jsx)

      // Wait for the page to render
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Convert the page to canvas
      const canvas = await html2canvas(pageContainer, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })

      // Add a new page to the PDF (except for the first page)
      if (i > 0) {
        pdf.addPage()
      }

      // Add the canvas as an image to the PDF
      const imgData = canvas.toDataURL("image/jpeg", 1.0)
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297) // A4 dimensions in mm

      // Clean up React root
      root.unmount()
    }

    // Remove the temporary container
    document.body.removeChild(tempContainer)

    // Return the PDF as a data URL
    return pdf.output("datauristring")
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw new Error("Failed to generate PDF")
  }
}

// Helper function to generate all book pages with dynamic chapter scaling
function generateBookPages(book: any, category: string): any[] {
  if (!book) return []

  const pages = []

  // Front cover
  pages.push({ type: "cover", content: book })

  // Title page
  pages.push({ type: "title", content: book })

  // Table of contents
  pages.push({ type: "toc", content: book })

  // Chapters with dynamic scaling
  if (book.chapters && Array.isArray(book.chapters)) {
    // Determine optimal characters per page based on book length and chapter count
    let charsPerPage = 1200 // Default value for medium books

    if (book.chapters.length > 10) {
      charsPerPage = 1000 // Fewer chars per page for large books (more pages)
    } else if (book.chapters.length < 5) {
      charsPerPage = 1500 // More chars per page for short books (fewer pages)
    }

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

          pageCount++

          // Reset for next page
          currentPageContent = ""
          currentCharCount = 0
          isFirstPage = false
        }

        // Format paragraphs with proper indentation and spacing
        const formattedParagraph = formatParagraph(paragraph)
        currentPageContent += formattedParagraph
        currentCharCount += paragraph.length
      })

      // Add the last page of the chapter if there's content
      if (currentPageContent) {
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

  return pages
}

// Helper function to format paragraphs with proper indentation and spacing
function formatParagraph(paragraph: string): string {
  // Check if this is dialogue (starts with a quote or dash)
  if (paragraph.trim().startsWith('"') || paragraph.trim().startsWith("-") || paragraph.trim().startsWith('"')) {
    return `<p class="dialogue">${paragraph}</p>`
  }

  // Check if this is a section break
  if (paragraph.trim() === "***" || paragraph.trim() === "---" || paragraph.trim() === "___") {
    return `<div class="section-break">***</div>`
  }

  // Regular paragraph with text indent
  return `<p>${paragraph}</p>`
}
