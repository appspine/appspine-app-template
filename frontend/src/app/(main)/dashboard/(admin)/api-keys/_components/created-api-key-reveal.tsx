"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import type { CreateApiKeyResponse } from "../types";

export function CreatedApiKeyReveal({ created, onDone }: { created: CreateApiKeyResponse; onDone: () => void }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(created.key);
    setCopied(true);
  }

  return (
    <div>
      <DialogHeader>
        <DialogTitle>API key created</DialogTitle>
        <DialogDescription>
          Copy this key now — it won&apos;t be shown again. Only the prefix is kept for display afterwards.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2 py-4">
        <div className="break-all rounded-md border bg-muted p-3 font-mono text-sm">{created.key}</div>
        <Button type="button" variant="outline" onClick={handleCopy}>
          {copied ? "Copied" : "Copy to clipboard"}
        </Button>
      </div>
      <DialogFooter>
        <Button type="button" onClick={onDone} disabled={!copied}>
          I&apos;ve copied it, done
        </Button>
      </DialogFooter>
    </div>
  );
}
