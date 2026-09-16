"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useUIStore } from "@/store/useUIStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function GlobalUI() {
  const { 
    isLoading, 
    toast, 
    confirm, 
    hideConfirm
  } = useUIStore();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [maskKind, setMaskKind] = useState<"navigation" | "request">("request");
  const [maskPhase, setMaskPhase] = useState<"hidden" | "visible" | "leaving">("hidden");
  const maskPhaseRef = useRef(maskPhase);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleSinceRef = useRef(0);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routePushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentLocationRef = useRef("");
  const isNavigatingRef = useRef(false);
  const navigationStartedAtRef = useRef(0);
  const lockedScrollYRef = useRef(0);
  const isMaskActive = isLoading || isNavigating;

  useEffect(() => {
    currentLocationRef.current = `${pathname}?${searchParams.toString()}`;
    if (isNavigatingRef.current) {
      if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current);
      // Prefetched routes can finish before the regular mask's show delay.
      // Keep a deliberate navigation active briefly so every page change gets
      // the same visual hand-off as a network-bound transition.
      const remaining = Math.max(0, 320 - (Date.now() - navigationStartedAtRef.current));
      navigationTimeoutRef.current = setTimeout(() => {
        isNavigatingRef.current = false;
        navigationTimeoutRef.current = null;
        setIsNavigating(false);
      }, remaining);
    }
  }, [pathname, searchParams]);

  // Next.js route requests are deliberately excluded from the request mask
  // below, because it also sees background prefetches. Start this mask from a
  // deliberate same-tab link click instead, then end it once the new route is
  // rendered.
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;

      const link = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target || link.hasAttribute("download") || link.dataset.noPageTransition !== undefined) return;

      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.hash) return;

      const nextLocation = `${destination.pathname}?${destination.searchParams.toString()}`;
      if (nextLocation === currentLocationRef.current) return;

      // Cover the current page before handing control to Next. Without this,
      // a prefetched route can commit before React has painted the mask.
      event.preventDefault();
      isNavigatingRef.current = true;
      navigationStartedAtRef.current = Date.now();
      setIsNavigating(true);
      // Do not leave the UI blocked if a navigation is cancelled or fails.
      if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = setTimeout(() => {
        isNavigatingRef.current = false;
        setIsNavigating(false);
      }, 10000);
      if (routePushTimerRef.current) clearTimeout(routePushTimerRef.current);
      routePushTimerRef.current = setTimeout(() => {
        routePushTimerRef.current = null;
        router.push(`${destination.pathname}${destination.search}`);
      }, 140);
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current);
      if (routePushTimerRef.current) clearTimeout(routePushTimerRef.current);
    };
  }, [router]);

  useEffect(() => () => {
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (removeTimerRef.current) clearTimeout(removeTimerRef.current);
    if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current);
  }, []);

  // Radix locks modal scrolling by changing the body's overflow. On some
  // browsers that change resets the document's current scroll position before
  // the dialog has painted, which makes a fixed/sticky shell visibly jump.
  // Preserve the latest unlocked position for every Dialog, not just confirms.
  useEffect(() => {
    const rememberScrollPosition = () => {
      if (!document.body.hasAttribute("data-scroll-locked")) {
        lockedScrollYRef.current = window.scrollY;
      }
    };
    const restoreAfterLock = () => {
      if (!document.body.hasAttribute("data-scroll-locked")) return;
      const targetY = lockedScrollYRef.current;
      requestAnimationFrame(() => {
        if (document.body.hasAttribute("data-scroll-locked") && Math.abs(window.scrollY - targetY) > 1) {
          window.scrollTo(0, targetY);
        }
      });
    };

    rememberScrollPosition();
    window.addEventListener("scroll", rememberScrollPosition, { passive: true });
    const observer = new MutationObserver(restoreAfterLock);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-scroll-locked"] });
    return () => {
      window.removeEventListener("scroll", rememberScrollPosition);
      observer.disconnect();
    };
  }, []);

  // Avoid a flashing mask for short requests. Once it has appeared, keep it on
  // screen long enough for the transition to read as intentional, then fade out.
  useEffect(() => {
    const showDelay = isNavigating ? 0 : 180;
    const minimumVisibleTime = 600;
    const exitDuration = 400;

    if (isMaskActive) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (removeTimerRef.current) clearTimeout(removeTimerRef.current);
      hideTimerRef.current = null;
      removeTimerRef.current = null;

      if (maskPhaseRef.current === "leaving") {
        maskPhaseRef.current = "visible";
        setMaskPhase("visible");
      }

      if (maskPhaseRef.current === "hidden" && !showTimerRef.current) {
        showTimerRef.current = setTimeout(() => {
          showTimerRef.current = null;
          // Keep the copy tied to the action that opened this mask. A fast
          // route can complete while its minimum display time still runs.
          setMaskKind(isNavigatingRef.current ? "navigation" : "request");
          visibleSinceRef.current = Date.now();
          maskPhaseRef.current = "visible";
          setMaskPhase("visible");
        }, showDelay);
      }
      return;
    }

    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (maskPhaseRef.current !== "visible" || hideTimerRef.current) return;

    const remaining = Math.max(0, minimumVisibleTime - (Date.now() - visibleSinceRef.current));
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      maskPhaseRef.current = "leaving";
      setMaskPhase("leaving");
      removeTimerRef.current = setTimeout(() => {
        removeTimerRef.current = null;
        maskPhaseRef.current = "hidden";
        setMaskPhase("hidden");
      }, exitDuration);
    }, remaining);
  }, [isMaskActive, isNavigating]);

  // Next.js prefetches links as they enter the viewport. Those background RSC
  // requests should never trigger a blocking request mask while the user scrolls.
  useEffect(() => {
    const nativeFetch = window.fetch;
    const trackedFetch: typeof window.fetch = (...args) => {
      const [input, init] = args;
      const request = input instanceof Request ? input : null;
      const headers = new Headers(init?.headers ?? request?.headers);
      const url = request?.url ?? (typeof input === "string" ? input : input.toString());
      const isNextBackgroundRequest =
        headers.has("RSC") ||
        headers.has("Next-Router-Prefetch") ||
        headers.has("Next-Router-State-Tree") ||
        new URL(url, window.location.href).searchParams.has("_rsc");

      if (isNextBackgroundRequest || new URL(url, window.location.href).pathname === "/api/auth/me") {
        return nativeFetch.apply(window, args);
      }

      useUIStore.getState().beginLoading();
      return nativeFetch.apply(window, args).finally(() => useUIStore.getState().endLoading());
    };
    window.fetch = trackedFetch;
    return () => {
      if (window.fetch === trackedFetch) window.fetch = nativeFetch;
    };
  }, []);

  return (
    <>
      {/* 全屏 Loading - 使用 rem 实现响应式缩放 */}
      {maskPhase !== "hidden" && (
        <div className={`request-mask ${maskPhase === "leaving" ? "is-leaving" : ""}`} role="status" aria-live="polite" aria-label={maskKind === "navigation" ? "页面切换中" : "请求处理中"}>
          <div className="request-mask__glow" aria-hidden="true" />
          <div className="request-mask__panel">
            <div className="request-mask__mark" aria-hidden="true"><i /><i /><i /></div>
            <div>
              <strong><span className="request-mask__activity" aria-hidden="true"><i /><i /><i /></span>{maskKind === "navigation" ? "PAGE TRANSITION" : "REQUEST IN PROGRESS"}</strong>
            </div>
          </div>
        </div>
      )}

      {/* 自定义确认弹窗 - 使用 rem 实现响应式缩放 */}
      <Dialog open={!!confirm} onOpenChange={(open) => !open && hideConfirm()}>
        <DialogContent className="confirm-dialog max-w-[calc(100vw-2rem)] sm:max-w-[25rem] border-primary/20 p-[1.5rem]">
          <DialogHeader>
            <DialogTitle className="text-[1.25rem] font-bold text-foreground">
              {confirm?.title || "确认操作"}
            </DialogTitle>
            <DialogDescription className="py-[1rem] text-[0.9375rem] text-muted-foreground">
              {confirm?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-[0.5rem] sm:gap-0">
            <Button variant="ghost" className="text-[0.875rem] h-[2.5rem] px-[1rem]" onClick={hideConfirm}>
              取消
            </Button>
            <Button
              variant="default"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-[0.875rem] h-[2.5rem] px-[1rem]"
              onClick={() => {
                confirm?.onConfirm();
                hideConfirm();
              }}
            >
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 轻量级提示 Toast - 使用 rem 实现响应式缩放 */}
      {toast && (
        <div className={cn(
          "fixed top-[2rem] left-1/2 -translate-x-1/2 z-[300] flex items-center gap-[0.75rem] px-[1.5rem] py-[0.75rem] rounded-full shadow-2xl border transition-all duration-500 animate-in slide-in-from-top-4 max-w-[calc(100vw-2rem)]",
          toast.type === 'success' && "bg-primary/10 border-primary/30 text-primary",
          toast.type === 'error' && "bg-destructive/10 border-destructive/30 text-destructive",
          toast.type === 'info' && "bg-accent border-border text-foreground"
        )}>
          {toast.type === 'success' && <CheckCircle2 className="h-[1.25rem] w-[1.25rem] shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="h-[1.25rem] w-[1.25rem] shrink-0" />}
          {toast.type === 'info' && <Info className="h-[1.25rem] w-[1.25rem] shrink-0" />}
          <span className="font-medium text-[0.9375rem]">{toast.message}</span>
        </div>
      )}
    </>
  );
}
