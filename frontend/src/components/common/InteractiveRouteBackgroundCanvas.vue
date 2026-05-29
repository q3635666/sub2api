<template>
  <div
    class="route-background"
    :class="{
      'is-dark': isDark,
      'is-bursting': burstActive,
      'is-settling': themeSettling,
      'is-subtle': subtle
    }"
    aria-hidden="true"
  >
    <canvas ref="canvasRef" class="route-background-canvas"></canvas>
    <div class="route-background-sheen"></div>
    <div class="route-background-vignette"></div>
    <div class="route-theme-flash"></div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  isDark: boolean
  subtle?: boolean
}>(), {
  subtle: false
})

type RGB = [number, number, number]

type Cell = {
  x: number
  y: number
  size: number
  seed: number
  energy: number
}

type Particle = {
  x: number
  y: number
  z: number
  seed: number
  speed: number
  tone: number
  size: number
  twinkle: number
}

type Lane = {
  seed: number
  y: number
  amplitude: number
  speed: number
  tone: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
const burstActive = ref(false)
const themeSettling = ref(false)

const lightPalette: Record<string, RGB> = {
  bgA: [248, 252, 255],
  bgB: [235, 249, 247],
  bgC: [241, 247, 255],
  primary: [20, 184, 166],
  secondary: [37, 99, 235],
  tertiary: [14, 165, 233],
  ink: [15, 23, 42],
  grid: [13, 148, 136],
  pixel: [30, 41, 59],
  white: [255, 255, 255]
}

const darkPalette: Record<string, RGB> = {
  bgA: [2, 6, 23],
  bgB: [5, 18, 31],
  bgC: [4, 29, 35],
  primary: [45, 212, 191],
  secondary: [96, 165, 250],
  tertiary: [125, 211, 252],
  ink: [226, 232, 240],
  grid: [45, 212, 191],
  pixel: [203, 213, 225],
  white: [255, 255, 255]
}

let ctx: CanvasRenderingContext2D | null = null
let frameId = 0
let width = 1
let height = 1
let dpr = 1
let time = 0
let lastFrame = 0
let themeMix = props.isDark ? 1 : 0
let cells: Cell[] = []
let particles: Particle[] = []
let lanes: Lane[] = []
let burstTimer = 0
let settleTimer = 0
let burstDuration = 520
let mounted = false
let reducedMotion = false

const pointer = {
  x: 0.5,
  y: 0.42,
  tx: 0.5,
  ty: 0.42,
  active: false,
  strength: 0
}

function rand(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453123
  return value - Math.floor(value)
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)))
  return x * x * (3 - 2 * x)
}

function mixRgb(a: RGB, b: RGB, amount: number) {
  return a.map((value, index) => Math.round(lerp(value, b[index] ?? value, amount))).join(', ')
}

function color(key: string) {
  return mixRgb(lightPalette[key], darkPalette[key], themeMix)
}

function noise2(x: number, y: number) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const a = rand(ix * 13.37 + iy * 71.17)
  const b = rand((ix + 1) * 13.37 + iy * 71.17)
  const c = rand(ix * 13.37 + (iy + 1) * 71.17)
  const d = rand((ix + 1) * 13.37 + (iy + 1) * 71.17)
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy)
}

function buildScene() {
  const cellSize = Math.max(14, Math.min(22, Math.round(width / 88)))
  const columns = Math.ceil(width / cellSize) + 4
  const rows = Math.ceil(height / cellSize) + 4
  cells = []

  for (let row = -2; row < rows; row += 1) {
    for (let col = -2; col < columns; col += 1) {
      cells.push({
        x: col * cellSize,
        y: row * cellSize,
        size: cellSize,
        seed: rand(col * 17.31 + row * 93.73),
        energy: 0
      })
    }
  }

  const particleCount = Math.round(
    Math.min(980, Math.max(460, Math.round((width * height) / 1800))) * (props.subtle ? 0.72 : 1)
  )
  particles = Array.from({ length: particleCount }, (_, index) => ({
    x: rand(index * 5.17 + 2) * width,
    y: rand(index * 7.11 + 9) * height,
    z: rand(index * 11.73 + 4),
    seed: rand(index * 19.13 + 8),
    speed: 0.34 + rand(index * 23.81) * 0.9,
    tone: rand(index * 31.91 + 11),
    size: 0.58 + rand(index * 41.37) * 2.35,
    twinkle: rand(index * 47.91 + 13)
  }))

  lanes = Array.from({ length: 7 }, (_, index) => ({
    seed: rand(index * 31.7 + 4),
    y: 0.16 + index * 0.105 + rand(index * 17.4) * 0.026,
    amplitude: 16 + rand(index * 8.2) * 34,
    speed: 0.26 + index * 0.035 + rand(index * 6.4) * 0.08,
    tone: rand(index * 12.7)
  }))
}

function resize() {
  const canvas = canvasRef.value
  if (!canvas) return

  dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = Math.max(1, window.innerWidth)
  height = Math.max(1, window.innerHeight)
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  ctx = canvas.getContext('2d')
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  buildScene()
}

function handlePointerMove(event: PointerEvent) {
  pointer.tx = Math.min(1, Math.max(0, event.clientX / Math.max(width, 1)))
  pointer.ty = Math.min(1, Math.max(0, event.clientY / Math.max(height, 1)))
  pointer.active = true
}

function handlePointerLeave() {
  pointer.active = false
  pointer.tx = 0.5
  pointer.ty = 0.42
}

function triggerThemeBurst() {
  window.clearTimeout(burstTimer)
  window.clearTimeout(settleTimer)
  themeSettling.value = true
  burstActive.value = false

  window.requestAnimationFrame(() => {
    burstActive.value = true
    burstTimer = window.setTimeout(() => {
      burstActive.value = false
    }, burstDuration)
  })

  settleTimer = window.setTimeout(() => {
    themeSettling.value = false
  }, burstDuration + 140)
}

function drawBackground(context: CanvasRenderingContext2D) {
  const bgA = color('bgA')
  const bgB = color('bgB')
  const bgC = color('bgC')
  const primary = color('primary')
  const secondary = color('secondary')
  const tertiary = color('tertiary')
  const px = pointer.x * width
  const py = pointer.y * height

  const base = context.createLinearGradient(0, 0, width, height)
  base.addColorStop(0, `rgb(${bgA})`)
  base.addColorStop(0.46, `rgb(${bgB})`)
  base.addColorStop(1, `rgb(${bgC})`)
  context.fillStyle = base
  context.fillRect(0, 0, width, height)

  const driftA = Math.sin(time * 0.12) * width * 0.08
  const driftB = Math.cos(time * 0.1) * height * 0.05
  const aurora = context.createRadialGradient(
    width * 0.72 + driftA,
    height * 0.18 + driftB,
    0,
    width * 0.72 + driftA,
    height * 0.18 + driftB,
    Math.max(width, height) * 0.56
  )
  aurora.addColorStop(0, `rgba(${tertiary}, ${themeMix > 0.55 ? 0.16 : 0.125})`)
  aurora.addColorStop(0.42, `rgba(${secondary}, ${themeMix > 0.55 ? 0.09 : 0.068})`)
  aurora.addColorStop(1, 'rgba(0, 0, 0, 0)')
  context.fillStyle = aurora
  context.fillRect(0, 0, width, height)

  const subtleScale = props.subtle ? 0.68 : 1
  const pointerGlow = context.createRadialGradient(px, py, 0, px, py, Math.max(240, Math.min(width, height) * 0.42))
  pointerGlow.addColorStop(0, `rgba(${primary}, ${(0.07 + pointer.strength * 0.11) * subtleScale})`)
  pointerGlow.addColorStop(0.34, `rgba(${secondary}, ${(0.035 + pointer.strength * 0.05) * subtleScale})`)
  pointerGlow.addColorStop(0.74, `rgba(${primary}, ${(0.012 + pointer.strength * 0.024) * subtleScale})`)
  pointerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  context.fillStyle = pointerGlow
  context.fillRect(0, 0, width, height)
}

function drawDepthRings(context: CanvasRenderingContext2D) {
  const primary = color('primary')
  const secondary = color('secondary')
  const lightPresence = 1 - themeMix
  const centerX = width * (0.5 + (pointer.x - 0.5) * 0.045)
  const centerY = height * (0.5 + (pointer.y - 0.5) * 0.035)

  context.save()
  context.globalCompositeOperation = themeMix > 0.55 ? 'lighter' : 'source-over'
  for (let index = 0; index < 10; index += 1) {
    const depth = index / 9
    const pulse = Math.sin(time * (0.24 + index * 0.012) + index * 0.74) * 0.5 + 0.5
    const rx = width * (0.22 + depth * 0.34) + pulse * 12
    const ry = height * (0.045 + depth * 0.065)
    const y = centerY + (index - 4.5) * height * 0.048 + Math.sin(time * 0.32 + index) * 6
    const alpha =
      (0.018 + depth * 0.018 + pointer.strength * 0.012) *
      (themeMix > 0.55 ? 1 : 0.74 + lightPresence * 0.08) *
      (props.subtle ? 0.58 : 1)

    context.beginPath()
    context.ellipse(centerX, y, rx, ry, Math.sin(time * 0.08 + index) * 0.05, 0, Math.PI * 2)
    context.strokeStyle = `rgba(${index % 2 ? primary : secondary}, ${alpha})`
    context.lineWidth = 1
    context.stroke()
  }
  context.restore()
}

function drawFlowLanes(context: CanvasRenderingContext2D) {
  const primary = color('primary')
  const secondary = color('secondary')
  const tertiary = color('tertiary')
  const white = color('white')
  const lightPresence = 1 - themeMix
  const px = pointer.x - 0.5
  const py = pointer.y - 0.5

  context.save()
  context.globalCompositeOperation = themeMix > 0.55 ? 'lighter' : 'source-over'
  context.lineCap = 'round'

  for (const [index, lane] of lanes.entries()) {
    const baseY = lane.y * height + Math.sin(time * lane.speed + lane.seed * 12) * 18 + py * 38
    const laneColor = lane.tone < 0.34 ? primary : lane.tone < 0.68 ? secondary : tertiary
    const gradient = context.createLinearGradient(0, baseY, width, baseY)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    const laneAlpha = props.subtle ? 0.62 : 1
    gradient.addColorStop(0.18, `rgba(${laneColor}, ${(0.045 + themeMix * 0.035 + lightPresence * 0.018) * laneAlpha})`)
    gradient.addColorStop(0.5, `rgba(${white}, ${(themeMix > 0.55 ? 0.16 : 0.18) * laneAlpha})`)
    gradient.addColorStop(0.82, `rgba(${laneColor}, ${(0.055 + pointer.strength * 0.045 + lightPresence * 0.018) * laneAlpha})`)
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

    context.beginPath()
    for (let step = 0; step <= 120; step += 1) {
      const t = step / 120
      const x = t * width
      const flow = noise2(t * 3.4 + lane.seed * 4, time * 0.1 + index) - 0.5
      const bend = Math.sin(t * Math.PI * 2.4 + time * (0.32 + lane.seed * 0.18) + lane.seed * 9) * lane.amplitude
      const pointerPull = Math.sin((t - pointer.x) * Math.PI) * px * 34 * Math.max(0, 1 - Math.abs(t - pointer.x) * 2.1)
      const y = baseY + bend + flow * 42 + pointerPull
      if (step === 0) context.moveTo(x, y)
      else context.lineTo(x, y)
    }

    context.strokeStyle = gradient
    context.lineWidth = 0.75 + index * 0.13
    context.stroke()

    context.setLineDash([56 + index * 8, 240])
    context.lineDashOffset = -time * (42 + index * 9)
    context.strokeStyle = `rgba(${laneColor}, ${(0.08 + pointer.strength * 0.08 + lightPresence * 0.035) * (props.subtle ? 0.56 : 1)})`
    context.lineWidth = 1.2
    context.stroke()
    context.setLineDash([])
  }

  context.restore()
}

function drawCells(context: CanvasRenderingContext2D) {
  const primary = color('primary')
  const secondary = color('secondary')
  const tertiary = color('tertiary')
  const pixel = color('pixel')
  const lightPresence = 1 - themeMix
  const px = pointer.x * width
  const py = pointer.y * height
  const radius = Math.max(170, Math.min(360, width * 0.22))
  const baseAlpha = (themeMix > 0.55 ? 0.032 : 0.024) * (props.subtle ? 0.48 : 1)

  context.save()
  context.globalCompositeOperation = themeMix > 0.55 ? 'screen' : 'source-over'

  for (const cell of cells) {
    const cx = cell.x + cell.size * 0.5
    const cy = cell.y + cell.size * 0.5
    const distance = Math.hypot(cx - px, cy - py)
    const focus = Math.pow(smoothstep(radius, 0, distance), 1.28) * pointer.strength
    const sweep = smoothstep(
      0.08,
      1,
      1 - Math.abs(((cy + time * 38 + cell.seed * 140) % (height + 190)) - height * 0.68) / 120
    )
    const shimmer = cell.seed > 0.965 ? 0.11 + Math.max(0, Math.sin(time * 2.4 + cell.seed * 20)) * 0.12 : 0
    let target = sweep * 0.12 + shimmer
    if (focus > 0.004) {
      const brokenMask = 0.4 + noise2(cx * 0.024 + time * 0.18, cy * 0.024 - time * 0.12) * 0.78
      target += focus * brokenMask
    }
    target = Math.min(1, target) * (props.subtle ? 0.58 : 1)
    const pull = target > cell.energy ? 0.16 : 0.075
    cell.energy = lerp(cell.energy, target, reducedMotion ? pull * 0.35 : pull)

    const ambient = cell.seed > 0.46 ? baseAlpha * (0.36 + cell.seed * 0.72) : baseAlpha * 0.22
    const tiny = 2 + Math.floor(cell.seed * Math.max(2, cell.size * 0.42))
    const inset = 2 + Math.floor(rand(cell.seed * 23) * 4)
    const drift = Math.sin(time * 0.34 + cell.seed * 17) * 0.9

    if (cell.seed > 0.2) {
      context.fillStyle = `rgba(${pixel}, ${ambient * (themeMix > 0.55 ? 0.72 : 0.44 + lightPresence * 0.12)})`
      context.fillRect(cell.x + inset + drift, cell.y + inset, tiny, tiny)
    }

    if (cell.energy < 0.012) continue

    const tone = cell.seed > 0.64 ? secondary : cell.seed > 0.34 ? primary : tertiary
    const alpha = (0.065 + cell.energy * (themeMix > 0.55 ? 0.44 : 0.34)) * (props.subtle ? 0.64 : 1)
    const gap = cell.size * (0.16 + (Math.sin(time * 1.3 + cell.seed * 11) * 0.5 + 0.5) * 0.22)
    const move = Math.sin(time * 2.1 + cell.seed * 14) * cell.size * 0.16 * cell.energy
    const x = cell.x
    const y = cell.y
    const s = cell.size

    context.fillStyle = `rgba(${tone}, ${cell.energy * (themeMix > 0.55 ? 0.068 : 0.046) * (props.subtle ? 0.62 : 1)})`
    context.fillRect(x + 1.5, y + 1.5, s - 3, s - 3)

    context.strokeStyle = `rgba(${tone}, ${alpha})`
    context.lineWidth = 0.8 + cell.energy * 1.35
    context.beginPath()

    if (cell.seed > 0.12) {
      context.moveTo(x + gap + move, y + 0.5)
      context.lineTo(x + s - gap + move * 0.32, y + 0.5)
    }
    if (cell.seed < 0.86) {
      context.moveTo(x + s - 0.5, y + gap - move)
      context.lineTo(x + s - 0.5, y + s - gap - move * 0.2)
    }
    if (cell.seed > 0.38) {
      context.moveTo(x + s - gap - move * 0.24, y + s - 0.5)
      context.lineTo(x + gap - move, y + s - 0.5)
    }
    if (cell.seed < 0.58) {
      context.moveTo(x + 0.5, y + s - gap + move * 0.18)
      context.lineTo(x + 0.5, y + gap + move)
    }
    context.stroke()

    if (cell.energy > 0.34 && cell.seed > 0.72) {
      context.fillStyle = `rgba(255, 255, 255, ${cell.energy * (themeMix > 0.55 ? 0.34 : 0.24)})`
      context.fillRect(cx - 1, cy - 1, 2.2 + cell.energy * 3, 2.2 + cell.energy * 3)
    }
  }

  context.restore()
}

function drawParticles(context: CanvasRenderingContext2D, delta: number) {
  const primary = color('primary')
  const secondary = color('secondary')
  const tertiary = color('tertiary')
  const lightPresence = 1 - themeMix
  const px = pointer.x * width
  const py = pointer.y * height
  const motion = reducedMotion ? 0.28 : 1

  context.save()
  context.globalCompositeOperation = themeMix > 0.55 ? 'lighter' : 'source-over'

  for (const particle of particles) {
    particle.y -= particle.speed * delta * 0.026 * motion
    if (particle.y < -24) {
      particle.y = height + 24
      particle.x = rand(particle.seed * 1200 + time) * width
    }

    const laneDrift = Math.sin(time * (0.38 + particle.z * 0.3) + particle.seed * 18 + particle.y * 0.006) * (10 + particle.z * 18)
    const parallaxX = (pointer.x - 0.5) * (particle.z - 0.5) * 72
    const parallaxY = (pointer.y - 0.5) * (particle.z - 0.5) * 42
    const dx = particle.x + laneDrift - px
    const dy = particle.y - py
    const distance = Math.hypot(dx, dy)
    const force = Math.pow(smoothstep(230, 0, distance), 1.2) * pointer.strength
    const angle = Math.atan2(dy, dx)
    const x = particle.x + laneDrift + parallaxX + Math.cos(angle) * force * 32
    const y = particle.y + parallaxY + Math.sin(angle) * force * 32
    const tone = particle.tone < 0.36 ? primary : particle.tone < 0.72 ? secondary : tertiary
    const twinkle = 0.72 + Math.max(0, Math.sin(time * (1.6 + particle.twinkle * 2.4) + particle.seed * 30)) * 0.58
    const size = (particle.size + particle.z * 1.9 + force * 4.9) * twinkle
    const alpha =
      (0.052 + particle.z * 0.19 + force * 0.42) *
      (themeMix > 0.55 ? 0.94 : 0.58 + lightPresence * 0.04) *
      (props.subtle ? 0.68 : 1)
    const tail = (6 + particle.z * 18 + force * 20) * (themeMix > 0.55 ? 1 : 0.72)

    if (particle.z > 0.42 || force > 0.08) {
      const tailGradient = context.createLinearGradient(x, y + tail, x, y)
      tailGradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
      tailGradient.addColorStop(1, `rgba(${tone}, ${alpha * 0.38})`)
      context.strokeStyle = tailGradient
      context.lineWidth = Math.max(0.5, size * 0.36)
      context.beginPath()
      context.moveTo(x, y + tail)
      context.lineTo(x + Math.sin(time + particle.seed * 18) * 2, y)
      context.stroke()
    }

    context.fillStyle = `rgba(${tone}, ${alpha})`
    context.fillRect(x, y, size, size)

    if ((particle.twinkle > 0.92 && particle.z > 0.36) || force > 0.34) {
      context.fillStyle = `rgba(255, 255, 255, ${Math.min(0.62, alpha * 0.82)})`
      context.fillRect(x + size * 0.28, y + size * 0.28, Math.max(1, size * 0.38), Math.max(1, size * 0.38))
    }
  }

  context.restore()
}

function drawEnergyVeil(context: CanvasRenderingContext2D) {
  const primary = color('primary')
  const secondary = color('secondary')
  const tertiary = color('tertiary')
  const centerX = width * (0.52 + (pointer.x - 0.5) * 0.08)
  const centerY = height * (0.44 + (pointer.y - 0.5) * 0.06)
  const intensity = (themeMix > 0.55 ? 0.075 : 0.058) * (props.subtle ? 0.62 : 1)

  context.save()
  context.globalCompositeOperation = themeMix > 0.55 ? 'lighter' : 'source-over'
  context.lineCap = 'round'

  for (let ring = 0; ring < 4; ring += 1) {
    const alpha = intensity * (1 - ring * 0.15) + pointer.strength * 0.012
    const radiusX = width * (0.2 + ring * 0.14) + Math.sin(time * 0.32 + ring) * 16
    const radiusY = height * (0.038 + ring * 0.026) + Math.cos(time * 0.28 + ring) * 8
    const gradient = context.createLinearGradient(centerX - radiusX, centerY, centerX + radiusX, centerY)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(0.34, `rgba(${ring % 2 ? secondary : primary}, ${alpha})`)
    gradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 1.5})`)
    gradient.addColorStop(0.66, `rgba(${tertiary}, ${alpha})`)
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

    context.beginPath()
    context.ellipse(
      centerX,
      centerY + (ring - 1.5) * height * 0.08 + Math.sin(time * 0.38 + ring) * 8,
      radiusX,
      radiusY,
      Math.sin(time * 0.07 + ring) * 0.08,
      0,
      Math.PI * 2
    )
    context.strokeStyle = gradient
    context.lineWidth = 1.2 + ring * 0.35
    context.stroke()
  }

  context.restore()
}

function drawBottomSignal(context: CanvasRenderingContext2D) {
  const primary = color('primary')
  const secondary = color('secondary')
  const lightPresence = 1 - themeMix
  const baseY = height - Math.max(52, height * 0.105)

  context.save()
  context.globalCompositeOperation = themeMix > 0.55 ? 'lighter' : 'source-over'

  const gradient = context.createLinearGradient(0, baseY, width, baseY)
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(0.14, `rgba(${primary}, ${0.14 + themeMix * 0.1 + lightPresence * 0.055})`)
  gradient.addColorStop(0.5, `rgba(${secondary}, ${0.075 + pointer.strength * 0.08 + lightPresence * 0.045})`)
  gradient.addColorStop(0.86, `rgba(${primary}, ${0.14 + themeMix * 0.1 + lightPresence * 0.055})`)
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

  context.strokeStyle = gradient
  context.lineWidth = 1.8
  context.beginPath()
  for (let x = 0; x <= width; x += 7) {
    const y =
      baseY +
      Math.sin(x * 0.018 + time * 1.28) * 4.2 +
      Math.sin(x * 0.074 - time * 2.2) * 1.8 +
      (rand(Math.floor(x / 18) * 9.3) - 0.5) * 5.5
    if (x === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
  }
  context.stroke()

  for (let x = 0; x < width; x += 24) {
    const seed = rand(x * 0.19)
    const wave = Math.sin(time * 1.8 + seed * 11) * 0.5 + 0.5
    if (seed + wave * 0.2 < 0.58) continue
    const barHeight = 5 + seed * 28 * (0.78 + pointer.strength * 0.42)
    context.fillStyle = `rgba(${primary}, ${0.075 + seed * 0.13 + lightPresence * 0.05})`
    context.fillRect(x, baseY - barHeight * 0.5, 5 + seed * 12, barHeight)
  }

  context.restore()
}

function render(now = 0) {
  if (!ctx) return

  const delta = lastFrame ? Math.min(42, now - lastFrame) : 16
  lastFrame = now
  time = now * 0.001

  const follow = reducedMotion ? 0.035 : 0.078
  pointer.x = lerp(pointer.x, pointer.tx, follow)
  pointer.y = lerp(pointer.y, pointer.ty, follow)
  pointer.strength = lerp(pointer.strength, pointer.active ? 1 : 0, reducedMotion ? 0.035 : 0.08)
  themeMix = lerp(themeMix, props.isDark ? 1 : 0, themeSettling.value ? 0.38 : 0.14)

  drawBackground(ctx)

  if (!themeSettling.value) {
    drawDepthRings(ctx)
    drawFlowLanes(ctx)
    drawEnergyVeil(ctx)
    drawCells(ctx)
    drawParticles(ctx, delta)
    drawBottomSignal(ctx)
  }

  frameId = window.requestAnimationFrame(render)
}

watch(
  () => props.isDark,
  () => {
    if (mounted) triggerThemeBurst()
  }
)

onMounted(() => {
  mounted = true
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  resize()
  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  document.addEventListener('mouseleave', handlePointerLeave)
  window.addEventListener('blur', handlePointerLeave)
  frameId = window.requestAnimationFrame(render)
})

onBeforeUnmount(() => {
  mounted = false
  window.cancelAnimationFrame(frameId)
  window.clearTimeout(burstTimer)
  window.clearTimeout(settleTimer)
  window.removeEventListener('resize', resize)
  window.removeEventListener('pointermove', handlePointerMove)
  document.removeEventListener('mouseleave', handlePointerLeave)
  window.removeEventListener('blur', handlePointerLeave)
})
</script>

<style scoped>
.route-background {
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: #f8fafc;
  contain: strict;
}

.route-background.is-dark {
  background: #020617;
}

.route-background-canvas,
.route-background-sheen,
.route-background-vignette,
.route-theme-flash {
  position: absolute;
  inset: 0;
}

.route-background-canvas {
  width: 100%;
  height: 100%;
}

.route-background-sheen {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.5), transparent 20%, transparent 72%, rgba(248, 250, 252, 0.78)),
    radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.42), transparent 34%),
    radial-gradient(circle at 76% 16%, rgba(20, 184, 166, 0.12), transparent 28%);
  mix-blend-mode: screen;
  opacity: 0.82;
}

.route-background.is-dark .route-background-sheen {
  background:
    linear-gradient(180deg, rgba(2, 6, 23, 0.16), transparent 18%, transparent 68%, rgba(2, 6, 23, 0.6)),
    radial-gradient(circle at 42% 18%, rgba(45, 212, 191, 0.095), transparent 34%),
    radial-gradient(circle at 78% 20%, rgba(96, 165, 250, 0.12), transparent 31%);
  opacity: 0.58;
}

.route-background-vignette {
  background:
    radial-gradient(circle at 50% 36%, transparent 0%, rgba(248, 250, 252, 0.12) 50%, rgba(248, 250, 252, 0.82) 100%),
    linear-gradient(90deg, rgba(248, 250, 252, 0.76), transparent 19%, transparent 82%, rgba(248, 250, 252, 0.76));
}

.route-background.is-dark .route-background-vignette {
  background:
    radial-gradient(circle at 50% 34%, rgba(2, 6, 23, 0.16) 0%, rgba(2, 6, 23, 0.34) 54%, rgba(2, 6, 23, 0.82) 100%),
    linear-gradient(90deg, rgba(2, 6, 23, 0.78), transparent 22%, transparent 80%, rgba(2, 6, 23, 0.78));
}

.route-theme-flash {
  background:
    radial-gradient(circle at 50% 42%, rgba(255, 255, 255, 0.72), rgba(45, 212, 191, 0.28) 24%, rgba(37, 99, 235, 0.2) 43%, transparent 68%);
  mix-blend-mode: screen;
  opacity: 0;
  transform: scale(0.16);
  will-change: opacity, transform;
}

.route-background.is-bursting .route-theme-flash {
  animation: route-theme-impact 0.52s cubic-bezier(0.16, 1, 0.3, 1);
}

.route-background.is-dark .route-theme-flash {
  background:
    radial-gradient(circle at 50% 42%, rgba(45, 212, 191, 0.72), rgba(96, 165, 250, 0.38) 24%, rgba(14, 165, 233, 0.22) 46%, transparent 69%);
}

@keyframes route-theme-impact {
  0% {
    opacity: 0;
    transform: scale(0.06);
  }
  22% {
    opacity: 0.52;
  }
  100% {
    opacity: 0;
    transform: scale(1.78);
  }
}

@media (prefers-reduced-motion: reduce) {
  .route-background-canvas {
    opacity: 0.76;
  }

  .route-background.is-bursting .route-theme-flash {
    animation-duration: 0.01ms;
  }
}
</style>
