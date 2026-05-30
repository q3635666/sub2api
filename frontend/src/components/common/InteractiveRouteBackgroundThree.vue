<template>
  <div
    class="route-background"
    :class="{
      'is-dark': isDark,
      'is-bursting': burstActive,
      'is-settling': themeSettling,
      'is-subtle': subtle,
      'is-webgl-ready': webglReady
    }"
    aria-hidden="true"
  >
    <div ref="mountRef" class="route-background-webgl"></div>
    <div v-if="!webglReady" class="route-background-fallback"></div>
    <div class="route-background-sheen"></div>
    <div class="route-background-vignette"></div>
    <div class="route-theme-flash"></div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { publicSiteConfig } from '../../../public-site.config'

const props = withDefaults(defineProps<{
  isDark: boolean
  subtle?: boolean
}>(), {
  subtle: false
})

type BackgroundUniforms = {
  uTime: { value: number }
  uResolution: { value: THREE.Vector2 }
  uPointer: { value: THREE.Vector2 }
  uTheme: { value: number }
  uPointerStrength: { value: number }
  uBoost: { value: number }
  uPixelRatio: { value: number }
  uSubtle: { value: number }
  uLightSceneTuning: { value: THREE.Vector4 }
  uDarkSceneTuning: { value: THREE.Vector4 }
  uLightEffectTuning: { value: THREE.Vector4 }
  uDarkEffectTuning: { value: THREE.Vector4 }
  uLightOrbitTuning: { value: THREE.Vector4 }
  uDarkOrbitTuning: { value: THREE.Vector4 }
}

const threeBackgroundConfig = publicSiteConfig.background.three

function createSceneTuningVector(theme: typeof threeBackgroundConfig.light) {
  return new THREE.Vector4(
    theme.backgroundDepth,
    theme.auroraIntensity,
    theme.gridIntensity,
    theme.perspectiveGridIntensity
  )
}

function createEffectTuningVector(theme: typeof threeBackgroundConfig.light) {
  return new THREE.Vector4(
    theme.pointerGlowIntensity,
    theme.particleOpacity,
    theme.particleSize,
    theme.vignetteStrength
  )
}

function createOrbitTuningVector(theme: typeof threeBackgroundConfig.light) {
  return new THREE.Vector4(
    theme.orbitRingIntensity,
    theme.orbitRingDensity,
    theme.orbitRingSpeed,
    theme.orbitRingWidth
  )
}

const mountRef = ref<HTMLDivElement | null>(null)
const burstActive = ref(false)
const themeSettling = ref(false)
const webglReady = ref(false)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.Camera | null = null
let uniforms: BackgroundUniforms | null = null
let backgroundMaterial: THREE.ShaderMaterial | null = null
let particleMaterial: THREE.ShaderMaterial | null = null
let backgroundMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null = null
let particlePoints: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> | null = null
let frameId = 0
let frameTimer = 0
let resizeFrame = 0
let resizeRebuildTimer = 0
let burstTimer = 0
let settleTimer = 0
let pointerIdleTimer = 0
let pointerFrame = 0
let pendingPointerX = 0.5
let pendingPointerY = 0.42
let boostUntil = 0
let burstDuration = 560
let width = 1
let height = 1
let dpr = 1
let lastFrame = 0
let themeMix = props.isDark ? 1 : 0
let currentParticleCount = 0
let mounted = false
let pageVisible = true
let reducedMotion = false

const pointer = {
  x: 0.5,
  y: 0.42,
  tx: 0.5,
  ty: 0.42,
  active: false,
  strength: 0
}

const backgroundVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const backgroundFragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uTheme;
  uniform float uPointerStrength;
  uniform float uBoost;
  uniform float uSubtle;
  uniform vec4 uLightSceneTuning;
  uniform vec4 uDarkSceneTuning;
  uniform vec4 uLightEffectTuning;
  uniform vec4 uDarkEffectTuning;
  uniform vec4 uLightOrbitTuning;
  uniform vec4 uDarkOrbitTuning;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.52;
    for (int i = 0; i < 4; i++) {
      value += noise(p) * amplitude;
      p *= 2.02;
      amplitude *= 0.5;
    }
    return value;
  }

  float gridLine(vec2 p, float scale, float width) {
    vec2 cell = abs(fract(p * scale) - 0.5);
    float line = min(cell.x, cell.y);
    return 1.0 - smoothstep(0.0, width, line);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 pointerUv = vec2(uPointer.x, 1.0 - uPointer.y);
    vec2 pointerSpace = (uv - pointerUv) * vec2(aspect, 1.0);
    float pointerDistance = length(pointerSpace);
    float pointerGlow = smoothstep(0.42, 0.0, pointerDistance);
    float pointerCore = smoothstep(0.18, 0.0, pointerDistance);
    float subtleScale = mix(1.0, 0.72, uSubtle);
    vec2 pointerParallax = (pointerUv - vec2(0.5)) * vec2(aspect, 1.0);

    vec3 lightA = vec3(239.0, 250.0, 249.0) / 255.0;
    vec3 lightB = vec3(219.0, 245.0, 239.0) / 255.0;
    vec3 lightC = vec3(225.0, 237.0, 255.0) / 255.0;
    vec3 darkA = vec3(2.0, 6.0, 23.0) / 255.0;
    vec3 darkB = vec3(5.0, 18.0, 31.0) / 255.0;
    vec3 darkC = vec3(4.0, 29.0, 35.0) / 255.0;
    vec3 primary = mix(vec3(13.0, 148.0, 136.0), vec3(34.0, 197.0, 177.0), uTheme) / 255.0;
    vec3 secondary = mix(vec3(37.0, 99.0, 235.0), vec3(76.0, 138.0, 212.0), uTheme) / 255.0;
    vec3 tertiary = mix(vec3(2.0, 132.0, 199.0), vec3(82.0, 176.0, 214.0), uTheme) / 255.0;
    vec3 bgA = mix(lightA, darkA, uTheme);
    vec3 bgB = mix(lightB, darkB, uTheme);
    vec3 bgC = mix(lightC, darkC, uTheme);
    vec4 sceneTuning = mix(uLightSceneTuning, uDarkSceneTuning, uTheme);
    vec4 effectTuning = mix(uLightEffectTuning, uDarkEffectTuning, uTheme);
    vec4 orbitTuning = mix(uLightOrbitTuning, uDarkOrbitTuning, uTheme);
    float backgroundDepth = sceneTuning.x;
    float auroraIntensity = sceneTuning.y;
    float gridIntensity = sceneTuning.z;
    float perspectiveGridIntensity = sceneTuning.w;
    float pointerGlowIntensity = effectTuning.x;
    float vignetteStrength = effectTuning.w;
    float orbitRingIntensity = max(0.0, orbitTuning.x);
    float orbitRingDensity = max(0.05, orbitTuning.y);
    float orbitRingSpeed = orbitTuning.z;
    float orbitRingWidth = max(0.0, orbitTuning.w);

    vec3 color = mix(bgA, bgB, smoothstep(0.0, 0.76, uv.y));
    color = mix(color, bgC, smoothstep(0.28, 1.0, uv.x + uv.y * 0.28));
    color = mix(bgA, color, backgroundDepth);

    vec2 drift = vec2(sin(uTime * 0.13) * 0.045, cos(uTime * 0.11) * 0.032);
    float field = fbm(vec2(uv.x * aspect, uv.y) * 2.1 + drift + uTime * 0.018);
    float aurora = smoothstep(0.18, 0.94, field);
    vec3 auroraColor = mix(tertiary, secondary, field);
    color = mix(color, auroraColor, aurora * (1.0 - uTheme) * 0.11 * auroraIntensity * subtleScale);
    color += auroraColor * aurora * uTheme * 0.062 * auroraIntensity * subtleScale;

    vec2 gridUv = vec2(uv.x * aspect, uv.y);
    vec2 depthPivot = vec2(0.5 + pointerParallax.x * 0.035, 0.46 + pointerParallax.y * 0.026);
    vec2 depthVector = (uv - depthPivot) * vec2(aspect, 1.0);
    float depthRadius = length(depthVector);
    float depthRings = 1.0 - smoothstep(0.0, 0.018, abs(fract(depthRadius * 8.4 - uTime * 0.065) - 0.5));
    float depthLanes = gridLine(vec2(depthVector.x / max(0.18, depthRadius), depthRadius) + pointerParallax * 0.08, 5.0, 0.012);
    float depthMask = smoothstep(0.08, 0.38, depthRadius) * (1.0 - smoothstep(0.76, 1.24, depthRadius));
    float depthField = (depthRings * 0.48 + depthLanes * 0.24) * depthMask;

    vec2 nearGridUv = gridUv + vec2(uTime * 0.005, -uTime * 0.004) - pointerParallax * (0.022 + uPointerStrength * 0.018);
    nearGridUv += depthVector * pointerCore * (0.016 + uPointerStrength * 0.025);
    vec2 farGridUv = gridUv + vec2(-uTime * 0.002, uTime * 0.003) + pointerParallax * 0.014;
    float fineGrid = gridLine(nearGridUv, 34.0, 0.018);
    float liftedGrid = gridLine(nearGridUv - pointerParallax * 0.03 + vec2(0.004, -0.003), 34.0, 0.012);
    float softGrid = gridLine(farGridUv, 12.0, 0.012);
    float broken = step(0.64, hash(floor(gridUv * 34.0) + floor(uTime * 1.4)));
    float depthPlane = smoothstep(0.18, 0.94, uv.y + pointerParallax.y * 0.12);
    float depthShadow = softGrid * (1.0 - depthPlane) * (0.018 + uTheme * 0.022) * gridIntensity * subtleScale;
    float perspectiveDepth = smoothstep(0.24, 1.0, uv.y);
    float perspectiveScale = 1.0 / max(0.22, 1.18 - uv.y * 0.92);
    vec2 floorUv = vec2((uv.x - 0.5) * aspect * perspectiveScale, (uv.y + 0.24) * perspectiveScale);
    floorUv += vec2(
      -pointerParallax.x * (0.036 + perspectiveDepth * 0.052),
      pointerParallax.y * (0.026 + perspectiveDepth * 0.042) + uTime * 0.006
    );
    float floorGrid = gridLine(floorUv, 8.0 + perspectiveDepth * 10.0, 0.011);
    float floorMask = perspectiveDepth * (0.48 + pointerGlow * 0.18);
    float matrixWake = fineGrid * pointerGlow * broken * (0.26 + uPointerStrength * 0.7) * pointerGlowIntensity;
    color = mix(color, primary, fineGrid * (1.0 - uTheme) * 0.09 * gridIntensity * subtleScale);
    color = mix(color, secondary, softGrid * (1.0 - uTheme) * 0.052 * gridIntensity * subtleScale);
    color += primary * fineGrid * uTheme * (0.023 + depthPlane * 0.012) * gridIntensity * subtleScale;
    color += secondary * softGrid * uTheme * (0.012 + (1.0 - depthPlane) * 0.012) * gridIntensity * subtleScale;
    color = mix(color, mix(primary, secondary, perspectiveDepth), floorGrid * floorMask * (1.0 - uTheme) * 0.075 * perspectiveGridIntensity * subtleScale);
    color += mix(primary, secondary, perspectiveDepth) * floorGrid * floorMask * uTheme * 0.035 * perspectiveGridIntensity * subtleScale;
    vec3 depthColor = mix(secondary, primary, smoothstep(0.0, 1.0, uv.y + pointerGlow * 0.14));
    color = mix(color, depthColor, depthField * (1.0 - uTheme) * 0.052 * perspectiveGridIntensity * subtleScale);
    color += depthColor * depthField * uTheme * 0.024 * perspectiveGridIntensity * subtleScale;
    color += mix(primary, secondary, pointerGlow) * liftedGrid * pointerGlow * (0.025 + uPointerStrength * 0.035) * gridIntensity * pointerGlowIntensity * subtleScale;
    color = mix(color, bgA, depthShadow);

    vec3 wakeColor = mix(primary, tertiary, field);
    color = mix(color, wakeColor, matrixWake * (1.0 - uTheme) * 0.46 * subtleScale);
    color += wakeColor * matrixWake * uTheme * 0.56 * subtleScale;

    vec2 center = vec2(0.5 + (uPointer.x - 0.5) * 0.075, 0.48 - (uPointer.y - 0.5) * 0.052);
    vec2 ringSpace = (uv - center) * vec2(aspect * (0.73 + pointerGlow * 0.06), 4.2);
    float ringDistance = length(ringSpace);
    float ring = abs(sin(ringDistance * 18.0 * orbitRingDensity - uTime * 0.76 * orbitRingSpeed));
    float ringEdge = clamp(1.0 - 0.03 * orbitRingWidth, 0.84, 0.995);
    float ringMask = smoothstep(ringEdge, 1.0, ring) * smoothstep(1.42, 0.1, ringDistance);
    vec3 ringColor = mix(primary, secondary, uv.x);
    color = mix(color, ringColor, ringMask * (1.0 - uTheme) * (0.09 + uPointerStrength * 0.042) * pointerGlowIntensity * orbitRingIntensity * subtleScale);
    color += ringColor * ringMask * uTheme * (0.015 + uPointerStrength * 0.012) * pointerGlowIntensity * orbitRingIntensity * subtleScale;

    float beam = smoothstep(0.9, 0.1, abs(uv.y - 0.18 - sin(uv.x * 8.0 + uTime * 0.65) * 0.018));
    vec3 beamColor = mix(primary, secondary, uv.x);
    color = mix(color, beamColor, beam * (1.0 - uTheme) * 0.052 * pointerGlowIntensity * subtleScale);
    color += beamColor * beam * uTheme * 0.012 * pointerGlowIntensity * subtleScale;

    color = mix(color, primary, pointerGlow * (1.0 - uTheme) * (0.12 + uPointerStrength * 0.16) * pointerGlowIntensity * subtleScale);
    color = mix(color, secondary, pointerCore * (1.0 - uTheme) * (0.06 + uBoost * 0.09) * pointerGlowIntensity * subtleScale);
    color += primary * pointerGlow * uTheme * (0.024 + uPointerStrength * 0.05) * pointerGlowIntensity * subtleScale;
    color += secondary * pointerCore * uTheme * (0.012 + uBoost * 0.026) * pointerGlowIntensity * subtleScale;

    float grain = hash(gl_FragCoord.xy + floor(uTime * 24.0));
    color += (grain - 0.5) * mix(0.018, 0.014, uTheme);

    float vignette = smoothstep(0.95, 0.2, length((uv - 0.5) * vec2(aspect * 0.62, 0.85)) * vignetteStrength);
    color = mix(mix(color, bgA, 0.12), color, vignette);

    gl_FragColor = vec4(color, 1.0);
  }
`

const particleVertexShader = `
  precision highp float;

  attribute float aSeed;
  attribute float aSize;
  attribute float aTone;
  attribute float aDepth;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uTheme;
  uniform float uPointerStrength;
  uniform float uPixelRatio;
  uniform float uSubtle;
  uniform vec4 uLightEffectTuning;
  uniform vec4 uDarkEffectTuning;
  varying float vAlpha;
  varying float vTone;
  varying float vForce;
  varying float vDepth;

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 pointerNdc = vec2(uPointer.x * 2.0 - 1.0, (1.0 - uPointer.y) * 2.0 - 1.0);
    vec4 effectTuning = mix(uLightEffectTuning, uDarkEffectTuning, uTheme);
    float particleOpacity = effectTuning.y;
    float particleSize = effectTuning.z;
    vec2 pos = position.xy;
    float depthCurve = pow(aDepth, 1.32);
    float depthScale = mix(0.78, 1.34, depthCurve);
    pos *= depthScale;
    pos -= pointerNdc * (aDepth - 0.46) * (0.062 + uPointerStrength * 0.046);
    pos.x += pointerNdc.y * (aDepth - 0.5) * 0.018;
    pos.y += (aDepth - 0.5) * 0.092;
    pos.y = mod(pos.y + uTime * (0.024 + aSeed * 0.031 + depthCurve * 0.04), 2.48) - 1.24;
    pos.x += sin(uTime * (0.18 + aSeed * 0.21) + aSeed * 24.0) * (0.01 + depthCurve * 0.092);

    vec2 diff = (pos - pointerNdc) * vec2(aspect, 1.0);
    float distanceToPointer = length(diff);
    float force = smoothstep(0.42, 0.0, distanceToPointer) * uPointerStrength;
    pos += normalize(pos - pointerNdc + 0.0001) * force * (0.024 + depthCurve * 0.068);

    float nearPulse = smoothstep(0.62, 1.0, aDepth);
    gl_Position = vec4(pos * (1.0 + force * 0.018 + nearPulse * 0.012), 0.0, 1.0);
    gl_PointSize = aSize * uPixelRatio * (0.72 + depthCurve * 3.08 + force * 2.55) * particleSize * mix(1.06, 0.94, uTheme) * mix(1.0, 0.74, uSubtle);
    vAlpha = (0.18 + depthCurve * 0.76 + force * 0.52) * particleOpacity * mix(0.46, 0.66, uTheme) * mix(1.0, 0.72, uSubtle);
    vTone = aTone;
    vForce = force;
    vDepth = aDepth;
  }
`

const particleFragmentShader = `
  precision highp float;

  uniform float uTheme;
  varying float vAlpha;
  varying float vTone;
  varying float vForce;
  varying float vDepth;

  void main() {
    vec2 pixel = abs(gl_PointCoord - 0.5);
    float square = 1.0 - smoothstep(0.22, 0.38, max(pixel.x, pixel.y));
    float halo = 1.0 - smoothstep(0.2, 0.5, length(gl_PointCoord - 0.5));
    float depthHalo = halo * smoothstep(0.46, 1.0, vDepth) * 0.36;
    float pointAlpha = clamp(max(square, depthHalo), 0.0, 1.0);
    vec3 primary = mix(vec3(13.0, 148.0, 136.0), vec3(34.0, 197.0, 177.0), uTheme) / 255.0;
    vec3 secondary = mix(vec3(37.0, 99.0, 235.0), vec3(76.0, 138.0, 212.0), uTheme) / 255.0;
    vec3 tertiary = mix(vec3(2.0, 132.0, 199.0), vec3(82.0, 176.0, 214.0), uTheme) / 255.0;
    vec3 color = mix(primary, secondary, smoothstep(0.22, 0.72, vTone));
    color = mix(color, tertiary, smoothstep(0.68, 1.0, vTone));
    color = mix(color, vec3(0.96, 1.0, 0.98), vForce * mix(0.08, 0.065, uTheme) + smoothstep(0.78, 1.0, vDepth) * 0.055);
    gl_FragColor = vec4(color, pointAlpha * vAlpha);
  }
`

function rand(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453123
  return value - Math.floor(value)
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount
}

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
  } catch {
    return false
  }
}

function getParticleCount() {
  const baseCount = Math.round((width * height) / 2500)
  return Math.round(Math.min(820, Math.max(360, baseCount)) * (props.subtle ? 0.72 : 1))
}

function createUniforms(): BackgroundUniforms {
  return {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(width, height) },
    uPointer: { value: new THREE.Vector2(pointer.x, pointer.y) },
    uTheme: { value: themeMix },
    uPointerStrength: { value: 0 },
    uBoost: { value: 0 },
    uPixelRatio: { value: dpr },
    uSubtle: { value: props.subtle ? 1 : 0 },
    uLightSceneTuning: { value: createSceneTuningVector(threeBackgroundConfig.light) },
    uDarkSceneTuning: { value: createSceneTuningVector(threeBackgroundConfig.dark) },
    uLightEffectTuning: { value: createEffectTuningVector(threeBackgroundConfig.light) },
    uDarkEffectTuning: { value: createEffectTuningVector(threeBackgroundConfig.dark) },
    uLightOrbitTuning: { value: createOrbitTuningVector(threeBackgroundConfig.light) },
    uDarkOrbitTuning: { value: createOrbitTuningVector(threeBackgroundConfig.dark) }
  }
}

function disposeParticles() {
  if (!scene || !particlePoints) return
  scene.remove(particlePoints)
  particlePoints.geometry.dispose()
  particlePoints.material.dispose()
  particlePoints = null
  particleMaterial = null
  currentParticleCount = 0
}

function buildParticles() {
  if (!scene || !uniforms) return

  disposeParticles()

  const count = getParticleCount()
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const sizes = new Float32Array(count)
  const tones = new Float32Array(count)
  const depths = new Float32Array(count)

  for (let index = 0; index < count; index += 1) {
    const seed = rand(index * 9.17 + 3)
    const depth = rand(index * 11.73 + 4)
    positions[index * 3] = rand(index * 5.17 + 2) * 2.34 - 1.17
    positions[index * 3 + 1] = rand(index * 7.11 + 9) * 2.42 - 1.21
    positions[index * 3 + 2] = 0
    seeds[index] = seed
    sizes[index] = 1.2 + rand(index * 23.81) * 2.6
    tones[index] = rand(index * 31.91 + 11)
    depths[index] = depth
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('aTone', new THREE.BufferAttribute(tones, 1))
  geometry.setAttribute('aDepth', new THREE.BufferAttribute(depths, 1))

  particleMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: particleVertexShader,
    fragmentShader: particleFragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NormalBlending
  })

  particlePoints = new THREE.Points(geometry, particleMaterial)
  particlePoints.frustumCulled = false
  scene.add(particlePoints)
  currentParticleCount = count
}

function initThree() {
  const mount = mountRef.value
  if (!mount || !canUseWebGL()) return false

  width = Math.max(1, window.innerWidth)
  height = Math.max(1, window.innerHeight)
  dpr = Math.min(window.devicePixelRatio || 1, props.subtle ? 1.25 : 1.45)
  uniforms = createUniforms()
  scene = new THREE.Scene()
  camera = new THREE.Camera()

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
    stencil: false,
    depth: false
  })
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(dpr)
  renderer.setSize(width, height, false)
  mount.appendChild(renderer.domElement)

  backgroundMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: backgroundVertexShader,
    fragmentShader: backgroundFragmentShader,
    depthTest: false,
    depthWrite: false
  })

  backgroundMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), backgroundMaterial)
  backgroundMesh.frustumCulled = false
  scene.add(backgroundMesh)
  buildParticles()
  webglReady.value = true
  return true
}

function resize() {
  width = Math.max(1, window.innerWidth)
  height = Math.max(1, window.innerHeight)
  dpr = Math.min(window.devicePixelRatio || 1, props.subtle ? 1.25 : 1.45)
  renderer?.setPixelRatio(dpr)
  renderer?.setSize(width, height, false)
  uniforms?.uResolution.value.set(width, height)
  if (uniforms) {
    uniforms.uPixelRatio.value = dpr
  }
  scheduleParticleRebuild()
  boostRender(900)
}

function scheduleParticleRebuild() {
  if (resizeRebuildTimer) {
    window.clearTimeout(resizeRebuildTimer)
  }

  resizeRebuildTimer = window.setTimeout(() => {
    resizeRebuildTimer = 0
    if (!mounted || !renderer || !scene || !uniforms) return
    if (getParticleCount() !== currentParticleCount) {
      buildParticles()
      boostRender(500)
    }
  }, 180)
}

function scheduleResize() {
  if (resizeFrame) return
  resizeFrame = window.requestAnimationFrame(() => {
    resizeFrame = 0
    resize()
  })
}

function applyPointerMove() {
  pointerFrame = 0
  pointer.tx = pendingPointerX
  pointer.ty = pendingPointerY
  pointer.active = true
  boostRender(1000)

  window.clearTimeout(pointerIdleTimer)
  pointerIdleTimer = window.setTimeout(() => {
    pointer.active = false
    boostRender(700)
  }, 820)
}

function handlePointerMove(event: PointerEvent) {
  pendingPointerX = Math.min(1, Math.max(0, event.clientX / Math.max(width, 1)))
  pendingPointerY = Math.min(1, Math.max(0, event.clientY / Math.max(height, 1)))
  if (!pointerFrame) {
    pointerFrame = window.requestAnimationFrame(applyPointerMove)
  }
}

function handlePointerLeave() {
  window.clearTimeout(pointerIdleTimer)
  if (pointerFrame) {
    window.cancelAnimationFrame(pointerFrame)
    pointerFrame = 0
  }
  pointer.active = false
  pointer.tx = 0.5
  pointer.ty = 0.42
  pendingPointerX = pointer.tx
  pendingPointerY = pointer.ty
  boostRender(800)
}

function triggerThemeBurst() {
  window.clearTimeout(burstTimer)
  window.clearTimeout(settleTimer)
  themeSettling.value = true
  burstActive.value = false
  boostRender(burstDuration + 1100)

  window.requestAnimationFrame(() => {
    burstActive.value = true
    burstTimer = window.setTimeout(() => {
      burstActive.value = false
    }, burstDuration)
  })

  settleTimer = window.setTimeout(() => {
    themeSettling.value = false
  }, burstDuration + 180)
}

function render(now = 0) {
  if (!renderer || !scene || !camera || !uniforms || !pageVisible) {
    frameId = 0
    return
  }

  frameId = 0
  if (frameTimer) {
    window.clearTimeout(frameTimer)
    frameTimer = 0
  }

  const delta = lastFrame ? Math.min(48, now - lastFrame) : 16
  lastFrame = now
  const follow = reducedMotion ? 0.035 : 0.085
  pointer.x = lerp(pointer.x, pointer.tx, follow)
  pointer.y = lerp(pointer.y, pointer.ty, follow)
  pointer.strength = lerp(pointer.strength, pointer.active ? 1 : 0, reducedMotion ? 0.035 : 0.08)
  themeMix = lerp(themeMix, props.isDark ? 1 : 0, themeSettling.value ? 0.36 : 0.13)

  const targetTheme = props.isDark ? 1 : 0
  const isBoosted =
    now < boostUntil ||
    pointer.active ||
    pointer.strength > 0.012 ||
    themeSettling.value ||
    Math.abs(themeMix - targetTheme) > 0.004
  const boost = Math.max(pointer.strength, themeSettling.value ? 1 : now < boostUntil ? 0.34 : 0)

  uniforms.uTime.value += (delta * 0.001) * (reducedMotion ? 0.45 : 1)
  uniforms.uPointer.value.set(pointer.x, pointer.y)
  uniforms.uTheme.value = themeMix
  uniforms.uPointerStrength.value = pointer.strength
  uniforms.uBoost.value = boost
  uniforms.uSubtle.value = props.subtle ? 1 : 0

  renderer.render(scene, camera)

  const targetFps = reducedMotion ? 12 : isBoosted ? 60 : props.subtle ? 18 : 24
  const frameDelay = Math.max(0, Math.round(1000 / targetFps) - 8)

  if (frameDelay <= 0) {
    frameId = window.requestAnimationFrame(render)
  } else {
    frameTimer = window.setTimeout(() => {
      frameTimer = 0
      if (mounted && pageVisible && !frameId) {
        frameId = window.requestAnimationFrame(render)
      }
    }, frameDelay)
  }
}

function boostRender(duration = 0) {
  if (!mounted || !pageVisible || !renderer) return
  boostUntil = Math.max(boostUntil, performance.now() + duration)
  if (!frameId) {
    frameId = window.requestAnimationFrame(render)
  }
}

function startRendering() {
  if (!mounted || !pageVisible || !renderer || frameId) return
  lastFrame = 0
  boostRender(1000)
}

function stopRendering() {
  if (frameId) {
    window.cancelAnimationFrame(frameId)
    frameId = 0
  }
  if (frameTimer) {
    window.clearTimeout(frameTimer)
    frameTimer = 0
  }
  lastFrame = 0
}

function handleVisibilityChange() {
  pageVisible = !document.hidden
  if (pageVisible) startRendering()
  else stopRendering()
}

function disposeThree() {
  stopRendering()
  disposeParticles()
  if (scene && backgroundMesh) {
    scene.remove(backgroundMesh)
    backgroundMesh.geometry.dispose()
    backgroundMesh.material.dispose()
    backgroundMesh = null
    backgroundMaterial = null
  }
  renderer?.dispose()
  renderer?.domElement.remove()
  renderer = null
  scene = null
  camera = null
  uniforms = null
  webglReady.value = false
}

watch(
  () => props.isDark,
  () => {
    if (mounted) triggerThemeBurst()
  }
)

onMounted(() => {
  mounted = true
  pageVisible = !document.hidden
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (initThree()) {
    window.addEventListener('resize', scheduleResize)
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.addEventListener('mouseleave', handlePointerLeave)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handlePointerLeave)
    startRendering()
  }
})

onBeforeUnmount(() => {
  mounted = false
  window.clearTimeout(burstTimer)
  window.clearTimeout(settleTimer)
  window.clearTimeout(pointerIdleTimer)
  if (resizeFrame) {
    window.cancelAnimationFrame(resizeFrame)
    resizeFrame = 0
  }
  if (resizeRebuildTimer) {
    window.clearTimeout(resizeRebuildTimer)
    resizeRebuildTimer = 0
  }
  if (pointerFrame) {
    window.cancelAnimationFrame(pointerFrame)
    pointerFrame = 0
  }
  window.removeEventListener('resize', scheduleResize)
  window.removeEventListener('pointermove', handlePointerMove)
  document.removeEventListener('mouseleave', handlePointerLeave)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('blur', handlePointerLeave)
  disposeThree()
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

.route-background-webgl,
.route-background-fallback,
.route-background-sheen,
.route-background-vignette,
.route-theme-flash {
  position: absolute;
  inset: 0;
}

.route-background-webgl {
  opacity: 0;
  transition: opacity 0.7s ease;
}

.route-background.is-webgl-ready .route-background-webgl {
  opacity: 1;
}

.route-background-webgl :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

.route-background-fallback {
  background:
    radial-gradient(circle at 72% 18%, rgba(14, 165, 233, 0.14), transparent 42%),
    radial-gradient(circle at 45% 42%, rgba(20, 184, 166, 0.12), transparent 48%),
    linear-gradient(135deg, #f8fcff, #ebf9f7 48%, #f1f7ff);
  animation: route-fallback-breathe 12s ease-in-out infinite alternate;
}

.route-background.is-dark .route-background-fallback {
  background:
    radial-gradient(circle at 72% 18%, rgba(96, 165, 250, 0.15), transparent 42%),
    radial-gradient(circle at 45% 42%, rgba(45, 212, 191, 0.13), transparent 48%),
    linear-gradient(135deg, #020617, #05121f 48%, #041d23);
}

.route-background-sheen {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), transparent 20%, transparent 72%, rgba(248, 250, 252, 0.34)),
    radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.16), transparent 34%),
    radial-gradient(circle at 76% 16%, rgba(13, 148, 136, 0.08), transparent 28%);
  mix-blend-mode: screen;
  opacity: 0.42;
}

.route-background.is-dark .route-background-sheen {
  background:
    linear-gradient(180deg, rgba(2, 6, 23, 0.22), transparent 18%, transparent 68%, rgba(2, 6, 23, 0.72)),
    radial-gradient(circle at 42% 18%, rgba(45, 212, 191, 0.034), transparent 34%),
    radial-gradient(circle at 78% 20%, rgba(96, 165, 250, 0.044), transparent 31%);
  opacity: 0.36;
}

.route-background-vignette {
  background:
    radial-gradient(circle at 50% 36%, transparent 0%, rgba(248, 250, 252, 0.03) 50%, rgba(248, 250, 252, 0.38) 100%),
    linear-gradient(90deg, rgba(248, 250, 252, 0.32), transparent 19%, transparent 82%, rgba(248, 250, 252, 0.32));
}

.route-background.is-dark .route-background-vignette {
  background:
    radial-gradient(circle at 50% 34%, rgba(2, 6, 23, 0.24) 0%, rgba(2, 6, 23, 0.45) 54%, rgba(2, 6, 23, 0.9) 100%),
    linear-gradient(90deg, rgba(2, 6, 23, 0.86), transparent 22%, transparent 80%, rgba(2, 6, 23, 0.86));
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
  animation: route-theme-impact 0.56s cubic-bezier(0.16, 1, 0.3, 1);
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
    opacity: 0.54;
  }
  100% {
    opacity: 0;
    transform: scale(1.84);
  }
}

@keyframes route-fallback-breathe {
  from {
    filter: saturate(1) brightness(1);
    transform: scale(1);
  }
  to {
    filter: saturate(1.16) brightness(1.04);
    transform: scale(1.035);
  }
}

@media (prefers-reduced-motion: reduce) {
  .route-background-webgl {
    opacity: 0.78;
  }

  .route-background-fallback,
  .route-background.is-bursting .route-theme-flash {
    animation-duration: 0.01ms;
  }
}
</style>
