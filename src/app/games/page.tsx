import { Button } from "@/components/ui/button"
import { Gamepad2 } from "lucide-react"

export default function GamesPage() {
  return (
    <div className="container mx-auto px-4 py-10 md:py-16 text-center">
      <div className="flex flex-col items-center gap-4 md:gap-6 max-w-2xl mx-auto">
        <div className="p-3 md:p-4 rounded-full bg-primary/10">
          <Gamepad2 className="h-8 w-8 md:h-12 md:w-12 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">游戏中心</h1>
        <p className="text-lg md:text-xl text-muted-foreground">这里是我开发或收藏的一些趣味小游戏。</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full mt-6 md:mt-8">
          <div className="p-6 md:p-8 border rounded-2xl bg-card flex flex-col items-center gap-4">
            <div className="text-2xl md:text-3xl font-bold">2048</div>
            <p className="text-xs md:text-sm text-muted-foreground">经典的数字合并游戏</p>
            <Button className="w-full h-10 md:h-11">开始游戏</Button>
          </div>
          <div className="p-6 md:p-8 border rounded-2xl bg-card flex flex-col items-center gap-4">
            <div className="text-2xl md:text-3xl font-bold">贪吃蛇</div>
            <p className="text-xs md:text-sm text-muted-foreground">怀旧风格的复古小游戏</p>
            <Button className="w-full h-10 md:h-11">开始游戏</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

