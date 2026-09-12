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
  const pullDistanceRef = useRef(0);
  const isPullingRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  const threshold = 80; // 触发刷新的阈值
  const maxPull = 120; // 最大下拉距离

  const setPullDistanceAtNextFrame = useCallback((distance: number) => {
    pullDistanceRef.current = distance;

    if (animationFrameRef.current !== null) return;

    animationFrameRef.current = requestAnimationFrame(() => {
      animationFrameRef.current = null;
      setPullDistance(pullDistanceRef.current);
    });
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // 只有在页面顶部才启用下拉刷新
    if (window.scrollY === 0 && !isRefreshingRef.current) {
      startY.current = e.touches[0].clientY;
      isPullingRef.current = true;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPullingRef.current || isRefreshingRef.current) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    // 只有向下拉才响应
    if (diff > 0 && window.scrollY === 0) {
      // 使用阻尼效果，拉得越远阻力越大
      const dampedPull = Math.min(diff * 0.5, maxPull);
      // 触摸事件可在一帧内触发多次；仅在下一帧更新界面，避免滚动时反复渲染。
      setPullDistanceAtNextFrame(dampedPull);
      
      // 阻止页面滚动
      if (dampedPull > 10) {
        e.preventDefault();
      }
    }
  }, [setPullDistanceAtNextFrame]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return;

    isPullingRef.current = false;
    setIsPulling(false);

    if (pullDistanceRef.current >= threshold && !isRefreshingRef.current) {
      isRefreshingRef.current = true;
      setIsRefreshing(true);
      setPullDistanceAtNextFrame(threshold);

      // 执行刷新
      try {
        router.refresh();
        // 等待一小段时间让用户看到刷新效果
        await new Promise(resolve => setTimeout(resolve, 800));
      } finally {
        isRefreshingRef.current = false;
        setIsRefreshing(false);
        setPullDistanceAtNextFrame(0);
      }
    } else {
      // 回弹动画
      setPullDistanceAtNextFrame(0);
    }
  }, [router, setPullDistanceAtNextFrame]);

  const handleTouchCancel = useCallback(() => {
    isPullingRef.current = false;
    setIsPulling(false);
    setPullDistanceAtNextFrame(0);
  }, [setPullDistanceAtNextFrame]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 使用 passive: false 以便可以调用 preventDefault
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);

  useEffect(() => () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const progress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;

  return (
    <div ref={containerRef} className="relative">
      {/* 下拉刷新指示器 */}
      <div
        className="fixed left-1/2 z-[200] flex items-center justify-center transition-[transform,opacity] duration-200 pointer-events-none will-change-transform"
        style={{
          // 仅合成层中的提示器跟随手势移动，避免每帧平移整页长内容导致拖拽卡顿。
          transform: `translate3d(-50%, ${Math.max(pullDistance - 50, -50)}px, 0)`,
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

      {/* 内容保持原位，避免长页面在触摸移动期间反复触发布局与绘制。 */}
      {children}
    </div>
  );
}
