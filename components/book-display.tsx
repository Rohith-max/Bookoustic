import { Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface BookDisplayProps {
  content: string | null
  isLoading: boolean
  prompt: string
  category: string
}

export default function BookDisplay({ content, isLoading, prompt, category }: BookDisplayProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
        <p className="text-center text-muted-foreground">
          Our AI author is crafting your {category} book...
          <br />
          This may take a few moments.
        </p>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Your book will appear here after generation.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-md">
        <p className="text-sm font-medium">Prompt:</p>
        <p className="text-sm text-muted-foreground">{prompt}</p>
        <p className="text-sm font-medium mt-2">Category:</p>
        <p className="text-sm text-muted-foreground">{category}</p>
      </div>

      <ScrollArea className="h-[500px] rounded-md border p-4">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {content.split("\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
