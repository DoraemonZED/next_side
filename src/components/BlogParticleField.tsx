"use client"

import { useEffect, useRef } from "react"

const vertexShader = `
  attribute float aIndex;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vTwinkle;
  varying float vFlare;
  float hash(float value) { return fract(sin(value * 91.271) * 43758.5453123); }
  void main() {
    float xSeed = hash(aIndex * 1.71);
    float ySeed = hash(aIndex * 4.13 + 8.0);
    float speed = mix(0.045, 0.18, hash(aIndex * 6.31));
    float phase = hash(aIndex * 2.89) * 6.2831853;
    float driftX = sin(uTime * speed + phase) * mix(0.002, 0.010, hash(aIndex * 7.1));
    float driftY = cos(uTime * speed * 0.81 + phase) * mix(0.003, 0.014, hash(aIndex * 5.2));

    // An edge-on galaxy: a bright central bulge that tapers into a thin,
    // gently tilted disk. This is intentionally a structured distribution,
    // not a uniformly random particle field.
    float diskX = 0.5 + (xSeed - 0.5) * mix(0.42, 1.02, hash(aIndex * 14.11));
    float fromCore = abs(diskX - 0.5) * 2.0;
    float coreWeight = 1.0 - smoothstep(0.0, 0.82, fromCore);
    float diskSpine = 0.55 - (diskX - 0.5) * 0.30 + sin(diskX * 7.0 + 0.8) * 0.032;
    float diskHalfWidth = mix(0.024, 0.175, coreWeight);
    float diskOffset = sign(ySeed - 0.5) * pow(abs(ySeed - 0.5) * 2.0, 2.35) * diskHalfWidth;
    vec2 galaxyPosition = vec2(diskX + driftX, diskSpine + diskOffset + driftY);

    // A few small, faint stellar associations live away from the disk.
    float clusterId = floor(hash(aIndex * 27.41) * 4.0);
    float clusterX = 0.13 + hash(clusterId * 17.17 + 4.0) * 0.74;
    float clusterY = 0.16 + hash(clusterId * 31.73 + 7.0) * 0.68;
    float clusterAngle = hash(aIndex * 15.19) * 6.2831853;
    float clusterRadius = sqrt(hash(aIndex * 22.61)) * mix(0.035, 0.11, hash(aIndex * 11.07));
    vec2 clusterPosition = vec2(clusterX + cos(clusterAngle) * clusterRadius + driftX, clusterY + sin(clusterAngle) * clusterRadius + driftY);

    // A quiet companion patch at the lower left gives the page depth without
    // competing with the main disk across the reading area.
    float lowerLeftAngle = hash(aIndex * 37.17) * 6.2831853;
    float lowerLeftRadius = sqrt(hash(aIndex * 41.23)) * mix(0.035, 0.125, hash(aIndex * 18.41));
    vec2 lowerLeftPosition = vec2(0.16 + cos(lowerLeftAngle) * lowerLeftRadius + driftX, 0.18 + sin(lowerLeftAngle) * lowerLeftRadius * 0.72 + driftY);

    vec2 backgroundPosition = vec2(xSeed + driftX, ySeed + driftY);
    float placement = hash(aIndex * 19.91);
    vec2 position = placement < 0.90 ? galaxyPosition : (placement < 0.96 ? clusterPosition : (placement < 0.99 ? lowerLeftPosition : backgroundPosition));

    // The final desktop-only indices are reserved for rare edge flares and
    // three short meteor trails. Mobile has only 96 indices, so it receives
    // neither effect without a separate runtime branch.
    float giantMask = step(1936.0, aIndex) * (1.0 - step(1944.0, aIndex));
    float giantSide = step(0.5, hash(aIndex * 43.71));
    float giantLeftX = 0.035 + hash(aIndex * 17.91) * 0.18;
    float giantRightX = 0.785 + hash(aIndex * 17.91) * 0.18;
    vec2 giantPosition = vec2(mix(giantLeftX, giantRightX, giantSide), 0.09 + hash(aIndex * 23.81) * 0.82);
    position = mix(position, giantPosition, giantMask);

    float meteorMask = step(1944.0, aIndex);
    float meteorSlot = aIndex - 1944.0;
    float meteorGroup = floor(meteorSlot / 14.0);
    float meteorTail = mod(meteorSlot, 14.0);
    float meteorSeed = hash(meteorGroup * 57.13 + 3.0);
    float meteorStartsTop = step(0.42, hash(meteorGroup * 11.71 + 5.0));
    vec2 meteorTopStart = vec2(0.05 + hash(meteorGroup * 23.41) * 0.90, 1.08);
    vec2 meteorSideStart = vec2(mix(-0.08, 1.08, step(0.5, meteorSeed)), 0.55 + hash(meteorGroup * 29.83) * 0.40);
    vec2 meteorStart = mix(meteorSideStart, meteorTopStart, meteorStartsTop);
    float meteorAngle = -0.30 - hash(meteorGroup * 41.27 + 1.0) * 2.55;
    vec2 meteorDirection = vec2(cos(meteorAngle), sin(meteorAngle));
    float meteorCycle = fract(uTime * 0.031 + meteorGroup * 0.243 + 0.11);
    float meteorActive = step(0.70, meteorCycle) * (1.0 - step(0.84, meteorCycle));
    float meteorTravel = (meteorCycle - 0.70) / 0.14;
    vec2 meteorHead = meteorStart + meteorDirection * meteorTravel * 1.24;
    vec2 meteorPosition = meteorHead - meteorDirection * meteorTail * 0.0044;
    position = mix(position, meteorPosition, meteorMask);

    float isGalaxy = 1.0 - step(0.90, placement);
    float laneGlow = (1.0 - smoothstep(0.004, diskHalfWidth * 0.38, abs(diskOffset))) * isGalaxy;
    laneGlow *= mix(0.68, 1.0, coreWeight);
    float edgeGlow = smoothstep(0.64, 0.98, fromCore) * isGalaxy * step(0.73, hash(aIndex * 13.53));
    float lowerLeftGlow = step(0.96, placement) * (1.0 - step(0.99, placement)) * step(0.70, hash(aIndex * 29.93));
    float giantFlash = pow(max(0.0, sin(uTime * mix(0.18, 0.32, hash(aIndex * 6.17)) + phase)), 18.0);
    float tone = hash(aIndex * 3.97);
    float brightness = 0.72 + 0.28 * sin(uTime * mix(0.25, 0.8, hash(aIndex)) + phase);
    if (tone < 0.70) vColor = vec3(0.69, 0.88, 1.0);
    else if (tone < 0.94) vColor = vec3(0.56, 0.76, 0.96);
    else vColor = vec3(1.0, 0.78, 0.52);
    vColor = mix(vColor, vec3(0.84, 0.95, 1.0), laneGlow * 0.48);
    vColor = mix(vColor, mix(vec3(0.37, 0.83, 1.0), vec3(0.73, 0.46, 1.0), hash(aIndex * 24.17)), edgeGlow * 0.7);
    vColor = mix(vColor, vec3(1.0, 0.72, 0.38), lowerLeftGlow * 0.72);
    vColor = mix(vColor, vec3(0.78, 0.91, 1.0), giantMask);
    vColor = mix(vColor, vec3(0.88, 0.96, 1.0), meteorMask);
    float galaxyGlow = placement < 0.90 ? mix(0.68, 1.18, coreWeight) : 0.56;
    float accentGlow = max(edgeGlow, lowerLeftGlow);
    vTwinkle = mix(0.38, 0.92, brightness) * mix(0.46, 0.94, hash(aIndex * 8.7)) * galaxyGlow * (1.0 + laneGlow * 0.9 + accentGlow * 0.45);
    vTwinkle = mix(vTwinkle, 0.26 + giantFlash * 0.72, giantMask);
    vTwinkle = mix(vTwinkle, meteorActive * (1.25 - meteorTail * 0.075), meteorMask);
    vFlare = giantMask * (0.22 + giantFlash * 0.78);
    float brightStar = step(0.985, hash(aIndex * 9.17));
    gl_PointSize = (mix(1.05, 4.15, hash(aIndex * 9.17)) + brightStar * 2.6 + laneGlow * 0.85 + accentGlow * 1.1) * uPixelRatio * (0.76 + vTwinkle * 0.26);
    gl_PointSize = mix(gl_PointSize, (2.4 + giantFlash * 7.4) * uPixelRatio, giantMask);
    gl_PointSize = mix(gl_PointSize, meteorActive * (3.8 - meteorTail * 0.17) * uPixelRatio, meteorMask);
    gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
  }
`

const fragmentShader = `
  precision mediump float;
  varying vec3 vColor;
  varying float vTwinkle;
  varying float vFlare;
  void main() {
    float distanceFromCentre = length(gl_PointCoord - vec2(0.5));
    float glow = smoothstep(0.58, 0.06, distanceFromCentre);
    float core = smoothstep(0.23, 0.0, distanceFromCentre);
    vec2 flareCoord = abs(gl_PointCoord - vec2(0.5));
    float horizontalRay = (1.0 - smoothstep(0.016, 0.070, flareCoord.y)) * (1.0 - smoothstep(0.10, 0.50, flareCoord.x));
    float verticalRay = (1.0 - smoothstep(0.016, 0.070, flareCoord.x)) * (1.0 - smoothstep(0.10, 0.50, flareCoord.y));
    float starlight = max(horizontalRay, verticalRay) * vFlare;
    float alpha = (glow * 0.5 + core * 0.98) * vTwinkle + starlight * 0.36;
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

    const particleCount = window.matchMedia("(max-width: 620px)").matches ? 96 : 2000
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
