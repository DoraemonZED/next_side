'use client'

import { useEffect, useRef } from 'react'
import { BORDER_PARTICLES, FLIGHT_PARTICLES, ParticleFlight, flightTargets } from './particleFlight'

const vertex = `
attribute vec3 aPosition;
attribute float aSeed;
attribute float aIndex;
attribute vec4 aGame;
uniform float uTime;
uniform float uMode;
uniform vec2 uPointer;
uniform float uAspect;
uniform float uPixelRatio;
uniform vec2 uOffset;
uniform float uScale;
uniform float uScroll;
uniform float uPointerActive;
uniform float uGameMix;
uniform float uBoundary;
uniform vec4 uArena;
uniform float uGameTime;
varying float vAlpha;
varying float vSeed;
varying float vInfluence;
varying float vEnemy;
float hash(float n) { return fract(sin(n) * 43758.5453123); }
void main() {
  float t = uTime * .10;
  vec3 p = aPosition;
  float wave = sin(p.y * 11.0 + t * 3.0 + aSeed * 2.0) * .065;
  p *= 1.0 + wave;
  float angle = atan(p.z, p.x);
  vec3 ring = vec3((.85 + p.y * .27) * cos(angle), p.x * .18 + sin(angle * 3.0 + t) * .09, (.85 + p.y * .27) * sin(angle));
  vec3 flow = vec3(p.x * 1.15, p.y * .55 + sin(p.x * 4.0 + t * 2.0) * .3, p.z * .6);
  p = mix(p, ring, clamp(uMode, 0.0, 1.0));
  p = mix(p, flow, clamp(uMode - 1.0, 0.0, 1.0));
  float ry = t + uPointer.x * .14 + uScroll * .12;
  p.xz = mat2(cos(ry), -sin(ry), sin(ry), cos(ry)) * p.xz;
  float rx = -.24 + uPointer.y * .22;
  p.yz = mat2(cos(rx), -sin(rx), sin(rx), cos(rx)) * p.yz;
  float perspective = 2.9 / (2.9 - p.z);
  vec2 orb = vec2(p.x * perspective * .88 / max(uAspect, 1.1), p.y * perspective * .82);
  orb = orb * uScale + uOffset;

  float isField = step(.975, aSeed);
  vec2 dust = vec2(hash(aSeed * 813.7), hash(aSeed * 2137.1)) * 2.0 - 1.0;
  dust += vec2(sin(t + aSeed * 80.0), cos(t * .7 + aSeed * 53.0)) * .003;
  vec2 clipPosition = mix(orb, dust, isField);

  vec2 cursor = vec2(uPointer.x, -uPointer.y);
  vec2 fromCursor = clipPosition - cursor;
  float cursorDistance = length(fromCursor);
  float influence = (1.0 - smoothstep(.0, .34, cursorDistance)) * uPointerActive;
  float ripple = sin(cursorDistance * 42.0 - uTime * 3.4) * .014;
  clipPosition += normalize(fromCursor + vec2(.0001)) * influence * (.07 + ripple);
  clipPosition.y += sin(uScroll * .8 + aSeed * 4.0) * .012 * (1.0 - isField);

  gl_Position = vec4(clipPosition, 0.0, 1.0);
  gl_PointSize = (1.0 + aSeed * 1.15 + influence * 2.2) * uPixelRatio * mix(perspective, 1.0, isField);
  vAlpha = mix((.18 + smoothstep(-1.0, 1.0, p.z) * .72) * (.55 + .45 * sin(aSeed * 30.0 + t)), .18, isField);
  vSeed = aSeed;
  vInfluence = influence;
  // Unreserved points collect into drifting asteroid contours within the arena.
  float group = floor((aIndex - 2400.0) / 330.0);
  float angleRock = aIndex * 2.399963;
  vec2 rock = vec2(fract(hash(group * 8.3) + sin(uGameTime * .12 + group) * .06),
    1.12 - fract(hash(group * 9.7) + uGameTime * (.017 + hash(group) * .012)) * 1.24);
  float radius = (.013 + hash(group * 5.7) * .024) * (.85 + sin(angleRock * 5.0 + group) * .15);
  rock += vec2(cos(angleRock), sin(angleRock)) * radius * (.45 + .55 * hash(aIndex));
  vec2 target = mix(rock, aGame.xy, step(0.0, aGame.w));
  // Preserve the sparse ambient dust while the main particle object transforms.
  float ambient = isField * step(2400.0, aIndex);
  float blend = max(uGameMix * (1.0 - ambient), (1.0 - step(520.0, aIndex)) * uBoundary);
  gl_Position.xy = mix(clipPosition, uArena.xy + target * uArena.zw, blend);
  float targetAlpha = aGame.w < 0.0 ? .22 : aGame.w;
  targetAlpha *= step(0.0, target.x) * step(target.x, 1.0) * step(0.0, target.y) * step(target.y, 1.0);
  gl_PointSize = mix(gl_PointSize, (aGame.w < 0.0 ? 1.1 : abs(aGame.z)) * uPixelRatio, blend);
  vAlpha = mix(vAlpha, targetAlpha, blend);
  vEnemy = step(aGame.z, -.1) * uGameMix;
}`
const fragment = `
precision mediump float;
varying float vAlpha;
varying float vSeed;
varying float vInfluence;
varying float vEnemy;
uniform float uDark;
void main() {
  float d = length(gl_PointCoord - .5) * 2.0;
  if (d > 1.0) discard;
  vec3 lightColor = mix(vec3(.02, .20, .12), vec3(.10, .52, .31), vSeed);
  vec3 darkColor = mix(vec3(.19, .65, .49), vec3(.72, 1.0, .82), vSeed);
  vec3 color = mix(lightColor, darkColor, uDark);
  color = mix(color, mix(vec3(.06, .48, .28), vec3(.82, 1.0, .88), uDark), vInfluence);
  color = mix(color, vec3(.93, .66, .44), vEnemy);
  gl_FragColor = vec4(color, (1.0 - d * d) * (vAlpha + vInfluence * .55) * mix(2.35, 1.0, uDark));
}`

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const arena = canvas.parentElement?.querySelector<HTMLElement>('.particle-arena')
    if (!arena) return
    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' })
    if (!gl) return
    const shaders: WebGLShader[] = []
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      shaders.push(shader)
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
    }
    const vs = compile(gl.VERTEX_SHADER, vertex)
    const fs = compile(gl.FRAGMENT_SHADER, fragment)
    const program = gl.createProgram()
    if (!vs || !fs || !program) { shaders.forEach(s => gl.deleteShader(s)); return }
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      shaders.forEach(s => gl.deleteShader(s)); gl.deleteProgram(program); return
    }
    gl.useProgram(program)
    const count = window.innerWidth < 768 ? 10000 : 22000
    const data = new Float32Array(count * 5)
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2
      const radius = Math.sqrt(1 - y * y)
      const theta = i * 2.399963 + Math.sin(y * 18) * .12
      data.set([Math.cos(theta) * radius, y, Math.sin(theta) * radius, ((i * 7919) % 1000) / 1000, i], i * 5)
    }
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'aPosition')
    const seed = gl.getAttribLocation(program, 'aSeed')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 20, 0)
    gl.enableVertexAttribArray(seed)
    gl.vertexAttribPointer(seed, 1, gl.FLOAT, false, 20, 12)
    const indexAttribute = gl.getAttribLocation(program, 'aIndex')
    gl.enableVertexAttribArray(indexAttribute)
    gl.vertexAttribPointer(indexAttribute, 1, gl.FLOAT, false, 20, 16)
    const game = new ParticleFlight()
    const gameData = new Float32Array(count * 4)
    for (let i = FLIGHT_PARTICLES; i < count; i++) gameData[i * 4 + 3] = -1
    const targetData = gameData.subarray(0, FLIGHT_PARTICLES * 4)
    const gameBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, gameBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, gameData, gl.DYNAMIC_DRAW)
    const gameAttribute = gl.getAttribLocation(program, 'aGame')
    gl.enableVertexAttribArray(gameAttribute)
    gl.vertexAttribPointer(gameAttribute, 4, gl.FLOAT, false, 16, 0)
    const uniforms = Object.fromEntries(['uTime', 'uMode', 'uPointer', 'uAspect', 'uPixelRatio', 'uOffset', 'uScale', 'uScroll', 'uPointerActive', 'uDark', 'uArena', 'uGameMix', 'uBoundary', 'uGameTime'].map(key => [key, gl.getUniformLocation(program, key)]))
    gl.enable(gl.BLEND)
    let canvasBounds = canvas.getBoundingClientRect()
    let arenaBounds = arena.getBoundingClientRect()
    let inside = false
    const stop = () => { game.stop(); inside = false }
    const measure = () => {
      canvasBounds = canvas.getBoundingClientRect()
      arenaBounds = arena.getBoundingClientRect()
      game.width = Math.max(1, arenaBounds.width)
      game.height = Math.max(1, arenaBounds.height)
      gl.uniform4f(uniforms.uArena,
        (arenaBounds.left - canvasBounds.left) / canvasBounds.width * 2 - 1,
        1 - (arenaBounds.bottom - canvasBounds.top) / canvasBounds.height * 2,
        arenaBounds.width / canvasBounds.width * 2, arenaBounds.height / canvasBounds.height * 2)
    }
    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio, 1.5)
      canvas.width = Math.max(1, Math.round(bounds.width * dpr))
      canvas.height = Math.max(1, Math.round(bounds.height * dpr))
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform1f(uniforms.uAspect, canvas.width / canvas.height)
      gl.uniform1f(uniforms.uPixelRatio, dpr)
      const mobile = bounds.width < 768
      gl.uniform2f(uniforms.uOffset, mobile ? 0 : .39, mobile ? -.34 : .02)
      gl.uniform1f(uniforms.uScale, mobile ? 1.06 : 1.12)
      stop()
      measure()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    observer.observe(arena)
    resize()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finePointer = window.matchMedia('(any-hover: hover) and (any-pointer: fine)')
    let isDark = document.documentElement.classList.contains('dark')
    const pointer = { x: 0, y: 0, active: 0 }
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') { pointer.active = 0; stop(); return }
      pointer.x = isDark ? 0 : (event.clientX - canvasBounds.left) / canvasBounds.width * 2 - 1
      pointer.y = isDark ? 0 : (event.clientY - canvasBounds.top) / canvasBounds.height * 2 - 1
      pointer.active = isDark ? 0 : 1
      const eligible = isDark && finePointer.matches && !reducedMotion.matches && canvasBounds.width >= 768
      const within = eligible && event.clientX >= arenaBounds.left && event.clientX <= arenaBounds.right
        && event.clientY >= Math.max(canvasBounds.top, arenaBounds.top) && event.clientY <= Math.min(window.innerHeight, arenaBounds.bottom)
        && !(event.target instanceof Element && event.target.closest('a, button, [role="dialog"], [role="menu"]'))
      if (within && !inside) game.start(arenaBounds.width, arenaBounds.height, event.clientX - arenaBounds.left, event.clientY - arenaBounds.top)
      if (!within && inside) game.stop()
      inside = within
      game.target = { x: event.clientX - arenaBounds.left, y: event.clientY - arenaBounds.top }
    }
    const onPointerLeave = () => { pointer.active = 0; stop() }
    const onContact = (event: PointerEvent) => { if (event.pointerType !== 'mouse') onPointerLeave() }
    const onScroll = () => { onPointerLeave(); measure() }
    const onVisibility = () => { if (document.hidden) onPointerLeave() }
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('pointerdown', onContact, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('blur', onPointerLeave)
    document.addEventListener('visibilitychange', onVisibility)
    document.documentElement.addEventListener('mouseleave', onPointerLeave)
    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains('dark')
      onPointerLeave()
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    let visible = true
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
    intersection.observe(canvas)
    let frame = 0, time = 0, last = 0, px = 0, py = 0, pointerActive = 0, gameMix = 0, gameTime = 0
    let lastState = ''
    let blendForDark: boolean | null = null
    const draw = (now: number) => {
      const delta = Math.min((now - last) / 1000, .05)
      last = now
      if (visible && !document.hidden) {
        const frozen = reducedMotion.matches
        if (!frozen) time += delta
        // Dwell and morph over a restrained 108 second cycle.
        const phase = time / 36
        const forms = [0, 1, 2]
        const from = Math.floor(phase) % 3
        const progress = Math.max(0, (phase % 1 - .5) * 2)
        const eased = progress * progress * (3 - 2 * progress)
        const currentMode = forms[from] + (forms[(from + 1) % 3] - forms[from]) * eased
        if (frozen) game.stop()
        game.update(frozen ? 0 : delta)
        const targetMix = game.running && isDark ? 1 : 0
        gameMix += (targetMix - gameMix) * (1 - Math.exp(-delta * (targetMix ? 1.7 : .9)))
        if (!isDark || frozen) gameMix = 0
        if (gameMix > .001) gameTime += delta
        flightTargets(game, targetData)
        gl.bindBuffer(gl.ARRAY_BUFFER, gameBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, gameMix > .001 ? targetData : targetData.subarray(0, BORDER_PARTICLES * 4))
        const gameState = game.running ? 'active' : gameMix > .02 ? 'recovering' : 'idle'
        if (gameState !== lastState) { canvas.dataset.gameState = gameState; lastState = gameState }
        px += ((frozen ? 0 : pointer.x) - px) * .04
        py += ((frozen ? 0 : pointer.y) - py) * .04
        pointerActive += ((frozen ? 0 : pointer.active) - pointerActive) * .08
        gl.clear(gl.COLOR_BUFFER_BIT)
        if (blendForDark !== isDark) {
          gl.blendFunc(gl.SRC_ALPHA, isDark ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA)
          blendForDark = isDark
        }
        gl.uniform1f(uniforms.uTime, time)
        gl.uniform1f(uniforms.uMode, currentMode)
        gl.uniform2f(uniforms.uPointer, px, py)
        gl.uniform1f(uniforms.uPointerActive, pointerActive)
        gl.uniform1f(uniforms.uScroll, window.scrollY / Math.max(window.innerHeight, 1))
        gl.uniform1f(uniforms.uDark, isDark ? 1 : 0)
        gl.uniform1f(uniforms.uGameMix, gameMix)
        gl.uniform1f(uniforms.uBoundary, gameMix)
        gl.uniform1f(uniforms.uGameTime, gameTime)
        gl.drawArrays(gl.POINTS, 0, count)
      }
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      intersection.disconnect()
      themeObserver.disconnect()
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('pointerdown', onContact)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('blur', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      document.documentElement.removeEventListener('mouseleave', onPointerLeave)
      gl.deleteBuffer(buffer)
      gl.deleteBuffer(gameBuffer)
      shaders.forEach(s => gl.deleteShader(s))
      gl.deleteProgram(program)
    }
  }, [])
  return <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />
}
