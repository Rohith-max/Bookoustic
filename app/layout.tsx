// app/layout.tsx
import type { Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { getAllFontsUrl } from "@/lib/book-fonts";

export const metadata: Metadata = {
  title: "Bookoustic - AI Book Author",
  description: "Generate professional books with AI",
  generator: "v0.dev"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <head>
          <link rel="stylesheet" href={getAllFontsUrl()} />
        </head>
        <body className={`dark`}>
          <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" disableTransitionOnChange>
            <header className="w-full flex items-center justify-between px-6 py-4 bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-900/50 mb-4">
              <div className="flex items-center space-x-4">
                <span className="text-2xl font-bold font-serif text-amber-900 dark:text-amber-100">Bookoustic</span>
              </div>
              <div className="flex items-center space-x-2">
                <SignedOut>
                  <SignInButton>
                    <button className="px-4 py-2 rounded bg-amber-800 text-amber-50 font-serif hover:bg-amber-900">Sign In</button>
                  </SignInButton>
                  <SignUpButton>
                    <button className="px-4 py-2 rounded bg-amber-100 text-amber-900 font-serif border border-amber-800 ml-2 hover:bg-amber-200">Sign Up</button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </header>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}