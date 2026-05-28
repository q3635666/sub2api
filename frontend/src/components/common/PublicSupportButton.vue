<template>
  <div class="support-shell" :class="{ 'is-open': isOpen }">
    <transition name="support-backdrop">
      <button
        v-if="isOpen"
        class="support-backdrop"
        type="button"
        aria-label="Close support panel"
        @click="closePanel"
      ></button>
    </transition>

    <transition name="support-panel">
      <section v-if="isOpen" class="support-panel" aria-label="Support">
        <div class="panel-sheen" aria-hidden="true"></div>
        <div class="panel-header">
          <div>
            <span>Support</span>
            <h2>需要帮助？</h2>
          </div>
          <button class="panel-close" type="button" aria-label="关闭客服面板" @click="closePanel">
            <Icon name="x" size="lg" :stroke-width="2.4" />
          </button>
        </div>

        <p class="panel-intro">
          套餐选择、订单支付、订阅添加或使用配置问题，都可以通过下面的联系方式咨询。
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

    <button class="support-trigger" type="button" :aria-expanded="isOpen" @click="togglePanel">
      <span class="trigger-glow" aria-hidden="true"></span>
      <Icon name="chat" size="lg" :stroke-width="2.2" />
      <span>客服</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores'
import Icon from '@/components/icons/Icon.vue'

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
const isOpen = ref(false)

const supportItems = computed<SupportItem[]>(() => {
  const raw = appStore.contactInfo || appStore.cachedPublicSettings?.contact_info || ''
  const items: SupportItem[] = []

  const telegramUrl = raw.match(/https?:\/\/t\.me\/[A-Za-z0-9_/?=&.-]+/i)?.[0]
  const telegramHandle = telegramUrl?.replace(/^https?:\/\/t\.me\//i, '').replace(/\/$/, '')
  if (telegramUrl && telegramHandle) {
    items.push({
      key: 'telegram',
      label: 'Telegram 客服',
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
      label: 'QQ 客服',
      value: qq,
      href: `https://wpa.qq.com/msgrd?v=3&uin=${qq}&site=qq&menu=yes`,
      icon: 'chat',
      tone: 'tone-qq'
    })
  }

  if (appStore.docUrl) {
    items.push({
      key: 'docs',
      label: '使用文档',
      value: '查看接入和配置说明',
      href: appStore.docUrl,
      icon: 'book',
      tone: 'tone-docs'
    })
  }

  if (items.length === 0) {
    items.push({
      key: 'contact',
      label: '客服联系方式',
      value: raw || '请在后台配置客服联系方式',
      icon: 'chat',
      tone: 'tone-qq'
    })
  }

  return items.slice(0, 4)
})

function togglePanel() {
  isOpen.value = !isOpen.value
}

function closePanel() {
  isOpen.value = false
}

function handleCardClick(item: SupportItem) {
  if (!item.href) return
  closePanel()
}
</script>

<style scoped>
.support-shell {
  position: fixed;
  right: max(22px, env(safe-area-inset-right));
  bottom: max(22px, env(safe-area-inset-bottom));
  z-index: 80;
}

.support-backdrop {
  position: fixed;
  inset: 0;
  border: 0;
  background: rgba(2, 6, 23, 0.16);
  backdrop-filter: blur(2px);
}

.support-panel {
  position: absolute;
  right: 0;
  bottom: 88px;
  width: min(420px, calc(100vw - 32px));
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.34);
  border-radius: 8px;
  background:
    radial-gradient(circle at 14% -12%, rgba(20, 184, 166, 0.26), transparent 34%),
    radial-gradient(circle at 100% 20%, rgba(59, 130, 246, 0.18), transparent 32%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.97), rgba(14, 16, 36, 0.98));
  box-shadow:
    0 30px 80px rgba(2, 6, 23, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  color: #fff;
  padding: 28px;
}

.panel-sheen {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background:
    linear-gradient(125deg, transparent 0%, rgba(255, 255, 255, 0.08) 44%, transparent 58%),
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size:
    220% 100%,
    44px 44px,
    44px 44px;
  animation: panel-shine 5.6s ease-in-out infinite;
  opacity: 0.7;
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
  color: #b8c2d4;
  font-size: 14px;
  font-weight: 800;
}

.panel-header h2 {
  margin: 8px 0 0;
  font-size: 34px;
  font-weight: 880;
  line-height: 1;
}

.panel-close {
  display: grid;
  width: 58px;
  height: 58px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.11);
  color: #fff;
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
  margin: 24px 0;
  color: #c7cedc;
  font-size: 18px;
  line-height: 1.75;
}

.support-list {
  position: relative;
  display: grid;
  gap: 12px;
}

.support-card {
  display: grid;
  grid-template-columns: 58px 1fr 20px;
  align-items: center;
  gap: 14px;
  min-height: 84px;
  border: 1px solid rgba(226, 232, 240, 0.18);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.09);
  padding: 12px;
  color: #fff;
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
  border-color: rgba(255, 255, 255, 0.34);
  background: rgba(255, 255, 255, 0.14);
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.2);
}

.support-card:hover::after {
  opacity: 1;
}

.support-icon {
  display: grid;
  width: 58px;
  height: 58px;
  place-items: center;
  border-radius: 8px;
  color: #fff;
}

.support-icon svg {
  width: 28px;
  height: 28px;
}

.tone-telegram {
  background: linear-gradient(135deg, #38bdf8, #0284c7);
  box-shadow: 0 14px 30px rgba(14, 165, 233, 0.26);
}

.tone-qq {
  background: linear-gradient(135deg, #14b8a6, #2563eb);
  box-shadow: 0 14px 30px rgba(20, 184, 166, 0.24);
}

.tone-docs {
  background: linear-gradient(135deg, #8b5cf6, #4338ca);
  box-shadow: 0 14px 30px rgba(139, 92, 246, 0.24);
}

.support-copy {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.support-copy span {
  color: #c7cedc;
  font-size: 14px;
  font-weight: 780;
}

.support-copy strong {
  overflow: hidden;
  color: #fff;
  font-size: 20px;
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
  gap: 12px;
  min-width: 132px;
  min-height: 62px;
  overflow: hidden;
  border: 1px solid rgba(20, 184, 166, 0.28);
  border-radius: 999px;
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.13), rgba(37, 99, 235, 0.1)),
    rgba(255, 255, 255, 0.84);
  color: #0f766e;
  font-size: 22px;
  font-weight: 880;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.88),
    0 20px 42px rgba(20, 184, 166, 0.16);
  backdrop-filter: blur(18px);
  transition:
    transform 0.22s ease,
    border-color 0.22s ease,
    background 0.22s ease,
    box-shadow 0.22s ease;
}

.support-trigger:hover {
  transform: translateY(-4px);
  border-color: rgba(20, 184, 166, 0.42);
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.18), rgba(37, 99, 235, 0.13)),
    rgba(255, 255, 255, 0.94);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    0 24px 50px rgba(20, 184, 166, 0.2);
}

.support-trigger:active {
  transform: translateY(-1px) scale(0.99);
}

.trigger-glow {
  position: absolute;
  inset: -80% -30%;
  background: conic-gradient(from 180deg, transparent, rgba(20, 184, 166, 0.2), transparent, rgba(59, 130, 246, 0.14), transparent);
  animation: trigger-spin 7s linear infinite;
  opacity: 0.7;
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
    right: 14px;
    bottom: 14px;
  }

  .support-panel {
    bottom: 66px;
    padding: 22px;
  }

  .panel-header h2 {
    font-size: 30px;
  }

  .panel-intro {
    font-size: 16px;
  }

  .support-trigger {
    min-width: 48px;
    width: 48px;
    min-height: 48px;
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
