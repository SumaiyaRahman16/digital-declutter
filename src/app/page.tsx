import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { Navbar } from "@/components/layout/navbar";
import { DropZone } from "@/components/features/declutter/drop-zone";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-90">
        <FlickeringGrid
          className="h-full w-full"
          squareSize={6}
          gridGap={10}
          flickerChance={0.7}
          color="rgb(249, 115, 22)"
          maxOpacity={0.28}
        />
      </div>

      <div className="pointer-events-none fixed inset-0 z-[1] bg-gradient-to-b from-background/70 via-background/20 to-background/80" />

      {/* Universal Navigation */}
      <div className="relative z-10">
        <Navbar />
      </div>

      {/* Hero & Drag-and-Drop Functional Area */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-16 text-center md:py-24">
        <div className="container mx-auto flex max-w-5xl flex-col items-center justify-center">
          {/* Sleek Header Section */}
          <div className="mb-12 max-w-3xl space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Reclaim Your Storage, <br />
              <span className="bg-gradient-to-r from-zinc-500 via-zinc-700 to-orange-500 bg-clip-text text-transparent">
                Locally and Securely.
              </span>
            </h1>
            <p className="mx-auto max-w-[700px] font-normal text-muted-foreground md:text-xl">
              Identify massive, old, and completely forgotten files clogging up your machine.
              No files ever touch our servers-everything stays private.
            </p>
          </div>

          <DropZone />
        </div>
      </main>
    </div>
  );
}