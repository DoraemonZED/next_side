import { GamesClient } from "./GamesClient"
import { gameService } from "@/lib/gameService"

export default async function GamesPage() {
  const games = await gameService.getGames()
  return <GamesClient initialGames={games} />
}
