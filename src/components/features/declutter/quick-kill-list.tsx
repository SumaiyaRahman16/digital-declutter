"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileMetadata {
  name: string;
  path: string;
  size: number;
  type: string;
  lastModified: number;
}

interface QuickKillListProps {
  files: FileMetadata[];
}

export function QuickKillList({ files }: QuickKillListProps) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
  }, []);

  if (files.length === 0 || now === null) return null;

  // Helper function to format bytes into readable sizes (MB, KB)
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Helper function to calculate days since last modified
  const getDaysAgo = (timestamp: number) => {
    const diffTime = Math.abs(now - timestamp);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days ago`;
  };

  // Simple local sorting calculation: Size (in KB) * approximate age factor
  // This mirrors what your Go backend will calculate formally later!
  const sortedFiles = [...files].sort((a, b) => {
    const scoreA = (a.size / 1024) * (now - a.lastModified);
    const scoreB = (b.size / 1024) * (now - b.lastModified);
    return scoreB - scoreA;
  });

  return (
    <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 mt-8 text-left">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="h-5 w-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-foreground tracking-tight">
          Quick Kill Recommendations
        </h3>
      </div>
      
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[40%]">File Name</TableHead>
              <TableHead>Path</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedFiles.map((file, index) => (
              <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate max-w-[180px]" title={file.name}>
                    {file.name}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs max-w-[150px] truncate" title={file.path}>
                  {file.path}
                </TableCell>
                <TableCell className="text-foreground font-medium">
                  {formatSize(file.size)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {getDaysAgo(file.lastModified)}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}