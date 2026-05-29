<template>
  <div class="support-shell" :class="{ 'is-open': isOpen, 'has-mascot': mascotVisible }">
    <transition name="support-backdrop">
      <button
        v-if="isOpen"
        class="support-backdrop"
        type="button"
        :aria-label="t('support.closePanel')"
        @click="closePanel"
      ></button>
    </transition>

    <transition name="support-panel">
      <section v-if="isOpen" class="support-panel" :aria-label="t('support.panelAria')">
        <div class="panel-sheen" aria-hidden="true"></div>
        <div class="panel-header">
          <div>
            <span>{{ t('support.kicker') }}</span>
            <h2>{{ t('support.title') }}</h2>
          </div>
          <button class="panel-close" type="button" :aria-label="t('support.closePanel')" @click="closePanel">
            <Icon name="x" size="lg" :stroke-width="2.4" />
          </button>
        </div>

        <p class="panel-intro">
          {{ t('support.intro') }}
        </p>

        <div class="support-list">
          <a
            v-for="item in supportItems"
            :key="item.key"
            class="support-card"
            :href="item.href || undefined"
            :target="item.href ? '_blank' : undefined"
            :rel="item.href ? 'noopener noreferrer' : undefined"
            @click="handleCardClick(item)"
          >
            <span class="support-icon" :class="item.tone">
              <Icon v-if="item.icon === 'chat'" name="chat" size="lg" :stroke-width="2" />
              <Icon v-else-if="item.icon === 'book'" name="book" size="lg" :stroke-width="2" />
              <svg v-else-if="item.icon === 'telegram'" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M20.8 4.3 3.7 10.9c-1.2.5-1.2 1.1-.2 1.4l4.4 1.4 1.7 5.3c.2.7.4.9.9.9.4 0 .6-.2.9-.5l2.1-2.1 4.4 3.2c.8.5 1.4.3 1.6-.8l2.9-13.8c.3-1.3-.5-1.9-1.6-1.6Zm-2.5 3.1-7.2 6.5-.3 3.1-1.2-4 8.2-5.2c.4-.3.8-.6.5-.4Z"
                  fill="currentColor"
                />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M17.8 3h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.4L5.3 21H2.2l7.3-8.4L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.3 4.7H5.5l11.2 14.5Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span class="support-copy">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </span>
            <Icon v-if="item.href" class="support-arrow" name="arrowRight" size="md" />
          </a>
        </div>
      </section>
    </transition>

    <component
      :is="activeMascotComponent"
      v-if="shouldMountMascot"
      :visible="mascotVisible"
      :active="isOpen"
      :label="t('support.trigger')"
      :model-path="supportMascotConfig.live2dModelPath"
      :messages="supportMascotMessages"
      :speech-initial-delay-ms="supportMascotConfig.speechInitialDelayMs"
      :speech-interval-ms="supportMascotConfig.speechIntervalMs"
      :speech-display-ms="supportMascotConfig.speechDisplayMs"
      @activate="togglePanel"
      @ready="handleMascotReady"
      @fail="handleMascotFail"
    />

    <button v-show="!mascotVisible" class="support-trigger" type="button" :aria-expanded="isOpen" @click="togglePanel">
      <span class="trigger-glow" aria-hidden="true"></span>
      <Icon name="chat" size="lg" :stroke-width="2.2" />
      <span>{{ t('support.trigger') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores'
import Icon from '@/components/icons/Icon.vue'
import { publicSiteConfig, type ConfiguredText } from '../../../public-site.config'

type SupportIcon = 'telegram' | 'x' | 'chat' | 'book'

interface SupportItem {
  key: string
  label: string
  value: string
  href?: string
  icon: SupportIcon
  tone: string
}

const appStore = useAppStore()
const { t } = useI18n()
const isOpen = ref(false)
const mascotReady = ref(false)
const mascotFailed = ref(false)
const mascotMountAllowed = ref(false)
const supportMascotConfig = publicSiteConfig.supportMascot

const SupportLive2DMascot = defineAsyncComponent({
  loader: () => import('./SupportLive2DMascot.vue'),
  delay: supportMascotConfig.loadDelayMs,
  timeout: supportMascotConfig.timeoutMs,
  onError(_error, _retry, fail) {
    mascotFailed.value = true
    fail()
  }
})

const SupportLive2DWidget = defineAsyncComponent({
  loader: () => import('./SupportLive2DWidget.vue'),
  delay: supportMascotConfig.loadDelayMs,
  timeout: supportMascotConfig.timeoutMs,
  onError(_error, _retry, fail) {
    mascotFailed.value = true
    fail()
  }
})

const mascotEnabled = computed(() =>
  supportMascotConfig.renderer === 'builtin' ||
  (supportMascotConfig.renderer === 'live2d' && Boolean(supportMascotConfig.live2dModelPath))
)
const shouldMountMascot = computed(() => mascotMountAllowed.value && mascotEnabled.value && !mascotFailed.value)
const activeMascotComponent = computed(() =>
  supportMascotConfig.renderer === 'live2d' ? SupportLive2DWidget : SupportLive2DMascot
)
const mascotVisible = computed(() => mascotEnabled.value && mascotReady.value && !mascotFailed.value)
const supportMascotMessages = computed(() =>
  supportMascotConfig.speechMessages.map((message) => resolveConfiguredText(message)).filter(Boolean)
)

let mascotTimeout = 0
let mascotMountTimer = 0
let mascotIdleHandle: number | null = null

function resolveConfiguredText(source: ConfiguredText) {
  if ('i18nKey' in source && source.i18nKey) {
    return t(source.i18nKey)
  }
  return source.text ?? ''
}

const supportItems = computed<SupportItem[]>(() => {
  const raw = appStore.contactInfo || appStore.cachedPublicSettings?.contact_info || ''
  const items: SupportItem[] = []

  const telegramUrl = raw.match(/https?:\/\/t\.me\/[A-Za-z0-9_/?=&.-]+/i)?.[0]
  const telegramHandle = telegramUrl?.replace(/^https?:\/\/t\.me\//i, '').replace(/\/$/, '')
  if (telegramUrl && telegramHandle) {
    items.push({
      key: 'telegram',
      label: t('support.items.telegram'),
      value: `@${telegramHandle.split(/[/?#]/)[0]}`,
      href: telegramUrl,
      icon: 'telegram',
      tone: 'tone-telegram'
    })
  }

  const qq = raw.match(/(?:QQ|qq|Qq)[：:\s]*([0-9]{5,})/)?.[1]
  if (qq) {
    items.push({
      key: 'qq',
      label: t('support.items.qq'),
      value: qq,
      href: `https://wpa.qq.com/msgrd?v=3&uin=${qq}&site=qq&menu=yes`,
      icon: 'chat',
      tone: 'tone-qq'
    })
  }

  if (appStore.docUrl) {
    items.push({
      key: 'docs',
      label: t('support.items.docs'),
      value: t('support.items.docsValue'),
      href: appStore.docUrl,
      icon: 'book',
      tone: 'tone-docs'
    })
  }

  if (items.length === 0) {
    items.push({
      key: 'contact',
      label: t('support.items.contact'),
      value: raw || t('support.items.emptyValue'),
      icon: 'chat',
      tone: 'tone-qq'
    })
  }

  return items.slice(0, 4)
})

function togglePanel() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    allowMascotMount()
  }
}

function closePanel() {
  isOpen.value = false
}

function handleCardClick(item: SupportItem) {
  if (!item.href) return
  closePanel()
}

function handleMascotReady() {
  mascotReady.value = true
}

function handleMascotFail() {
  mascotFailed.value = true
}

function startMascotTimeout() {
  window.clearTimeout(mascotTimeout)
  mascotTimeout = window.setTimeout(() => {
    if (!mascotReady.value) {
      mascotFailed.value = true
    }
  }, supportMascotConfig.timeoutMs + 600)
}

function allowMascotMount() {
  if (!mascotEnabled.value || mascotMountAllowed.value) return
  mascotMountAllowed.value = true
  startMascotTimeout()
}

function scheduleMascotMount() {
  if (!mascotEnabled.value) return

  mascotMountTimer = window.setTimeout(() => {
    if ('requestIdleCallback' in window) {
      mascotIdleHandle = window.requestIdleCallback(
        () => {
          mascotIdleHandle = null
          allowMascotMount()
        },
        { timeout: supportMascotConfig.idleTimeoutMs }
      )
      return
    }

    allowMascotMount()
  }, Math.max(0, supportMascotConfig.mountDelayMs))
}

onMounted(() => {
  scheduleMascotMount()
})

onBeforeUnmount(() => {
  window.clearTimeout(mascotMountTimer)
  window.clearTimeout(mascotTimeout)
  if (mascotIdleHandle !== null && 'cancelIdleCallback' in window) {
    window.cancelIdleCallback(mascotIdleHandle)
  }
})
</script>

<style scoped>
.support-shell {
  position: fixed;
  right: max(20px, env(safe-area-inset-right));
  bottom: max(20px, env(safe-area-inset-bottom));
  z-index: 80;
}

.support-backdrop {
  position: fixed;
  inset: 0;
  border: 0;
  background: rgba(2, 6, 23, 0.1);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.support-panel {
  position: absolute;
  right: 0;
  bottom: 72px;
  width: min(390px, calc(100vw - 32px));
  overflow: hidden;
  border: 0;
  border-radius: 8px;
  background:
    radial-gradient(circle at 14% -10%, rgba(20, 184, 166, 0.18), transparent 38%),
    radial-gradient(circle at 100% 12%, rgba(59, 130, 246, 0.12), transparent 36%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.58), rgba(8, 13, 24, 0.48));
  box-shadow:
    0 28px 74px rgba(2, 6, 23, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 -1px 0 rgba(0, 0, 0, 0.12);
  color: #fff;
  padding: 24px;
  backdrop-filter: blur(30px) saturate(1.22);
  -webkit-backdrop-filter: blur(30px) saturate(1.22);
  isolation: isolate;
}

.support-shell.has-mascot .support-panel {
  bottom: 162px;
}

.panel-sheen {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(125deg, transparent 0%, rgba(255, 255, 255, 0.12) 44%, transparent 58%),
    radial-gradient(circle at 24% 0%, rgba(255, 255, 255, 0.1), transparent 36%),
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size:
    220% 100%,
    100% 100%,
    44px 44px,
    44px 44px;
  animation: panel-shine 5.6s ease-in-out infinite;
  opacity: 0.78;
}

.panel-header,
.support-card,
.support-trigger {
  position: relative;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.panel-header span {
  color: #99f6e4;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.panel-header h2 {
  margin: 7px 0 0;
  font-size: 30px;
  font-weight: 880;
  line-height: 1;
}

.panel-close {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background:
    radial-gradient(circle at 30% 18%, rgba(255, 255, 255, 0.12), transparent 48%),
    rgba(255, 255, 255, 0.055);
  color: #fff;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  transition:
    transform 0.2s ease,
    background 0.2s ease;
}

.panel-close:hover {
  transform: rotate(4deg) scale(1.03);
  background: rgba(255, 255, 255, 0.18);
}

.panel-intro {
  position: relative;
  margin: 20px 0;
  color: #c7cedc;
  font-size: 15px;
  line-height: 1.72;
}

.support-list {
  position: relative;
  display: grid;
  gap: 12px;
}

.support-card {
  display: grid;
  grid-template-columns: 48px 1fr 20px;
  align-items: center;
  gap: 12px;
  min-height: 74px;
  border: 0;
  border-radius: 8px;
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.16), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.095), rgba(255, 255, 255, 0.04)),
    rgba(255, 255, 255, 0.045);
  padding: 12px;
  color: #fff;
  backdrop-filter: blur(16px) saturate(1.12);
  -webkit-backdrop-filter: blur(16px) saturate(1.12);
  transition:
    transform 0.22s ease,
    border-color 0.22s ease,
    background 0.22s ease,
    box-shadow 0.22s ease;
}

.support-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at 20% 10%, rgba(255, 255, 255, 0.16), transparent 42%);
  opacity: 0;
  transition: opacity 0.22s ease;
}

.support-card:hover {
  transform: translateY(-3px);
  border: 0;
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.2), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0.06)),
    rgba(255, 255, 255, 0.06);
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.2);
}

.support-card:hover::after {
  opacity: 1;
}

.support-icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 8px;
  color: #fff;
}

.support-icon svg {
  width: 23px;
  height: 23px;
}

.tone-telegram {
  border: 0;
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.22), transparent 46%),
    linear-gradient(135deg, rgba(56, 189, 248, 0.46), rgba(2, 132, 199, 0.26));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 12px 26px rgba(14, 165, 233, 0.14);
}

.tone-qq {
  border: 0;
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.22), transparent 46%),
    linear-gradient(135deg, rgba(20, 184, 166, 0.46), rgba(37, 99, 235, 0.26));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 12px 26px rgba(20, 184, 166, 0.13);
}

.tone-docs {
  border: 0;
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.2), transparent 46%),
    linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(20, 184, 166, 0.22));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.11),
    0 12px 26px rgba(59, 130, 246, 0.13);
}

.support-copy {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.support-copy span {
  color: #c7cedc;
  font-size: 13px;
  font-weight: 780;
}

.support-copy strong {
  overflow: hidden;
  color: #fff;
  font-size: 17px;
  font-weight: 880;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.support-arrow {
  color: #cbd5e1;
  opacity: 0.62;
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.support-card:hover .support-arrow {
  transform: translateX(3px);
  opacity: 1;
}

.support-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 92px;
  min-height: 48px;
  overflow: hidden;
  border: 0;
  border-radius: 999px;
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.16), rgba(37, 99, 235, 0.08)),
    rgba(255, 255, 255, 0.54);
  color: #0f766e;
  font-size: 16px;
  font-weight: 850;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    inset 0 -1px 0 rgba(15, 23, 42, 0.04),
    0 18px 40px rgba(20, 184, 166, 0.12),
    0 8px 20px rgba(15, 23, 42, 0.07);
  backdrop-filter: blur(24px) saturate(1.24);
  -webkit-backdrop-filter: blur(24px) saturate(1.24);
  transition:
    transform 0.22s ease,
    border-color 0.22s ease,
    background 0.22s ease,
    box-shadow 0.22s ease;
}

.support-trigger:hover {
  transform: translateY(-3px);
  border: 0;
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.18), rgba(37, 99, 235, 0.1)),
    rgba(255, 255, 255, 0.68);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    0 20px 44px rgba(20, 184, 166, 0.18),
    0 10px 24px rgba(15, 23, 42, 0.08);
}

.dark .support-trigger {
  border: 0;
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.18), rgba(37, 99, 235, 0.1)),
    rgba(15, 23, 42, 0.56);
  color: #99f6e4;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2),
    0 18px 42px rgba(0, 0, 0, 0.32),
    0 8px 20px rgba(20, 184, 166, 0.1);
}

.dark .support-trigger:hover {
  border: 0;
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.22), rgba(37, 99, 235, 0.14)),
    rgba(15, 23, 42, 0.68);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    0 22px 46px rgba(0, 0, 0, 0.36),
    0 10px 24px rgba(20, 184, 166, 0.13);
}

.support-trigger:active {
  transform: translateY(-1px) scale(0.99);
}

.trigger-glow {
  position: absolute;
  inset: -110% -60%;
  background: conic-gradient(from 180deg, transparent, rgba(20, 184, 166, 0.16), transparent, rgba(59, 130, 246, 0.1), transparent);
  animation: trigger-spin 7s linear infinite;
  opacity: 0.55;
}

.support-trigger > svg,
.support-trigger > span:not(.trigger-glow) {
  position: relative;
}

.support-panel-enter-active,
.support-panel-leave-active,
.support-backdrop-enter-active,
.support-backdrop-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.22s ease;
}

.support-panel-enter-from,
.support-panel-leave-to {
  opacity: 0;
  filter: blur(8px);
  transform: translateY(16px) scale(0.96);
}

.support-backdrop-enter-from,
.support-backdrop-leave-to {
  opacity: 0;
}

@keyframes trigger-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes panel-shine {
  0%,
  55% {
    background-position:
      180% 0,
      0 0,
      0 0;
  }
  78%,
  100% {
    background-position:
      -70% 0,
      0 0,
      0 0;
  }
}

@media (max-width: 640px) {
  .support-shell {
    right: max(8px, env(safe-area-inset-right));
    bottom: max(10px, env(safe-area-inset-bottom));
    width: 92px;
    height: 108px;
  }

  .support-panel {
    bottom: 60px;
    right: 0;
    width: min(390px, calc(100vw - 20px));
    padding: 22px;
  }

  .support-shell.has-mascot .support-panel {
    bottom: 118px;
  }

  .panel-header h2 {
    font-size: 30px;
  }

  .panel-intro {
    font-size: 16px;
  }

  .support-trigger {
    min-width: 46px;
    width: 46px;
    min-height: 46px;
    gap: 8px;
    font-size: 18px;
  }

  .support-trigger > span:not(.trigger-glow) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .support-trigger svg {
    width: 20px;
    height: 20px;
  }

  .support-copy strong {
    font-size: 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
