"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const isVisibleRef = useRef(false);

  useEffect(() => {
    let animationFrame: number | null = null;
    const toggleVisibility = () => {
      if (animationFrame !== null) return;

      animationFrame = requestAnimationFrame(() => {
        animationFrame = null;
        const nextIsVisible = window.scrollY > 300;
        if (nextIsVisible !== isVisibleRef.current) {
          isVisibleRef.current = nextIsVisible;
          setIsVisible(nextIsVisible);
        }
      });
    };

    toggleVisibility();
    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <Button
      variant="default"
      size="icon"
      className={cn(
        "fixed bottom-8 right-8 z-50 rounded-full shadow-lg transition-all duration-300 hover:scale-110",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
      )}
      onClick={scrollToTop}
      aria-label="Back to top"
    >
      <ChevronUp className="h-6 w-6" />
    </Button>
  );
}
