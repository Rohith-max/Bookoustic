"use client"

import { useState, useEffect } from "react"
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
import { Progress } from "@/components/ui/progress"
import { useUser, useAuth } from '@clerk/nextjs';
import { getSupabaseClient } from '@/lib/supabase';

function BookHistory({ onSelectBook }: { onSelectBook: (book: any) => void }) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [books, setBooks] = useState<any[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    async function fetchBooks() {
      const token = (await getToken({ template: 'supabase' }).catch(() => undefined)) || (await getToken().catch(() => undefined)) || undefined;
      if (!token || !user) return;
      const supabase = getSupabaseClient(token);
      const debug: any = { user, userId: user.id, userIdType: typeof user.id };
      const { data, error } = await supabase
        .from('book_generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      debug.supabaseResponse = { data, error };
      setDebugInfo(debug);
      setBooks(data || []);
    }
    fetchBooks();
  }, [user]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Your Recent Books</h2>
      {/* DEBUG INFO REMOVED */}
      <ul>
        {books.map(book => (
          <li key={book.id} className="mb-2">
            <span className="font-serif">{book.book_title}</span>
            <button
              className="ml-4 px-2 py-1 bg-amber-800 text-amber-50 rounded"
              onClick={() => onSelectBook(book.book_data)}
            >
              View
            </button>
            <span className="ml-2 text-xs text-gray-500">{new Date(book.created_at).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
  const [chapterProgress, setChapterProgress] = useState(0)
  const { user } = useUser();
  const { getToken } = useAuth();

  // Reset state on user change (account switch, sign in/out)
  useEffect(() => {
    // Clear book content and all current page keys
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bookoustic_book_content');
      Object.keys(localStorage)
        .filter((k) => k.startsWith('bookoustic_current_page_'))
        .forEach((k) => localStorage.removeItem(k));
    }
    setBookContent(null);
    setActiveTab('prompt');
  }, [user?.id]);

  // Simulate progress bar while generating
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isGenerating) {
      setChapterProgress(0)
      let progress = 0
      interval = setInterval(() => {
        progress += Math.random() * 6 + 2 // random step for more natural feel
        if (progress >= 90) progress = 90
        setChapterProgress(progress)
      }, 400)
    } else {
      setChapterProgress(100)
      if (interval) clearInterval(interval)
      setTimeout(() => setChapterProgress(0), 800)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [isGenerating])

  // Load book content from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedBook = localStorage.getItem("bookoustic_book_content")
      if (savedBook) {
        setBookContent(JSON.parse(savedBook))
        setActiveTab("book")
      }
    }
  }, [])

  // Save book content to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined" && bookContent) {
      localStorage.setItem("bookoustic_book_content", JSON.stringify(bookContent))
    }
  }, [bookContent])

  // Save book to Supabase after generation
  useEffect(() => {
    async function saveBookToSupabase(book: any) {
      if (!user || !book) return;
      const token = (await getToken({ template: 'supabase' }).catch(() => undefined)) || (await getToken().catch(() => undefined)) || undefined;
      if (!token || !user) return;
      const supabase = getSupabaseClient(token);
      const { error, data } = await supabase.from('book_generations').insert([
        {
          user_id: user.id,
          book_title: book.title,
          book_data: book,
        }
      ]);
      if (error) {
        console.error("Supabase insert error:", error);
      } else {
        console.log("Supabase insert success:", data);
      }
    }
    if (bookContent && user) {
      saveBookToSupabase(bookContent);
    }
  }, [bookContent, user]);

  // Optionally, clear storage on reset (add a function if needed)

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
      {/* Chapter generation progress bar */}
      {isGenerating && chapterProgress > 0 && chapterProgress < 100 && (
        <div className="w-full max-w-2xl mb-2">
          <Progress value={chapterProgress} />
          <div className="text-center text-xs text-amber-900 dark:text-amber-200 mt-1 font-serif">
            Generating chapters... {Math.round(chapterProgress)}%
          </div>
        </div>
      )}
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
                <TabsTrigger value="history" className="data-[state=active]:bg-amber-700 data-[state=active]:text-amber-50">
                  Book History
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
                    <Label htmlFor="short" className="font-serif">Short (~5,000-8,000 words)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" className="border-amber-700 text-amber-700" />
                    <Label htmlFor="medium" className="font-serif">Medium (~10,000-15,000 words)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="long" id="long" className="border-amber-700 text-amber-700" />
                    <Label htmlFor="long" className="font-serif">Long (~15,000-20,000 words)</Label>
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
          <TabsContent value="history">
            <CardContent>
              <BookHistory onSelectBook={(book) => {
                setBookContent(book);
                setActiveTab("book");
              }} />
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
