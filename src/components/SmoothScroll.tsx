"use client";

import { useEffect, ReactNode } from "react";
import Lenis from "lenis";

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.0, // 降低持续时间，减少阻尼感，让滚动更快响应
      easing: (t) => {
        // 使用更平滑的缓动函数，增加滚动结束后的惯性
        // 这个缓动函数会让滚动开始时更快，结束时更平滑，惯性更大
        return 1 - Math.pow(1 - t, 2.5);
      },
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 3.0, // 增加滚轮灵敏度，让滚动更流畅
      touchMultiplier: 3.0, // 增加触摸滚动灵敏度
      lerp: 0.1, // 增加平滑度，让滚动更流畅
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
