<template>
  <component
    :is="activeComponent"
    :is-dark="isDark"
    :subtle="subtle"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import InteractiveRouteBackgroundCanvas from './InteractiveRouteBackgroundCanvas.vue'
import InteractiveRouteBackgroundThree from './InteractiveRouteBackgroundThree.vue'

const props = withDefaults(defineProps<{
  isDark: boolean
  subtle?: boolean
}>(), {
  subtle: false
})

type BackgroundRenderer = 'three' | 'canvas'

// Dev-only switch for background experiments; no UI control is rendered.
const DEFAULT_BACKGROUND_RENDERER = 'three' as BackgroundRenderer

const activeComponent = computed(() =>
  DEFAULT_BACKGROUND_RENDERER === 'canvas' ? InteractiveRouteBackgroundCanvas : InteractiveRouteBackgroundThree
)

void props
</script>
