"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopySignupLink() {
  const [copied, setCopied] = useState(false);
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "";

  async function copy() {
    const url = `${base.replace(/\/$/, "")}/signup`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={copy}>
      {copied ? "Link copiado" : "Copiar link /signup"}
    </Button>
  );
}
