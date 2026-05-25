"use client";

import React, { useState, useRef } from "react";
import { FolderUp, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickKillList } from "./quick-kill-list";

// Define the shape of metadata we will extract
interface FileMetadata {
  name: string;
  path: string;
  size: number; // in Bytes
  type: string;
  lastModified: number; // timestamp
}

export function DropZone() {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Core Logic: Processing files recursively from a local directory drop/selection
  const processFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsScanning(true);
    const extractedMetadata: FileMetadata[] = [];

    // Loop through files and pluck metadata out without reading content
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      // webkitRelativePath gives us the local folder tree breakdown
      extractedMetadata.push({
        name: file.name,
        path: file.webkitRelativePath || file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      });
    }

    // Save the extracted metadata to state (for Quick Kill UI) and log it
    setFiles(extractedMetadata);
    console.log("Extracted File Metadata Payload:", extractedMetadata);
    console.log(`Total Files Found: ${extractedMetadata.length}`);

    // Simulate backend roundtrip processing calculation delay for UX
    setTimeout(() => {
      setIsScanning(false);
      alert(`Successfully scanned ${extractedMetadata.length} files locally! Check your console layout.`);
    }, 1500);
  };

  // 2. Drag Event Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`group relative flex min-h-[320px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-all duration-300 backdrop-blur-sm
        ${isDragActive 
          ? "border-orange-500 bg-orange-500/5 shadow-md scale-[1.01]" 
          : "border-zinc-200 dark:border-zinc-800 bg-card/60 hover:bg-card/80 hover:border-zinc-400 dark:hover:border-zinc-600"
        }`}
    >
      {/* Hidden standard directory picker input utilizing the webkitdirectory specs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        webkitdirectory=""
        directory=""
        className="hidden"
        onChange={handleInputChange}
      />

      {isScanning ? (
        <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="relative flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
            <Sparkles className="absolute h-5 w-5 text-orange-400 animate-pulse" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">Analyzing Directory Layout...</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Calculating sizes and file parameters locally.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <div className={`rounded-full p-4 transition-transform duration-300 group-hover:scale-110 
            ${isDragActive ? "bg-orange-500/10 text-orange-500" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-200"}`}>
            <FolderUp className="h-8 w-8" />
          </div>
          
          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-lg font-semibold text-foreground tracking-tight">
              {isDragActive ? "Drop to parse files" : "Scan Local Directories"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Drag & drop a folder here, or click to browse files from your computer.
            </p>
          </div>

          <Button
            type="button"
            onClick={onButtonClick}
            variant="outline"
            className="mt-2 border-zinc-200 dark:border-zinc-800 bg-background text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 shadow-sm transition-colors duration-200"
          >
            Select Directory
          </Button>
        </div>
      )}
    </div>
    {/* Render quick-kill recommendations below the drop zone */}
    <QuickKillList files={files} />
    </>
  );
}

// Custom JSX global compilation bindings for non-standard HTML5 directory attributes
declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}