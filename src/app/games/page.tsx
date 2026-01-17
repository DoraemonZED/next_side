"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Gamepad2, Loader2 } from "lucide-react"

interface GameInfo {
  name: string;
  title: string;
  description: string;
}

export default function GamesPage() {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGames() {
      try {
        const response = await fetch('/api/games');
        if (!response.ok) {
          throw new Error('获取游戏列表失败');
        }
        const data = await response.json();
        setGames(data.games || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误');
        console.error('Error fetching games:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, []);

  const handleStartGame = (gameName: string) => {
    // 在新标签页打开游戏
    window.open(`/api/game/${gameName}`, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-10 md:py-16 text-center">
      <div className="flex flex-col items-center gap-4 md:gap-6 max-w-2xl mx-auto">
        <div className="p-3 md:p-4 rounded-full bg-primary/10">
          <Gamepad2 className="h-8 w-8 md:h-12 md:w-12 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">游戏中心</h1>
        <p className="text-lg md:text-xl text-muted-foreground">这里是我开发或收藏的一些趣味小游戏。</p>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-red-500 py-12">
            <p>{error}</p>
          </div>
        ) : games.length === 0 ? (
          <div className="text-muted-foreground py-12">
            <p>暂无游戏</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full mt-6 md:mt-8">
            {games.map((game) => (
              <div 
                key={game.name}
                className="p-6 md:p-8 border rounded-2xl bg-card flex flex-col items-center gap-4"
              >
                <div className="text-2xl md:text-3xl font-bold">{game.title}</div>
                <p className="text-xs md:text-sm text-muted-foreground">{game.description}</p>
                <Button 
                  className="w-full h-10 md:h-11"
                  onClick={() => handleStartGame(game.name)}
                >
                  开始游戏
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

