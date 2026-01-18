"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowDown } from "lucide-react";

interface PullToRefreshProps {
  children: React.ReactNode;
}

export function PullToRefresh({ children }: PullToRefreshProps) {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const threshold = 80; // 触发刷新的阈值
  const maxPull = 120; // 最大下拉距离

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // 只有在页面顶部才启用下拉刷新
    if (window.scrollY === 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    // 只有向下拉才响应
    if (diff > 0 && window.scrollY === 0) {
      // 使用阻尼效果，拉得越远阻力越大
      const dampedPull = Math.min(diff * 0.5, maxPull);
      setPullDistance(dampedPull);
      
      // 阻止页面滚动
      if (dampedPull > 10) {
        e.preventDefault();
      }
    }
  }, [isPulling, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);

      // 执行刷新
      try {
        router.refresh();
        // 等待一小段时间让用户看到刷新效果
        await new Promise(resolve => setTimeout(resolve, 800));
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // 回弹动画
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, isRefreshing, router]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 使用 passive: false 以便可以调用 preventDefault
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;

  return (
    <div ref={containerRef} className="relative">
      {/* 下拉刷新指示器 */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center justify-center transition-all duration-200 pointer-events-none"
        style={{
          top: `${Math.max(pullDistance - 50, -50)}px`,
          opacity: pullDistance > 10 ? 1 : 0,
        }}
      >
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full bg-background border shadow-lg transition-all duration-200 ${
            shouldTrigger ? "border-primary bg-primary/10" : "border-border"
          }`}
        >
          {isRefreshing ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <ArrowDown
              className={`h-5 w-5 transition-all duration-200 ${
                shouldTrigger ? "text-primary" : "text-muted-foreground"
              }`}
              style={{
                transform: `rotate(${shouldTrigger ? 180 : 0}deg)`,
              }}
            />
          )}
        </div>
      </div>

      {/* 下拉时的内容偏移 */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? "none" : "transform 0.3s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
