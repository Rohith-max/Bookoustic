import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import * as ReactDOM from "react-dom/client"

export async function generatePDF(
  bookContent: any,
  category: string,
  renderPageFunction: (page: any, category: string) => any,
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
      pageContainer.style.width = "210mm"
      pageContainer.style.height = "297mm"
      pageContainer.style.overflow = "hidden"
      pageContainer.style.margin = "0"
      pageContainer.style.padding = "0"

      // Render the page content
      const pageElement = document.createElement("div")
      pageElement.className = "book-content"
      pageElement.style.width = "170mm" // 20mm padding on each side
      pageElement.style.height = "257mm" // 20mm padding top/bottom
      pageElement.style.position = "absolute"
      pageElement.style.left = "20mm"
      pageElement.style.top = "20mm"
      pageElement.style.boxShadow = "none"
      pageElement.style.border = "none"
      pageElement.style.background = "white"
      pageElement.style.fontSize = "12pt"
      pageElement.style.lineHeight = "1.5"
      pageElement.style.margin = "0"
      pageElement.style.padding = "0"

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

// Utility to split HTML content into pages by rendered height (for PDF)
function paginateByHeightPDF(paragraphs: string[], pageHeightPx: number, font: any, theme: any, chapterTitle?: string) {
  if (typeof window === "undefined") return [];
  const tempDiv = document.createElement("div");
  tempDiv.style.position = "absolute";
  tempDiv.style.visibility = "hidden";
  tempDiv.style.width = "210mm";
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
    const { getFontForCategory, getThemeForCategory } = require("@/lib/book-fonts");
    const font = getFontForCategory(category);
    const theme = getThemeForCategory(category);
    const pageHeightPx = 1122; // 297mm at 96dpi (A4)

    book.chapters.forEach((chapter: any, chapterIndex: number) => {
      // Skip empty chapters
      if (!chapter.content || chapter.content.trim() === "") {
        return
      }

      // Split chapter content into paragraphs
      const paragraphs = chapter.content.split("\n").filter((p: string) => p.trim() !== "").map(formatParagraph);

      // Create pages for this chapter
      const chapterPages = paginateByHeightPDF(paragraphs, pageHeightPx, font, theme, chapter.title).map((p, idx) => ({
        ...p,
        chapterIndex,
        pageNumber: idx + 1,
      }));
      pages.push(...chapterPages);
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
