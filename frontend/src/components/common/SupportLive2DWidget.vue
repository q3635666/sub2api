<template>
  <div class="live2d-widget" :class="{ 'is-visible': visible }">
    <button
      ref="hitRef"
      class="live2d-widget-hit"
      type="button"
      :aria-label="label"
      :aria-expanded="active"
      @click="$emit('activate')"
    ></button>
    <div ref="hostRef" class="live2d-widget-host" aria-hidden="true"></div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{
  active: boolean
  label: string
  modelPath: string
  visible?: boolean
  messages?: string[]
  speechInitialDelayMs?: number
  speechIntervalMs?: number
  speechDisplayMs?: number
}>(), {
  visible: false
})

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
  if (!failed) {
    oml2d?.stageSlideOut?.().catch(() => undefined)
  }
  hostRef.value?.replaceChildren()
  oml2d = null
})
</script>

<style scoped>
.live2d-widget {
  pointer-events: none;
  position: absolute;
  right: 0;
  bottom: 0;
  width: 150px;
  min-height: 172px;
  opacity: 0;
  visibility: hidden;
  isolation: isolate;
  transition:
    opacity 0.22s ease,
    visibility 0.22s ease;
}

.live2d-widget.is-visible {
  pointer-events: auto;
  opacity: 1;
  visibility: visible;
}

.live2d-widget-hit {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
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

@media (max-width: 640px) {
  .live2d-widget {
    width: 90px;
    min-height: 104px;
  }

  .live2d-widget-hit {
    width: 100%;
    min-height: 100%;
  }

  .live2d-widget-host {
    right: -2px;
    bottom: 8px;
    width: 90px;
    height: 104px;
  }
}
</style>
