'use client'

import { useEffect, useRef } from 'react'

const vertex = `
attribute vec3 aPosition;
attribute float aSeed;
uniform float uTime;
uniform float uMode;
uniform vec2 uPointer;
uniform float uAspect;
uniform float uPixelRatio;
uniform vec2 uOffset;
uniform float uScale;
uniform float uScroll;
uniform float uPointerActive;
varying float vAlpha;
varying float vSeed;
varying float vInfluence;
float hash(float n) { return fract(sin(n) * 43758.5453123); }
void main() {
  float t = uTime * .16;
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

  float isField = step(.91, aSeed);
  vec2 dust = vec2(hash(aSeed * 813.7), hash(aSeed * 2137.1)) * 2.0 - 1.0;
  dust += vec2(sin(t + aSeed * 80.0), cos(t * .7 + aSeed * 53.0)) * .008;
  vec2 clipPosition = mix(orb, dust, isField);

  vec2 cursor = vec2(uPointer.x, -uPointer.y);
  vec2 fromCursor = clipPosition - cursor;
  float cursorDistance = length(fromCursor);
  float influence = smoothstep(.34, .0, cursorDistance) * uPointerActive;
  float ripple = sin(cursorDistance * 42.0 - uTime * 3.4) * .014;
  clipPosition += normalize(fromCursor + vec2(.0001)) * influence * (.07 + ripple);
  clipPosition.y += sin(uScroll * .8 + aSeed * 4.0) * .012 * (1.0 - isField);

  gl_Position = vec4(clipPosition, 0.0, 1.0);
  gl_PointSize = (1.0 + aSeed * 1.15 + influence * 2.2) * uPixelRatio * mix(perspective, 1.0, isField);
  vAlpha = mix((.18 + smoothstep(-1.0, 1.0, p.z) * .72) * (.55 + .45 * sin(aSeed * 30.0 + t)), .18, isField);
  vSeed = aSeed;
  vInfluence = influence;
}`
const fragment = `
precision mediump float;
varying float vAlpha;
varying float vSeed;
varying float vInfluence;
uniform float uDark;
void main() {
  float d = length(gl_PointCoord - .5) * 2.0;
  if (d > 1.0) discard;
  vec3 lightColor = mix(vec3(.02, .20, .12), vec3(.10, .52, .31), vSeed);
  vec3 darkColor = mix(vec3(.19, .65, .49), vec3(.72, 1.0, .82), vSeed);
  vec3 color = mix(lightColor, darkColor, uDark);
  color = mix(color, mix(vec3(.06, .48, .28), vec3(.82, 1.0, .88), uDark), vInfluence);
  gl_FragColor = vec4(color, (1.0 - d * d) * (vAlpha + vInfluence * .55) * mix(2.35, 1.0, uDark));
}`

export function ParticleField({ mode, paused }: { mode: number; paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controls = useRef({ mode, paused })
  useEffect(() => { controls.current = { mode, paused } }, [mode, paused])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
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
    const data = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2
      const radius = Math.sqrt(1 - y * y)
      const theta = i * 2.399963 + Math.sin(y * 18) * .12
      data.set([Math.cos(theta) * radius, y, Math.sin(theta) * radius, ((i * 7919) % 1000) / 1000], i * 4)
    }
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'aPosition')
    const seed = gl.getAttribLocation(program, 'aSeed')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 16, 0)
    gl.enableVertexAttribArray(seed)
    gl.vertexAttribPointer(seed, 1, gl.FLOAT, false, 16, 12)
    const uniforms = Object.fromEntries(['uTime', 'uMode', 'uPointer', 'uAspect', 'uPixelRatio', 'uOffset', 'uScale', 'uScroll', 'uPointerActive', 'uDark'].map(key => [key, gl.getUniformLocation(program, key)]))
    gl.enable(gl.BLEND)
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
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()
    const pointer = { x: 0, y: 0, active: 0 }
    const onPointer = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect()
      pointer.x = (event.clientX - bounds.left) / bounds.width * 2 - 1
      pointer.y = (event.clientY - bounds.top) / bounds.height * 2 - 1
      pointer.active = 1
    }
    const onPointerLeave = () => { pointer.active = 0 }
    window.addEventListener('pointermove', onPointer, { passive: true })
    document.documentElement.addEventListener('mouseleave', onPointerLeave)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let isDark = document.documentElement.classList.contains('dark')
    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains('dark')
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    let visible = true
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
    intersection.observe(canvas)
    let frame = 0, time = 0, last = 0, currentMode = 0, px = 0, py = 0, pointerActive = 0
    let blendForDark: boolean | null = null
    const draw = (now: number) => {
      const delta = Math.min((now - last) / 1000, .05)
      last = now
      if (visible && !document.hidden) {
        const frozen = controls.current.paused || reducedMotion.matches
        if (!frozen) time += delta
        currentMode += (controls.current.mode - currentMode) * (frozen ? 1 : .045)
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
      document.documentElement.removeEventListener('mouseleave', onPointerLeave)
      gl.deleteBuffer(buffer)
      shaders.forEach(s => gl.deleteShader(s))
      gl.deleteProgram(program)
    }
  }, [])
  return <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />
}
