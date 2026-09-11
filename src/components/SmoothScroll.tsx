"use client";

import { useEffect, ReactNode } from "react";
import Lenis from "lenis";

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      // 过高的倍率会让每个滚轮事件跨过太多像素，主线程稍忙时就会显得顿挫。
      wheelMultiplier: 1,
      touchMultiplier: 1,
      // 比默认值更快地追上输入，保留滚轮的柔和感而不引入明显滞后。
      lerp: 0.16,
      // 交给 Lenis 管理单一的动画帧及其销毁，避免 Strict Mode/路由切换后遗留 RAF 循环。
      autoRaf: true,
      respectReducedMotion: true,
    });

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
