"use client"

import { Check, ChevronsUpDown, BookIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState } from "react"

const categories = [
  "Fiction",
  "Non-Fiction",
  "Biography",
  "Autobiography",
  "Memoir",
  "Science Fiction",
  "Fantasy",
  "Mystery",
  "Thriller",
  "Romance",
  "Historical Fiction",
  "Horror",
  "Adventure",
  "Self-Help",
  "Health & Wellness",
  "Travel",
  "Guide/How-To",
  "Children's",
  "Young Adult (YA)",
  "Drama",
  "Poetry",
  "Satire",
  "Philosophy",
  "Religion & Spirituality",
  "Science & Nature",
  "Technology",
  "Business & Finance",
  "Economics",
  "Politics",
  "Education",
  "Psychology",
  "Sociology",
  "Art & Photography",
  "Cookbook",
  "True Crime",
  "Sports",
  "Classic Literature",
  "Short Stories",
  "Dystopian",
  "Urban Fiction",
  "Magical Realism",
  "Coming-of-Age",
  "Western",
  "War & Military",
]

interface CategorySelectorProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

export default function CategorySelector({ selectedCategory, onCategoryChange }: CategorySelectorProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          role="combobox" 
          aria-expanded={open} 
          className="w-full justify-between border-amber-800/20 dark:border-amber-800/30 
          bg-amber-50/50 dark:bg-amber-950/30 font-serif text-amber-900 dark:text-amber-200
          hover:bg-amber-100/60 dark:hover:bg-amber-900/40"
        >
          <span className="flex items-center">
            <BookIcon className="mr-2 h-4 w-4 text-amber-700 dark:text-amber-500" />
            {selectedCategory || "Select category..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-amber-700 dark:text-amber-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 border-amber-800/20 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-950 shadow-lg">
        <Command className="bg-transparent">
          <CommandInput placeholder="Search category..." className="font-serif" />
          <CommandList>
            <CommandEmpty className="font-serif text-amber-900 dark:text-amber-200">No category found.</CommandEmpty>
            <CommandGroup className="max-h-80 overflow-y-auto">
              {categories.map((category) => (
                <CommandItem
                  key={category}
                  value={category}
                  onSelect={() => {
                    onCategoryChange(category)
                    setOpen(false)
                  }}
                  className="font-serif text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                >
                  <Check className={cn("mr-2 h-4 w-4 text-amber-700 dark:text-amber-500", selectedCategory === category ? "opacity-100" : "opacity-0")} />
                  {category}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
