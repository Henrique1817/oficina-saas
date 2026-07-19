"use client";

import { SmoothScroll } from "@/components/layout/smooth-scroll";
import { CustomCursor } from "@/components/layout/custom-cursor";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SmoothScroll />
      <CustomCursor />
      {children}
    </>
  );
}
