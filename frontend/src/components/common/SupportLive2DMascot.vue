<template>
  <button
    ref="rootRef"
    class="live2d-support"
    :class="{ 'is-active': active, 'is-settled': settled }"
    type="button"
    :aria-label="label"
    :aria-expanded="active"
    @click="$emit('activate')"
    @pointerenter="settled = false"
    @pointerleave="settleLook"
  >
    <span class="mascot-aura" aria-hidden="true"></span>
    <span class="mascot-orbit" aria-hidden="true"></span>
    <span class="mascot-stage" aria-hidden="true">
      <svg class="mascot-figure" viewBox="0 0 148 178" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="mascot-body" x1="23" x2="126" y1="116" y2="178" gradientUnits="userSpaceOnUse">
            <stop stop-color="#0f766e" />
            <stop offset="0.48" stop-color="#155e75" />
            <stop offset="1" stop-color="#1d4ed8" />
          </linearGradient>
          <linearGradient id="mascot-face" x1="39" x2="112" y1="43" y2="113" gradientUnits="userSpaceOnUse">
            <stop stop-color="#f7fffb" />
            <stop offset="1" stop-color="#dffbf2" />
          </linearGradient>
          <linearGradient id="mascot-hair" x1="36" x2="118" y1="29" y2="91" gradientUnits="userSpaceOnUse">
            <stop stop-color="#0f172a" />
            <stop offset="0.55" stop-color="#123047" />
            <stop offset="1" stop-color="#0f766e" />
          </linearGradient>
          <radialGradient id="mascot-glow" cx="0" cy="0" r="1" gradientTransform="matrix(56 0 0 24 74 150)" gradientUnits="userSpaceOnUse">
            <stop stop-color="#5eead4" stop-opacity="0.34" />
            <stop offset="1" stop-color="#2563eb" stop-opacity="0" />
          </radialGradient>
        </defs>

        <ellipse class="shadow" cx="74" cy="156" rx="52" ry="15" fill="url(#mascot-glow)" />

        <g class="body">
          <path
            d="M34 151c4-26 19-42 40-42s37 16 41 42c2 13-5 20-19 20H53c-14 0-21-7-19-20Z"
            fill="url(#mascot-body)"
          />
          <path
            d="M55 126c7 8 31 8 38 0l-6 31H61l-6-31Z"
            fill="rgba(255,255,255,.24)"
          />
          <path
            d="M47 149c14 7 39 7 55 0"
            fill="none"
            stroke="#99f6e4"
            stroke-linecap="round"
            stroke-opacity=".42"
            stroke-width="2.4"
          />
        </g>

        <g class="head">
          <path
            d="M34 78c0-29 17-50 42-50 24 0 41 19 41 48 0 29-17 49-42 49-24 0-41-19-41-47Z"
            fill="url(#mascot-face)"
          />
          <path
            class="hair"
            d="M34 76c-1-31 17-53 43-53 23 0 40 15 44 39-10-8-20-7-32-4-21 5-36 2-51-8-3 8-4 17-4 26Z"
            fill="url(#mascot-hair)"
          />
          <path
            d="M42 84c5 20 18 31 35 31 16 0 29-10 34-30"
            fill="none"
            stroke="#0f766e"
            stroke-linecap="round"
            stroke-opacity=".15"
            stroke-width="3"
          />

          <g class="eyes">
            <g class="eye eye-left">
              <ellipse cx="60" cy="81" rx="9.2" ry="10.8" fill="#ecfeff" />
              <circle class="pupil" cx="60" cy="82" r="4.7" fill="#0f172a" />
              <circle class="spark" cx="58" cy="79" r="1.7" fill="#fff" />
            </g>
            <g class="eye eye-right">
              <ellipse cx="91" cy="81" rx="9.2" ry="10.8" fill="#ecfeff" />
              <circle class="pupil" cx="91" cy="82" r="4.7" fill="#0f172a" />
              <circle class="spark" cx="89" cy="79" r="1.7" fill="#fff" />
            </g>
          </g>

          <path class="mouth" d="M68 101c4 4 12 4 16 0" fill="none" stroke="#0f766e" stroke-linecap="round" stroke-width="3" />

          <g class="headset">
            <path
              d="M38 78c0-27 14-43 37-43s37 16 37 43"
              fill="none"
              stroke="#5eead4"
              stroke-linecap="round"
              stroke-opacity=".78"
              stroke-width="4"
            />
            <rect x="25" y="73" width="16" height="27" rx="8" fill="#134e4a" />
            <rect x="108" y="73" width="16" height="27" rx="8" fill="#134e4a" />
            <path
              d="M115 100c-3 13-13 20-29 21"
              fill="none"
              stroke="#5eead4"
              stroke-linecap="round"
              stroke-width="3"
            />
            <circle cx="84" cy="121" r="4" fill="#99f6e4" />
          </g>
        </g>

        <g class="arms">
          <path
            d="M42 134c-13 4-21 11-25 23"
            fill="none"
            stroke="#99f6e4"
            stroke-linecap="round"
            stroke-width="8"
          />
          <path
            d="M106 134c12 4 20 11 25 22"
            fill="none"
            stroke="#93c5fd"
            stroke-linecap="round"
            stroke-width="8"
          />
        </g>
      </svg>
    </span>
  </button>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

defineProps<{
  active: boolean
  label: string
}>()

const emit = defineEmits<{
  activate: []
  ready: []
}>()

const rootRef = ref<HTMLButtonElement | null>(null)
const settled = ref(true)

let animationFrame = 0
let settleTimer = 0
let pointerX = 0
let pointerY = 0
let reducedMotion = false

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function applyLook(x: number, y: number) {
  const root = rootRef.value
  if (!root) return
  root.style.setProperty('--look-x', x.toFixed(3))
  root.style.setProperty('--look-y', y.toFixed(3))
  root.style.setProperty('--tilt', `${(x * 4.8).toFixed(2)}deg`)
}

function updateLook() {
  animationFrame = 0
  const root = rootRef.value
  if (!root || reducedMotion) return

  const rect = root.getBoundingClientRect()
  const centerX = rect.left + rect.width * 0.5
  const centerY = rect.top + rect.height * 0.42
  const x = clamp((pointerX - centerX) / Math.max(rect.width * 0.72, 1), -1, 1)
  const y = clamp((pointerY - centerY) / Math.max(rect.height * 0.72, 1), -1, 1)
  settled.value = false
  applyLook(x, y)
}

function handlePointerMove(event: PointerEvent) {
  pointerX = event.clientX
  pointerY = event.clientY
  window.clearTimeout(settleTimer)
  if (!animationFrame) {
    animationFrame = window.requestAnimationFrame(updateLook)
  }
  settleTimer = window.setTimeout(settleLook, 1400)
}

function settleLook() {
  settled.value = true
  window.clearTimeout(settleTimer)
  if (animationFrame) {
    window.cancelAnimationFrame(animationFrame)
    animationFrame = 0
  }
  applyLook(0, 0)
}

onMounted(async () => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  await nextTick()
  requestAnimationFrame(() => emit('ready'))
})

onBeforeUnmount(() => {
  window.clearTimeout(settleTimer)
  if (animationFrame) {
    window.cancelAnimationFrame(animationFrame)
  }
  window.removeEventListener('pointermove', handlePointerMove)
})
</script>

<style scoped>
.live2d-support {
  --look-x: 0;
  --look-y: 0;
  --tilt: 0deg;
  position: relative;
  display: grid;
  width: 142px;
  min-height: 148px;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #0f766e;
  cursor: pointer;
  isolation: isolate;
  touch-action: manipulation;
}

.mascot-aura,
.mascot-orbit {
  pointer-events: none;
  position: absolute;
  inset: auto 8px 8px;
  z-index: -1;
  height: 82px;
  border-radius: 999px;
}

.mascot-aura {
  background:
    radial-gradient(circle at 45% 46%, rgba(94, 234, 212, 0.26), transparent 58%),
    radial-gradient(circle at 72% 52%, rgba(59, 130, 246, 0.18), transparent 64%);
  filter: blur(12px);
  opacity: 0.92;
  transform: translateY(10px);
}

.mascot-orbit {
  border: 1px solid rgba(45, 212, 191, 0.18);
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.12), rgba(37, 99, 235, 0.07)),
    rgba(255, 255, 255, 0.48);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78),
    0 18px 42px rgba(15, 23, 42, 0.09);
  backdrop-filter: blur(24px) saturate(1.18);
  -webkit-backdrop-filter: blur(24px) saturate(1.18);
}

:global(.dark) .mascot-orbit {
  border-color: rgba(94, 234, 212, 0.2);
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.18), rgba(37, 99, 235, 0.1)),
    rgba(15, 23, 42, 0.58);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.13),
    0 18px 42px rgba(0, 0, 0, 0.34),
    0 8px 20px rgba(20, 184, 166, 0.1);
}

.mascot-stage {
  position: relative;
  display: grid;
  z-index: 1;
  width: 122px;
  height: 142px;
  margin-top: 0;
  place-items: center;
  transform:
    translate(calc(var(--look-x) * 4px), calc(var(--look-y) * 3px))
    rotate(var(--tilt));
  transform-origin: 50% 78%;
  transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
  animation: mascot-breathe 4.8s ease-in-out infinite;
}

.live2d-support:hover .mascot-stage,
.live2d-support.is-active .mascot-stage {
  animation-duration: 3.6s;
}

.mascot-figure {
  width: 130px;
  height: 156px;
  overflow: visible;
  filter: drop-shadow(0 18px 22px rgba(15, 23, 42, 0.2));
  transform: translateY(-6px);
}

:global(.dark) .mascot-figure {
  filter: drop-shadow(0 18px 24px rgba(0, 0, 0, 0.35));
}

.head {
  transform:
    translate(calc(var(--look-x) * 3px), calc(var(--look-y) * 2px))
    rotate(calc(var(--look-x) * 2.7deg));
  transform-box: fill-box;
  transform-origin: center bottom;
  transition: transform 0.26s ease;
}

.pupil,
.spark {
  transform: translate(calc(var(--look-x) * 4px), calc(var(--look-y) * 3px));
  transform-box: fill-box;
  transition: transform 0.16s ease-out;
}

.eye {
  transform-origin: center;
  animation: mascot-blink 6.2s infinite;
}

.mouth {
  transform: translateY(calc(var(--look-y) * 1.4px));
  transition: transform 0.2s ease;
}

.headset {
  transform:
    translate(calc(var(--look-x) * 1.7px), calc(var(--look-y) * 1.1px))
    rotate(calc(var(--look-x) * 1.2deg));
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 0.22s ease;
}

.arms {
  transform: translateY(calc(var(--look-y) * -1.5px));
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 0.24s ease;
}

.live2d-support::after {
  content: '';
  pointer-events: none;
  position: absolute;
  right: 18px;
  bottom: 22px;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #5eead4;
  box-shadow:
    0 0 0 5px rgba(94, 234, 212, 0.12),
    0 0 18px rgba(94, 234, 212, 0.48);
  opacity: 0.88;
}

@keyframes mascot-breathe {
  0%,
  100% {
    transform:
      translate(calc(var(--look-x) * 4px), calc(var(--look-y) * 3px))
      rotate(var(--tilt))
      translateY(0);
  }
  50% {
    transform:
      translate(calc(var(--look-x) * 4px), calc(var(--look-y) * 3px))
      rotate(var(--tilt))
      translateY(-3px);
  }
}

@keyframes mascot-blink {
  0%,
  90%,
  100% {
    transform: scaleY(1);
  }
  93%,
  95% {
    transform: scaleY(0.08);
  }
}

@media (max-width: 640px) {
  .live2d-support {
    width: 88px;
    min-height: 96px;
  }

  .mascot-stage {
    width: 78px;
    height: 82px;
  }

  .mascot-figure {
    width: 86px;
    height: 104px;
    transform: translateY(-8px);
  }

  .mascot-aura,
  .mascot-orbit {
    inset: auto 4px 5px;
    height: 50px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mascot-stage,
  .eye {
    animation: none;
  }

  .head,
  .pupil,
  .spark,
  .headset,
  .arms {
    transition-duration: 0.01ms;
  }
}
</style>
