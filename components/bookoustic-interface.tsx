"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Download, BookIcon, Coffee, BookOpenText } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import CategorySelector from "./category-selector"
import BookReader, { renderBookPage } from "./book-reader"
import { generateBook } from "@/app/actions/generate-book"
import { generatePDF } from "@/lib/pdf-generator"
import { useToast } from "@/hooks/use-toast"

export default function BookousticInterface() {
  const [prompt, setPrompt] = useState("")
  const [category, setCategory] = useState("Fiction")
  const [bookSize, setBookSize] = useState("medium")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [bookContent, setBookContent] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState("prompt")
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!prompt || !category) return

    setIsGenerating(true)
    setActiveTab("book")
    setError(null)

    try {
      const content = await generateBook(prompt, category, bookSize)

      if (content.error) {
        throw new Error(content.error)
      }

      setBookContent(content)
    } catch (error: any) {
      console.error("Error generating book:", error)
      setError(`Failed to generate book: ${error.message || "Please try again."}`)
      setActiveTab("prompt")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!bookContent) return

    setIsDownloading(true)
    try {
      // Show a toast notification that PDF generation is starting
      toast({
        title: "Preparing PDF",
        description: "Generating PDF of the complete book. This may take a moment...",
      })

      // Generate PDF of all pages using our new approach
      const pdfDataUri = await generatePDF(bookContent, category, renderBookPage)

      // Create a download link
      const link = document.createElement("a")
      link.href = pdfDataUri
      link.download = `${bookContent.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "PDF Downloaded",
        description: "Your complete book has been downloaded successfully.",
      })
    } catch (error: any) {
      console.error("Error downloading PDF:", error)
      toast({
        title: "Download Failed",
        description: `Failed to download the book as PDF: ${error.message || "Please try again."}`,
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-8 w-full">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-primary/90 rounded-lg shadow-lg">
          <BookOpenText className="h-8 w-8 text-amber-100" />
        </div>
        <h1 className="text-4xl font-bold text-center font-serif text-amber-100 drop-shadow-md">Bookoustic</h1>
      </div>
      <p className="text-center text-amber-100 max-w-2xl italic">
        Your AI-powered book author. Describe what you want, select a category, and let our AI create a professional
        book for you.
      </p>

      <Card className="w-full max-w-4xl vintage-paper border-amber-700/30 dark:border-amber-900/30 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.3)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader className="bg-[url('/vintage-header-bg.png')] bg-cover text-amber-900 dark:text-amber-100 border-b border-amber-200 dark:border-amber-900/50">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl drop-shadow-sm font-serif">Create Your Book</CardTitle>
                <CardDescription className="text-amber-800/80 dark:text-amber-300/80 font-serif">
                  Describe your book idea and select a category
                </CardDescription>
              </div>
              <TabsList className="bg-amber-800/20 dark:bg-amber-950/40 backdrop-blur-sm">
                <TabsTrigger value="prompt" className="data-[state=active]:bg-amber-700 data-[state=active]:text-amber-50">
                  Prompt
                </TabsTrigger>
                <TabsTrigger value="book" className="data-[state=active]:bg-amber-700 data-[state=active]:text-amber-50">
                  Book
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>

          <TabsContent value="prompt">
            <CardContent className="space-y-6 pt-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="prompt" className="text-sm font-medium font-serif text-amber-900 dark:text-amber-200">
                  Describe your book
                </label>
                <Textarea
                  id="prompt"
                  placeholder="Describe the book you want to be written. Be as detailed as possible..."
                  className="min-h-32 border-amber-800/20 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-950/30 font-serif"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium font-serif text-amber-900 dark:text-amber-200">Select a category</label>
                <CategorySelector selectedCategory={category} onCategoryChange={setCategory} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium font-serif text-amber-900 dark:text-amber-200">Book Size</label>
                <RadioGroup
                  defaultValue="medium"
                  value={bookSize}
                  onValueChange={setBookSize}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="short" id="short" className="border-amber-700 text-amber-700" />
                    <Label htmlFor="short" className="font-serif">Short (~12 pages)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" className="border-amber-700 text-amber-700" />
                    <Label htmlFor="medium" className="font-serif">Medium (~22 pages)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="long" id="long" className="border-amber-700 text-amber-700" />
                    <Label htmlFor="long" className="font-serif">Long (~32 pages)</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>

            <CardFooter className="bg-amber-100/50 dark:bg-amber-950/50 border-t border-amber-200 dark:border-amber-900/30 rounded-b-lg p-6">
              <Button
                onClick={handleGenerate}
                disabled={!prompt || !category || isGenerating}
                className="w-full bg-amber-800 hover:bg-amber-900 text-amber-50 font-serif"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating your book...
                  </>
                ) : (
                  <>
                    <Coffee className="mr-2 h-4 w-4" />
                    Generate Book
                  </>
                )}
              </Button>
            </CardFooter>
          </TabsContent>

          <TabsContent value="book">
            <CardContent>
              {error ? (
                <div className="text-center py-12 text-red-500">
                  <p>{error}</p>
                </div>
              ) : (
                <BookReader book={bookContent} isLoading={isGenerating} category={category} />
              )}
            </CardContent>

            <CardFooter className="flex justify-between bg-amber-100/50 dark:bg-amber-950/50 border-t border-amber-200 dark:border-amber-900/30 rounded-b-lg p-6">
              <Button
                variant="outline"
                onClick={() => setActiveTab("prompt")}
                className="border-amber-800/30 dark:border-amber-800/30 text-amber-900 dark:text-amber-200 font-serif hover:bg-amber-800/10"
              >
                Back to Prompt
              </Button>

              <Button
                disabled={!bookContent || isGenerating || isDownloading}
                onClick={handleDownloadPDF}
                className="flex items-center bg-amber-800 hover:bg-amber-900 text-amber-50 font-serif"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing PDF...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Complete Book
                  </>
                )}
              </Button>
            </CardFooter>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
