<template>
  <span
    class="brand-icon"
    :class="[`brand-icon-${name}`, `brand-icon-size-${size}`]"
    :style="iconStyle"
    aria-hidden="true"
  >
    <ModelIcon
      v-if="modelName"
      :model="modelName"
      :size="dimension"
    />
    <img
      v-else-if="name === 'codex'"
      :src="codexIcon"
      alt=""
      class="brand-icon-image"
      draggable="false"
    />
    <svg
      v-else
      class="brand-icon-svg"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <template v-if="name === 'gateway'">
        <path d="M12 5.25v4.5M12 14.25v4.5M5.25 12h4.5M14.25 12h4.5" />
        <path d="M8.2 8.2l2.1 2.1M13.7 13.7l2.1 2.1M15.8 8.2l-2.1 2.1M10.3 13.7l-2.1 2.1" />
        <circle cx="12" cy="12" r="2.4" />
        <circle cx="12" cy="3.8" r="1.75" />
        <circle cx="20.2" cy="12" r="1.75" />
        <circle cx="12" cy="20.2" r="1.75" />
        <circle cx="3.8" cy="12" r="1.75" />
      </template>

      <template v-else-if="name === 'cherry-studio'">
        <rect x="5" y="6.2" width="10.8" height="10.8" rx="2.4" />
        <rect x="8.2" y="3.6" width="10.8" height="10.8" rx="2.4" />
        <path d="M8.6 17.2l-2.8 2.9M15.5 14.2l3 3.1" />
        <circle cx="13.6" cy="9" r="1.4" fill="currentColor" />
      </template>

      <template v-else-if="name === 'claude-code'">
        <rect x="3.8" y="5.8" width="16.4" height="12.4" rx="2.4" />
        <path d="M7.5 10l2 2-2 2M11.8 14h3.7" />
        <path d="M16.9 4.3l.36 1.2 1.18.36-1.18.36-.36 1.2-.36-1.2-1.18-.36 1.18-.36.36-1.2z" fill="currentColor" stroke="none" />
      </template>

      <template v-else-if="name === 'gemini-cli'">
        <path d="M12 3.6l.72 2.12a7.15 7.15 0 0 0 4.48 4.48l2.12.72-2.12.72a7.15 7.15 0 0 0-4.48 4.48L12 18.24l-.72-2.12a7.15 7.15 0 0 0-4.48-4.48l-2.12-.72 2.12-.72a7.15 7.15 0 0 0 4.48-4.48L12 3.6z" />
        <path d="M6.2 20.2h11.6M8.5 17.9l-1.6 1.2 1.6 1.1" />
      </template>

      <template v-else-if="name === 'antigravity'">
        <path d="M12 4.1l6.7 13H5.3l6.7-13z" />
        <path d="M4.2 12.2c2.1-3.4 5-5.1 8-4.8 3.3.3 5.9 2.7 7.6 6.1" />
        <path d="M20.2 7.7c-.9 6.4-4.1 10-8.2 10-4 0-7.2-3.4-8.2-9.4" />
        <circle cx="18.7" cy="7.8" r="1.35" fill="currentColor" />
      </template>

      <template v-else>
        <path d="M6 7.2h4.1v4.1H6zM13.9 7.2H18v4.1h-4.1zM6 14.7h4.1v4.1H6zM13.9 14.7H18v4.1h-4.1z" />
        <path d="M12 4.6v14.8M4.6 12h14.8" />
      </template>
    </svg>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ModelIcon from '@/components/common/ModelIcon.vue'
import codexIcon from '@/assets/icons/codex.png'

type BrandIconName =
  | 'gateway'
  | 'openai'
  | 'gpt'
  | 'claude'
  | 'gemini'
  | 'deepseek'
  | 'grok'
  | 'qwen'
  | 'cherry-studio'
  | 'codex'
  | 'claude-code'
  | 'gemini-cli'
  | 'antigravity'
  | 'more'

const props = withDefaults(defineProps<{
  name: BrandIconName
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  size: 'md'
})

const sizeMap = {
  xs: '14px',
  sm: '18px',
  md: '24px',
  lg: '30px',
  xl: '40px'
} as const

const modelMap: Partial<Record<BrandIconName, string>> = {
  openai: 'gpt-4o',
  gpt: 'gpt-4o',
  claude: 'claude-sonnet-4',
  gemini: 'gemini-pro',
  deepseek: 'deepseek-chat',
  grok: 'grok-3',
  qwen: 'qwen-max'
}

const dimension = computed(() => sizeMap[props.size])
const modelName = computed(() => modelMap[props.name] ?? '')
const iconStyle = computed(() => ({ '--brand-icon-size': dimension.value }))
</script>

<style scoped>
.brand-icon {
  display: inline-flex;
  width: var(--brand-icon-size);
  height: var(--brand-icon-size);
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  color: currentColor;
  line-height: 0;
}

.brand-icon-svg,
.brand-icon-image,
.brand-icon :deep(.model-icon) {
  display: block;
  width: 100%;
  height: 100%;
}

.brand-icon-image {
  border-radius: 22%;
  object-fit: contain;
}

.brand-icon :deep(.model-icon path[fill="#000000"]) {
  fill: currentColor;
}

.brand-icon-svg {
  stroke: currentColor;
  stroke-width: 1.65;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.brand-icon-more .brand-icon-svg path:first-child,
.brand-icon-cherry-studio .brand-icon-svg rect {
  fill: currentColor;
  fill-opacity: 0.12;
}
</style>
