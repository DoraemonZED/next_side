// Pixel-space simulation, independent of React and the rendering frame rate.
export type Shot = { x: number; y: number; vx: number; vy: number; hostile: boolean }
type Enemy = { x: number; y: number; phase: number; fireIn: number }
type Spark = { x: number; y: number; vx: number; vy: number; life: number }

export class ParticleFlight {
  running = false
  score = 0
  width = 1
  height = 1
  player = { x: 0, y: 0 }
  target = { x: 0, y: 0 }
  shots: Shot[] = []
  enemies: Enemy[] = []
  sparks: Spark[] = []
  private spawnIn = .7
  private fireIn = 0
  private age = 0

  constructor(private random: () => number = Math.random) {}

  start(width: number, height: number, x: number, y: number) {
    this.width = width
    this.height = height
    this.player = { x, y }
    this.target = { x, y }
    this.shots = []
    this.enemies = []
    this.sparks = []
    this.score = 0
    this.spawnIn = 2
    this.fireIn = 0
    this.age = 0
    this.running = true
  }

  stop() { this.running = false }

  private burst(x: number, y: number) {
    for (let i = 0; i < 28; i++) {
      const angle = this.random() * Math.PI * 2
      const speed = 20 + this.random() * 65
      this.sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1 })
    }
  }

  update(dt: number) {
    this.sparks = this.sparks.filter(s => {
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt
      return s.life > 0
    })
    if (!this.running) return
    this.age += dt
    const follow = 1 - Math.exp(-18 * dt)
    this.player.x += (Math.max(18, Math.min(this.width - 18, this.target.x)) - this.player.x) * follow
    this.player.y += (Math.max(24, Math.min(this.height - 18, this.target.y)) - this.player.y) * follow
    this.fireIn -= dt
    this.spawnIn -= dt
    if (this.fireIn <= 0) {
      this.shots.push({ x: this.player.x, y: this.player.y - 17, vx: 0, vy: -340, hostile: false })
      this.fireIn = .22
    }
    if (this.spawnIn <= 0 && this.enemies.length < 7) {
      this.enemies.push({ x: 25 + this.random() * (this.width - 50), y: 22, phase: this.random() * 6.28, fireIn: .6 })
      this.spawnIn = Math.max(.65, 1.5 - this.score * .001)
    }
    for (const enemy of this.enemies) {
      enemy.y += 26 * dt
      enemy.x = Math.max(20, Math.min(this.width - 20, enemy.x + Math.sin(this.age * 1.4 + enemy.phase) * 19 * dt))
      enemy.fireIn -= dt
      if (enemy.fireIn <= 0) {
        const dx = this.player.x - enemy.x, dy = this.player.y - enemy.y
        const length = Math.max(1, Math.hypot(dx, dy))
        this.shots.push({ x: enemy.x, y: enemy.y + 14, vx: dx / length * 135, vy: dy / length * 135, hostile: true })
        enemy.fireIn = 1.3 + this.random() * .6
      }
    }
    this.shots = this.shots.filter(shot => {
      const oldX = shot.x, oldY = shot.y
      shot.x += shot.vx * dt; shot.y += shot.vy * dt
      // Segment collision prevents fast bullets from passing through a plane.
      const hit = (x: number, y: number, radius: number) => {
        const dx = shot.x - oldX, dy = shot.y - oldY
        const t = Math.max(0, Math.min(1, ((x - oldX) * dx + (y - oldY) * dy) / Math.max(.001, dx * dx + dy * dy)))
        return Math.hypot(x - oldX - dx * t, y - oldY - dy * t) < radius
      }
      if (shot.hostile && this.running && this.age > 2.2 && hit(this.player.x, this.player.y, 10)) {
        this.running = false
        this.burst(this.player.x, this.player.y)
        return false
      }
      if (!shot.hostile) {
        const index = this.enemies.findIndex(enemy => hit(enemy.x, enemy.y, 17))
        if (index >= 0) {
          const enemy = this.enemies.splice(index, 1)[0]
          this.burst(enemy.x, enemy.y)
          this.score += 100
          return false
        }
      }
      return shot.y > -15 && shot.y < this.height + 15 && shot.x > 0 && shot.x < this.width
    })
    this.enemies = this.enemies.filter(enemy => enemy.y < this.height + 20)
  }
}

export const FLIGHT_PARTICLES = 2400
const digits = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111']

// The same points that form the background become planes, shots and score digits.
export function flightTargets(game: ParticleFlight, output: Float32Array) {
  output.fill(0)
  let index = 0
  const dot = (x: number, y: number, size = 1.5, alpha = .8) => {
    if (index >= FLIGHT_PARTICLES) return
    output.set([x / game.width, 1 - y / game.height, size, alpha], index++ * 4)
  }
  const line = (x1: number, y1: number, x2: number, y2: number, hostile = false) => {
    const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 2)
    for (let i = 0; i <= steps; i++) dot(x1 + (x2 - x1) * i / steps, y1 + (y2 - y1) * i / steps, hostile ? -1.6 : 1.6)
  }
  const plane = (x: number, y: number, hostile = false) => {
    if (hostile) {
      const triangle = [[0, 17], [-15, -11], [15, -11], [0, 17]]
      for (let i = 1; i < triangle.length; i++) {
        const [ax, ay] = triangle[i - 1], [bx, by] = triangle[i]
        line(x + ax, y + ay, x + bx, y + by, true)
      }
      return
    }
    const outline = [[0, -18], [5, -3], [17, 8], [5, 5], [5, 12], [0, 9], [-5, 12], [-5, 5], [-17, 8], [-5, -3], [0, -18]]
    for (let i = 1; i < outline.length; i++) {
      const [ax, ay] = outline[i - 1], [bx, by] = outline[i]
      line(x + ax, y + ay, x + bx, y + by)
    }
  }
  const score = String(game.score).padStart(5, '0')
  for (let d = 0; d < score.length; d++) {
    const pattern = digits[Number(score[d])]
    for (let i = 0; i < 15; i++) if (pattern[i] === '1') {
      dot(game.width - 20 - (score.length - d) * 17 + (i % 3) * 4, 20 + Math.floor(i / 3) * 4, 2.2, .95)
    }
  }
  if (game.running) plane(game.player.x, game.player.y)
  game.enemies.forEach(enemy => plane(enemy.x, enemy.y, true))
  game.shots.forEach(shot => line(shot.x, shot.y, shot.x - shot.vx * .018, shot.y - shot.vy * .018, shot.hostile))
  game.sparks.forEach(spark => dot(spark.x, spark.y, 2, spark.life))
}
