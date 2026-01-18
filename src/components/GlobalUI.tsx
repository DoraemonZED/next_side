"use client";

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
import { Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function GlobalUI() {
  const { 
    isLoading, 
    toast, 
    confirm, 
    hideConfirm, 
    hideToast 
  } = useUIStore();

  return (
    <>
      {/* 全屏 Loading - 使用 rem 实现响应式缩放 */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="flex flex-col items-center gap-[1rem]">
            <Loader2 className="h-[3rem] w-[3rem] animate-spin text-primary" />
            <p className="text-[0.875rem] font-medium text-primary animate-pulse">正在处理中...</p>
          </div>
        </div>
      )}

      {/* 自定义确认弹窗 - 使用 rem 实现响应式缩放 */}
      <Dialog open={!!confirm} onOpenChange={(open) => !open && hideConfirm()}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[25rem] border-primary/20 p-[1.5rem]">
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
          "fixed top-[2rem] left-1/2 -translate-x-1/2 z-[110] flex items-center gap-[0.75rem] px-[1.5rem] py-[0.75rem] rounded-full shadow-2xl border transition-all duration-500 animate-in slide-in-from-top-4 max-w-[calc(100vw-2rem)]",
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
