"use client"

import { useEffect, useRef } from "react"

const vertexShader = `
  attribute float aIndex;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vTwinkle;
  float hash(float value) { return fract(sin(value * 91.271) * 43758.5453123); }
  void main() {
    float xSeed = hash(aIndex * 1.71);
    float ySeed = hash(aIndex * 4.13 + 8.0);
    float speed = mix(0.045, 0.18, hash(aIndex * 6.31));
    float phase = hash(aIndex * 2.89) * 6.2831853;
    float galaxyY = 0.54 - (xSeed - 0.5) * 0.28 + sin(xSeed * 9.0 + phase) * 0.075 + (ySeed - 0.5) * 0.22;
    float inGalaxy = step(0.38, hash(aIndex * 12.73));
    vec2 position = vec2(
      xSeed + sin(uTime * speed + phase) * mix(0.006, 0.026, hash(aIndex * 7.1)),
      mix(ySeed, galaxyY, inGalaxy) + cos(uTime * speed * 0.81 + phase) * mix(0.009, 0.037, hash(aIndex * 5.2))
    );
    float tone = hash(aIndex * 3.97);
    float brightness = 0.58 + 0.42 * sin(uTime * mix(0.55, 1.9, hash(aIndex)) + phase);
    if (tone < 0.34) vColor = mix(vec3(0.63, 0.95, 0.77), vec3(0.32, 0.78, 1.0), 0.18 + 0.16 * sin(uTime * 0.18 + phase));
    else if (tone < 0.61) vColor = mix(vec3(0.30, 0.73, 1.0), vec3(0.67, 0.50, 1.0), 0.18 + 0.16 * sin(uTime * 0.15 + phase));
    else if (tone < 0.84) vColor = mix(vec3(0.67, 0.50, 1.0), vec3(1.0, 0.68, 0.76), 0.14 + 0.12 * sin(uTime * 0.13 + phase));
    else vColor = mix(vec3(1.0, 0.77, 0.43), vec3(0.97, 0.91, 0.68), 0.18 + 0.12 * sin(uTime * 0.16 + phase));
    vTwinkle = mix(0.42, 1.0, brightness) * mix(0.5, 1.0, hash(aIndex * 8.7));
    gl_PointSize = mix(1.5, 7.4, hash(aIndex * 9.17)) * uPixelRatio * (0.7 + vTwinkle * 0.48);
    gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
  }
`

const fragmentShader = `
  precision mediump float;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    float distanceFromCentre = length(gl_PointCoord - vec2(0.5));
    float glow = smoothstep(0.58, 0.06, distanceFromCentre);
    float core = smoothstep(0.23, 0.0, distanceFromCentre);
    float alpha = (glow * 0.42 + core * 0.92) * vTwinkle;
    gl_FragColor = vec4(vColor, alpha);
  }
`

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
}

/** A lightweight GPU star field, kept outside constrained blog page layouts. */
export function BlogParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false })
    if (!gl) return
    const vertex = createShader(gl, gl.VERTEX_SHADER, vertexShader)
    const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader)
    if (!vertex || !fragment) return
    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return

    const particleCount = window.matchMedia("(max-width: 620px)").matches ? 96 : 190
    const indices = new Float32Array(particleCount)
    for (let index = 0; index < particleCount; index += 1) indices[index] = index + 1
    const buffer = gl.createBuffer()
    if (!buffer) return
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    const indexLocation = gl.getAttribLocation(program, "aIndex")
    const timeLocation = gl.getUniformLocation(program, "uTime")
    const pixelRatioLocation = gl.getUniformLocation(program, "uPixelRatio")
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let frame = 0
    const start = performance.now()
    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(window.innerWidth * pixelRatio)
      canvas.height = Math.round(window.innerHeight * pixelRatio)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(program)
      gl.uniform1f(pixelRatioLocation, pixelRatio)
    }
    const render = (now: number) => {
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program)
      gl.uniform1f(timeLocation, reduceMotion.matches ? 0 : (now - start) / 1000)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.enableVertexAttribArray(indexLocation)
      gl.vertexAttribPointer(indexLocation, 1, gl.FLOAT, false, 0, 0)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
      gl.drawArrays(gl.POINTS, 0, particleCount)
      if (!reduceMotion.matches) frame = requestAnimationFrame(render)
    }
    resize()
    window.addEventListener("resize", resize)
    render(start)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", resize)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
    }
  }, [])

  return <canvas ref={canvasRef} className="blog-particle-field" aria-hidden="true" />
}
