import { Navbar } from "@/components/layout/navbar";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Universal Navigation */}
      <Navbar />

      {/* Hero & Drag-and-Drop Functional Area */}
      <main className="flex-1 container mx-auto px-4 py-16 md:py-24 max-w-5xl flex flex-col items-center justify-center text-center">
        
        {/* Sleek Header Section */}
        <div className="space-y-4 max-w-3xl mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-zinc-900 dark:text-zinc-100">
            Reclaim Your Storage, <br />
            <span className="bg-gradient-to-r from-zinc-500 to-zinc-800 bg-clip-text text-transparent">
              Locally and Securely.
            </span>
          </h1>
          <p className="mx-auto max-w-[700px] text-zinc-500 md:text-xl dark:text-zinc-400 font-normal">
            Identify massive, old, and completely forgotten  files clogging up your machine. 
            No files ever touch our servers—everything stays private.
          </p>
        </div>

        {/* This is where our feature-specific <DropZone /> component will go next! */}
        <div className="w-full max-w-2xl border-2 border-dashed border-zinc-200 rounded-xl p-12 bg-zinc-50/50 flex flex-col items-center justify-center min-h-[300px]">
          <p className="text-sm text-zinc-400">
            [ Placeholder: Core DropZone Component will load here ]
          </p>
        </div>

      </main>
    </div>
  );
}