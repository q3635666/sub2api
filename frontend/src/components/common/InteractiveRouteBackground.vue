<template>
  <component
    :is="activeComponent"
    :is-dark="isDark"
    :subtle="subtle"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { publicSiteConfig } from '../../../public-site.config'

const props = withDefaults(defineProps<{
  isDark: boolean
  subtle?: boolean
}>(), {
  subtle: false
})

const activeComponent =
  publicSiteConfig.background.renderer === 'canvas'
    ? defineAsyncComponent(() => import('./InteractiveRouteBackgroundCanvas.vue'))
    : defineAsyncComponent(() => import('./InteractiveRouteBackgroundThree.vue'))

void props
</script>
