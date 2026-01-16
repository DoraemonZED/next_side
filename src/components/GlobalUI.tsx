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
      {/* 全屏 Loading */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm font-medium text-primary animate-pulse">正在处理中...</p>
          </div>
        </div>
      )}

      {/* 自定义确认弹窗 */}
      <Dialog open={!!confirm} onOpenChange={(open) => !open && hideConfirm()}>
        <DialogContent className="sm:max-w-[400px] border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              {confirm?.title || "确认操作"}
            </DialogTitle>
            <DialogDescription className="py-4 text-muted-foreground">
              {confirm?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={hideConfirm}>
              取消
            </Button>
            <Button
              variant="default"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
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

      {/* 轻量级提示 Toast */}
      {toast && (
        <div className={cn(
          "fixed top-8 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border transition-all duration-500 animate-in slide-in-from-top-4",
          toast.type === 'success' && "bg-primary/10 border-primary/30 text-primary",
          toast.type === 'error' && "bg-destructive/10 border-destructive/30 text-destructive",
          toast.type === 'info' && "bg-accent border-border text-foreground"
        )}>
          {toast.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
          {toast.type === 'error' && <AlertCircle className="h-5 w-5" />}
          {toast.type === 'info' && <Info className="h-5 w-5" />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </>
  );
}
