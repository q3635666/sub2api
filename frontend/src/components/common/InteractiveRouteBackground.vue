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
import { publicSiteConfig } from '../../../public-site.config'

const props = withDefaults(defineProps<{
  isDark: boolean
  subtle?: boolean
}>(), {
  subtle: false
})

const activeComponent = computed(() =>
  publicSiteConfig.background.renderer === 'canvas' ? InteractiveRouteBackgroundCanvas : InteractiveRouteBackgroundThree
)

void props
</script>
