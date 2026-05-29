<template>
  <button
    ref="hitRef"
    class="live2d-widget-hit"
    type="button"
    :aria-label="label"
    :aria-expanded="active"
    @click="$emit('activate')"
  >
    <span class="live2d-widget-label">
      <Icon name="chat" size="md" :stroke-width="2.4" />
      <span>{{ label }}</span>
    </span>
  </button>
  <div ref="hostRef" class="live2d-widget-host" aria-hidden="true"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from '@/components/icons/Icon.vue'

const props = defineProps<{
  active: boolean
  label: string
  modelPath: string
  messages?: string[]
  speechInitialDelayMs?: number
  speechIntervalMs?: number
  speechDisplayMs?: number
}>()

const emit = defineEmits<{
  activate: []
  ready: []
  fail: []
}>()

const hostRef = ref<HTMLDivElement | null>(null)
const hitRef = ref<HTMLButtonElement | null>(null)

let oml2d: {
  onLoad?: (fn: (status: 'loading' | 'success' | 'fail') => void) => void
  stageSlideOut?: () => Promise<void>
} | null = null
let failed = false

async function loadRealLive2D() {
  const host = hostRef.value
  if (!host || !props.modelPath) {
    emit('fail')
    return
  }

  try {
    const { loadOml2d } = await import('oh-my-live2d')
    oml2d = loadOml2d({
      parentElement: host,
      dockedPosition: 'right',
      mobileDisplay: true,
      primaryColor: '#14b8a6',
      sayHello: false,
      transitionTime: 420,
      initialStatus: 'active',
      menus: {
        disable: true
      },
      statusBar: {
        disable: true
      },
      tips: {
        idleTips: {
          message: []
        },
        welcomeTips: {
          message: {}
        },
        copyTips: {
          message: []
        },
        style: {
          display: 'none'
        },
        mobileStyle: {
          display: 'none'
        }
      },
      models: [
        {
          name: 'support',
          path: props.modelPath,
          scale: 0.075,
          position: [0, 30],
          mobileScale: 0.055,
          mobilePosition: [0, 20],
          motionPreloadStrategy: 'IDLE',
          volume: 0,
          stageStyle: {
            width: 150,
            height: 172,
            pointerEvents: 'none'
          },
          mobileStageStyle: {
            width: 90,
            height: 104,
            pointerEvents: 'none'
          }
        }
      ],
      stageStyle: {
        pointerEvents: 'none',
        zIndex: '82'
      }
    })

    oml2d.onLoad?.((status) => {
      if (status === 'success') {
        emit('ready')
      }
      if (status === 'fail') {
        failed = true
        emit('fail')
      }
    })
  } catch {
    failed = true
    emit('fail')
  }
}

onMounted(() => {
  loadRealLive2D()
})

onBeforeUnmount(() => {
  if (failed) return
  oml2d?.stageSlideOut?.().catch(() => undefined)
  hostRef.value?.replaceChildren()
  oml2d = null
})
</script>

<style scoped>
.live2d-widget-hit {
  position: relative;
  display: grid;
  width: 150px;
  min-height: 154px;
  place-items: end center;
  border: 0;
  background: transparent;
  cursor: pointer;
  isolation: isolate;
  touch-action: manipulation;
}

.live2d-widget-host {
  pointer-events: none;
  position: absolute;
  right: -3px;
  bottom: 16px;
  z-index: 1;
  width: 150px;
  height: 172px;
}

.live2d-widget-label {
  position: absolute;
  right: 4px;
  bottom: 9px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 44px;
  border-radius: 999px;
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.16), rgba(37, 99, 235, 0.08)),
    rgba(255, 255, 255, 0.68);
  padding: 0 15px;
  color: #0f766e;
  font-size: 15px;
  font-weight: 880;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    0 12px 26px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(18px) saturate(1.18);
  -webkit-backdrop-filter: blur(18px) saturate(1.18);
}

:global(.dark) .live2d-widget-label {
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.22), rgba(37, 99, 235, 0.12)),
    rgba(15, 23, 42, 0.7);
  color: #99f6e4;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    0 14px 30px rgba(0, 0, 0, 0.28);
}

.live2d-widget-hit:hover .live2d-widget-label {
  transform: translateY(-3px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.88),
    0 16px 32px rgba(20, 184, 166, 0.16);
}

@media (max-width: 640px) {
  .live2d-widget-hit {
    width: 88px;
    min-height: 94px;
  }

  .live2d-widget-host {
    right: -2px;
    bottom: 8px;
    width: 90px;
    height: 104px;
  }

  .live2d-widget-label {
    right: -2px;
    bottom: 2px;
    min-width: 42px;
    min-height: 42px;
    justify-content: center;
    padding: 0;
  }

  .live2d-widget-label > span {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
}
</style>
