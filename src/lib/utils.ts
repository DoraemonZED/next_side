import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化浏览量：三位数用k，四位数用w，超过100w用+
export function formatViews(views: number): string {
  if (views >= 1000000) {
    return '100w+';
  } else if (views >= 10000) {
    return (views / 10000).toFixed(1).replace(/\.0$/, '') + 'w';
  } else if (views >= 1000) {
    return (views / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return views.toString();
}
