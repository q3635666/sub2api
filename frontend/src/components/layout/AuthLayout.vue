<template>
  <div class="auth-shell">
    <InteractiveRouteBackground :is-dark="isDark" :subtle="authBackgroundSubtle" />

    <header class="auth-header">
      <nav class="auth-nav" aria-label="Auth navigation">
        <router-link to="/home" class="auth-brand" aria-label="121Api home">
          <span class="auth-brand-mark">
            <img :src="siteLogo || '/logo.png'" alt="" />
          </span>
          <span class="auth-brand-copy">
            <strong>{{ siteName }}</strong>
            <span>API Gateway</span>
          </span>
        </router-link>

        <div class="auth-nav-actions">
          <LocaleSwitcher />
          <a
            v-if="docUrl"
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="auth-icon-action"
            :title="t('home.viewDocs')"
          >
            <Icon name="book" size="md" />
          </a>
          <button
            class="auth-icon-action"
            type="button"
            :title="isDark ? t('home.switchToLight') : t('home.switchToDark')"
            :disabled="isThemeSwitching"
            @click="toggleTheme"
          >
            <Icon v-if="isDark" name="sun" size="md" />
            <Icon v-else name="moon" size="md" />
          </button>
          <router-link :to="isAuthenticated ? dashboardPath : '/home'" class="auth-home-pill">
            <Icon :name="isAuthenticated ? 'grid' : 'home'" size="sm" />
            <span>{{ isAuthenticated ? t('home.dashboard') : t('home.home') }}</span>
          </router-link>
        </div>
      </nav>
    </header>

    <!-- Content Container -->
    <div class="auth-content">
      <!-- Logo/Brand -->
      <div class="mb-8 text-center">
        <!-- Custom Logo or Default Logo -->
        <template v-if="settingsLoaded">
          <div
            class="auth-logo"
          >
            <img :src="siteLogo || '/logo.png'" alt="Logo" class="h-full w-full object-contain" />
          </div>
          <h1 class="text-gradient mb-2 text-3xl font-bold">
            {{ siteName }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-dark-400">
            {{ siteSubtitle }}
          </p>
        </template>
      </div>

      <!-- Card Container -->
      <div class="auth-card">
        <slot />
      </div>

      <!-- Footer Links -->
      <div class="mt-6 text-center text-sm">
        <slot name="footer" />
      </div>

      <!-- Copyright -->
      <div class="mt-8 text-center text-xs text-gray-400 dark:text-dark-500">
        &copy; {{ currentYear }} {{ siteName }}. All rights reserved.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore, useAuthStore } from '@/stores'
import { sanitizeUrl } from '@/utils/url'
import InteractiveRouteBackground from '@/components/common/InteractiveRouteBackground.vue'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import Icon from '@/components/icons/Icon.vue'
import { publicSiteConfig } from '../../../public-site.config'

const appStore = useAppStore()
const authStore = useAuthStore()
const { t } = useI18n()
const authBackgroundSubtle = publicSiteConfig.background.routeSubtle.auth
const isDark = ref(document.documentElement.classList.contains('dark'))
const isThemeSwitching = ref(false)
let themeObserver: MutationObserver | null = null
let themeSwitchTimer = 0

const siteName = computed(() => appStore.siteName || 'Sub2API')
const siteLogo = computed(() => sanitizeUrl(appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const siteSubtitle = computed(() => appStore.cachedPublicSettings?.site_subtitle || 'Subscription to API Conversion Platform')
const settingsLoaded = computed(() => appStore.publicSettingsLoaded)
const docUrl = computed(() => appStore.cachedPublicSettings?.doc_url || appStore.docUrl || '')
const isAuthenticated = computed(() => authStore.isAuthenticated)
const dashboardPath = computed(() => (authStore.isAdmin ? '/admin/dashboard' : '/dashboard'))

const currentYear = computed(() => new Date().getFullYear())

function toggleTheme() {
  if (isThemeSwitching.value) return

  window.clearTimeout(themeSwitchTimer)
  isThemeSwitching.value = true
  document.documentElement.classList.add('theme-switching')

  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')

  themeSwitchTimer = window.setTimeout(() => {
    isThemeSwitching.value = false
    document.documentElement.classList.remove('theme-switching')
  }, 720)
}

function initTheme() {
  const savedTheme = localStorage.getItem('theme')
  if (
    savedTheme === 'dark' ||
    (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
}

onMounted(() => {
  initTheme()
  appStore.fetchPublicSettings()
  authStore.checkAuth()
  themeObserver = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark')
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => {
  window.clearTimeout(themeSwitchTimer)
  document.documentElement.classList.remove('theme-switching')
  themeObserver?.disconnect()
  themeObserver = null
})
</script>

<style scoped>
.auth-shell {
  --auth-ink: #101827;
  --auth-muted: #5f6c80;
  --auth-glass-bg: rgba(255, 255, 255, 0.56);
  --auth-glass-border: rgba(255, 255, 255, 0.62);
  --auth-glass-shadow: rgba(15, 23, 42, 0.09);
  position: relative;
  display: flex;
  min-height: 100vh;
  align-items: flex-start;
  justify-content: center;
  overflow-x: hidden;
  padding: 98px 16px 42px;
  isolation: isolate;
}

:global(html.theme-switching) .auth-shell > :not(.route-background),
:global(html.theme-switching) .auth-shell > :not(.route-background) *,
:global(html.theme-switching) .auth-shell > :not(.route-background)::before,
:global(html.theme-switching) .auth-shell > :not(.route-background)::after,
:global(html.theme-switching) .auth-shell > :not(.route-background) *::before,
:global(html.theme-switching) .auth-shell > :not(.route-background) *::after {
  animation-play-state: paused !important;
  backdrop-filter: none !important;
  filter: none !important;
  transition-delay: 0s !important;
  transition-duration: 0.01ms !important;
}

.dark .auth-shell {
  --auth-ink: #f8fafc;
  --auth-muted: #a9b4c4;
  --auth-glass-bg: rgba(8, 13, 24, 0.48);
  --auth-glass-border: rgba(255, 255, 255, 0.13);
  --auth-glass-shadow: rgba(0, 0, 0, 0.28);
}

.auth-header {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 30;
  width: 100%;
  padding: 18px 24px 0;
}

.auth-nav {
  position: relative;
  display: flex;
  max-width: 1180px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin: 0 auto;
  overflow: visible;
  border: 1px solid var(--auth-glass-border);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.42)),
    var(--auth-glass-bg);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    inset 0 -1px 0 rgba(15, 23, 42, 0.04),
    0 20px 60px var(--auth-glass-shadow);
  padding: 9px 11px;
  backdrop-filter: blur(26px) saturate(1.28);
  -webkit-backdrop-filter: blur(26px) saturate(1.28);
  isolation: isolate;
}

.auth-nav::before,
.auth-nav::after {
  content: '';
  pointer-events: none;
  position: absolute;
  inset: 0;
  border-radius: inherit;
}

.auth-nav::before {
  z-index: 0;
  background:
    radial-gradient(circle at 16% 0%, rgba(255, 255, 255, 0.74), transparent 32%),
    radial-gradient(circle at 86% 12%, rgba(45, 212, 191, 0.16), transparent 34%),
    linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.2) 46%, transparent 58%);
  opacity: 0.92;
}

.auth-nav::after {
  z-index: 0;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.16),
    inset 0 12px 28px rgba(255, 255, 255, 0.18);
  opacity: 0.82;
}

.dark .auth-nav {
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.32), rgba(2, 6, 23, 0.34)),
    var(--auth-glass-bg);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    inset 0 -1px 0 rgba(0, 0, 0, 0.22),
    0 22px 64px var(--auth-glass-shadow);
}

.dark .auth-nav::before {
  background:
    radial-gradient(circle at 12% -4%, rgba(255, 255, 255, 0.14), transparent 34%),
    radial-gradient(circle at 86% 12%, rgba(45, 212, 191, 0.18), transparent 36%),
    linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.08) 46%, transparent 58%);
}

.auth-nav > * {
  position: relative;
  z-index: 1;
}

.auth-brand,
.auth-nav-actions {
  display: flex;
  align-items: center;
}

.auth-brand {
  min-width: 0;
  gap: 10px;
  border-radius: 8px;
  padding: 2px 4px 2px 2px;
  transition:
    background 0.22s ease,
    transform 0.22s ease;
}

.auth-brand:hover {
  background: rgba(255, 255, 255, 0.34);
  transform: translateY(-1px);
}

.dark .auth-brand:hover {
  background: rgba(255, 255, 255, 0.06);
}

.auth-brand-mark {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  overflow: hidden;
  border-radius: 8px;
  background: #0f172a;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 12px 24px rgba(15, 23, 42, 0.18);
}

.auth-brand-mark img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.auth-brand-copy {
  display: grid;
  gap: 1px;
  line-height: 1.1;
}

.auth-brand-copy strong {
  max-width: 180px;
  overflow: hidden;
  color: var(--auth-ink);
  font-size: 14px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.auth-brand-copy span {
  color: var(--auth-muted);
  font-size: 11px;
}

.auth-nav-actions {
  z-index: 3;
  gap: 8px;
}

.auth-nav-actions :deep(.relative) {
  z-index: 5;
}

.auth-icon-action,
.auth-home-pill {
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.auth-icon-action {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--auth-muted);
}

.auth-icon-action:disabled {
  cursor: default;
  opacity: 0.62;
}

.auth-icon-action:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.54);
  background: rgba(255, 255, 255, 0.42);
  color: var(--auth-ink);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.68),
    0 10px 22px rgba(15, 23, 42, 0.07);
}

.dark .auth-icon-action:hover {
  border-color: rgba(255, 255, 255, 0.11);
  background: rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 12px 24px rgba(0, 0, 0, 0.18);
}

.auth-home-pill {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  gap: 7px;
  border: 1px solid rgba(255, 255, 255, 0.56);
  border-radius: 999px;
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.13), rgba(37, 99, 235, 0.09)),
    rgba(255, 255, 255, 0.56);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78),
    0 12px 24px rgba(20, 184, 166, 0.09);
  color: #0f766e;
  font-size: 13px;
  font-weight: 750;
  padding: 7px 14px;
  backdrop-filter: blur(18px) saturate(1.18);
  -webkit-backdrop-filter: blur(18px) saturate(1.18);
}

.auth-home-pill:hover {
  transform: translateY(-2px);
  border-color: rgba(20, 184, 166, 0.34);
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.14), rgba(37, 99, 235, 0.1)),
    rgba(255, 255, 255, 0.74);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 16px 30px rgba(20, 184, 166, 0.14);
}

.dark .auth-home-pill {
  border-color: rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.16), rgba(37, 99, 235, 0.1)),
    rgba(15, 23, 42, 0.42);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 14px 28px rgba(0, 0, 0, 0.22);
  color: #99f6e4;
}

.auth-nav :deep(.relative > button) {
  min-height: 36px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--auth-muted);
  transition:
    transform 0.22s ease,
    border-color 0.22s ease,
    background 0.22s ease,
    color 0.22s ease,
    box-shadow 0.22s ease;
}

.auth-nav :deep(.relative > button:hover) {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.54);
  background: rgba(255, 255, 255, 0.42);
  color: var(--auth-ink);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.68),
    0 10px 22px rgba(15, 23, 42, 0.07);
}

.dark .auth-nav :deep(.relative > button:hover) {
  border-color: rgba(255, 255, 255, 0.11);
  background: rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 12px 24px rgba(0, 0, 0, 0.18);
}

.auth-nav :deep(.absolute.right-0) {
  margin-top: 8px;
  border-color: rgba(255, 255, 255, 0.62);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.58)),
    rgba(255, 255, 255, 0.56);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    0 22px 52px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(24px) saturate(1.2);
  -webkit-backdrop-filter: blur(24px) saturate(1.2);
}

.dark .auth-nav :deep(.absolute.right-0) {
  border-color: rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.52), rgba(2, 6, 23, 0.54)),
    rgba(15, 23, 42, 0.62);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 24px 54px rgba(0, 0, 0, 0.36);
}

.auth-content {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 448px;
  margin-top: clamp(6px, 2.2vh, 34px);
}

.auth-logo {
  display: inline-flex;
  width: 64px;
  height: 64px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(20, 184, 166, 0.18);
  border-radius: 16px;
  background: #0f172a;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
}

.auth-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.62);
  border-radius: 16px;
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.88), transparent 34%),
    radial-gradient(circle at 92% 8%, rgba(20, 184, 166, 0.14), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.46)),
    rgba(255, 255, 255, 0.48);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    inset 0 -1px 0 rgba(15, 23, 42, 0.04),
    0 26px 76px rgba(15, 23, 42, 0.12);
  padding: 30px 32px;
  backdrop-filter: blur(30px) saturate(1.22);
  -webkit-backdrop-filter: blur(30px) saturate(1.22);
}

.auth-card::before {
  content: '';
  pointer-events: none;
  position: absolute;
  inset: 0;
  background:
    linear-gradient(115deg, transparent 0%, rgba(255, 255, 255, 0.3) 42%, transparent 58%),
    linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.16) 1px, transparent 1px);
  background-size: 220% 100%, 42px 42px, 42px 42px;
  opacity: 0.42;
}

.auth-card > :deep(*) {
  position: relative;
  z-index: 1;
}

.dark .auth-card {
  border-color: rgba(255, 255, 255, 0.13);
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.12), transparent 34%),
    radial-gradient(circle at 92% 8%, rgba(45, 212, 191, 0.14), transparent 32%),
    linear-gradient(180deg, rgba(30, 41, 59, 0.42), rgba(2, 6, 23, 0.28)),
    rgba(8, 13, 24, 0.62);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2),
    0 26px 80px rgba(0, 0, 0, 0.36);
}

.auth-card :deep(.input) {
  min-height: 44px;
  border-color: rgba(255, 255, 255, 0.62);
  opacity: 1;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.64), rgba(255, 255, 255, 0.38)),
    rgba(255, 255, 255, 0.42);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.74),
    0 12px 26px rgba(15, 23, 42, 0.04);
  color: #101827;
  backdrop-filter: blur(18px) saturate(1.12);
  -webkit-backdrop-filter: blur(18px) saturate(1.12);
}

.auth-card :deep(.input:disabled) {
  opacity: 1;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.64), rgba(255, 255, 255, 0.38)),
    rgba(255, 255, 255, 0.42);
  color: #101827;
  -webkit-text-fill-color: #101827;
}

.auth-card :deep(.input:focus) {
  border-color: rgba(20, 184, 166, 0.46);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    0 0 0 4px rgba(20, 184, 166, 0.12),
    0 16px 30px rgba(20, 184, 166, 0.08);
}

.dark .auth-card :deep(.input) {
  border-color: rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.46), rgba(2, 6, 23, 0.28)),
    rgba(15, 23, 42, 0.42);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 12px 26px rgba(0, 0, 0, 0.18);
  color: #f8fafc;
}

.dark .auth-card :deep(.input:disabled) {
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.46), rgba(2, 6, 23, 0.28)),
    rgba(15, 23, 42, 0.42);
  color: #f8fafc;
  -webkit-text-fill-color: #f8fafc;
}

.auth-card :deep(.btn-primary) {
  min-height: 46px;
  border: 1px solid rgba(255, 255, 255, 0.62);
  border-radius: 12px;
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.22), rgba(37, 99, 235, 0.14)),
    rgba(255, 255, 255, 0.58);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    inset 0 -1px 0 rgba(15, 23, 42, 0.04),
    0 18px 36px rgba(20, 184, 166, 0.15);
  color: #0f766e;
  font-weight: 820;
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
}

.auth-card :deep(.btn-primary:disabled) {
  opacity: 0.86;
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.2), rgba(37, 99, 235, 0.14)),
    rgba(255, 255, 255, 0.54);
  color: rgba(15, 118, 110, 0.86);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.76),
    0 14px 30px rgba(20, 184, 166, 0.12);
}

.auth-card :deep(.btn-primary:hover) {
  border-color: rgba(20, 184, 166, 0.48);
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.26), rgba(37, 99, 235, 0.18)),
    rgba(255, 255, 255, 0.74);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 22px 42px rgba(20, 184, 166, 0.2);
}

.dark .auth-card :deep(.btn-primary) {
  border-color: rgba(255, 255, 255, 0.13);
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.22), rgba(37, 99, 235, 0.16)),
    rgba(15, 23, 42, 0.56);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.13),
    0 18px 38px rgba(0, 0, 0, 0.28),
    0 8px 20px rgba(20, 184, 166, 0.1);
  color: #99f6e4;
}

.dark .auth-card :deep(.btn-primary:disabled) {
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.15), rgba(37, 99, 235, 0.1)),
    rgba(15, 23, 42, 0.44);
  color: rgba(153, 246, 228, 0.72);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.09),
    0 12px 28px rgba(0, 0, 0, 0.22);
}

.auth-card :deep(.btn-secondary) {
  border-color: rgba(255, 255, 255, 0.54);
  background: rgba(255, 255, 255, 0.42);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.66),
    0 12px 26px rgba(15, 23, 42, 0.05);
  backdrop-filter: blur(18px) saturate(1.12);
  -webkit-backdrop-filter: blur(18px) saturate(1.12);
}

.dark .auth-card :deep(.btn-secondary) {
  border-color: rgba(255, 255, 255, 0.11);
  background: rgba(255, 255, 255, 0.07);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 12px 26px rgba(0, 0, 0, 0.18);
}

/* Match the public pages: translucent glass layers, no obvious stitched frames. */
.auth-shell {
  --auth-glass-bg: rgba(255, 255, 255, 0.42);
  --auth-glass-border: transparent;
  --auth-glass-shadow: rgba(15, 23, 42, 0.075);
}

.dark .auth-shell {
  --auth-glass-bg: rgba(8, 13, 24, 0.36);
  --auth-glass-border: transparent;
  --auth-glass-shadow: rgba(0, 0, 0, 0.24);
}

.auth-card,
.auth-card :deep(.input),
.auth-card :deep(.btn-primary),
.auth-card :deep(.btn-secondary),
.auth-home-pill,
.auth-icon-action:hover,
.auth-nav :deep(.relative > button:hover),
.auth-nav :deep(.absolute.right-0) {
  border: 0;
}

.auth-logo {
  border: 0;
  background: transparent;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.11);
}

.auth-card {
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.46), transparent 36%),
    radial-gradient(circle at 92% 8%, rgba(20, 184, 166, 0.09), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0.14)),
    rgba(255, 255, 255, 0.2);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    inset 0 -1px 0 rgba(15, 23, 42, 0.025),
    0 30px 82px rgba(15, 23, 42, 0.105);
  backdrop-filter: blur(34px) saturate(1.24);
  -webkit-backdrop-filter: blur(34px) saturate(1.24);
}

.auth-card::before {
  background:
    linear-gradient(115deg, transparent 0%, rgba(255, 255, 255, 0.22) 42%, transparent 58%),
    linear-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
  background-size:
    240% 100%,
    58px 58px,
    58px 58px;
  opacity: 0.3;
}

.dark .auth-card {
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.055), transparent 36%),
    radial-gradient(circle at 92% 8%, rgba(45, 212, 191, 0.09), transparent 34%),
    linear-gradient(180deg, rgba(30, 41, 59, 0.14), rgba(2, 6, 23, 0.04)),
    rgba(8, 13, 24, 0.2);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(0, 0, 0, 0.14),
    0 30px 84px rgba(0, 0, 0, 0.28);
}

.dark .auth-card::before {
  background:
    linear-gradient(115deg, transparent 0%, rgba(255, 255, 255, 0.08) 42%, transparent 58%),
    linear-gradient(rgba(255, 255, 255, 0.026) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.022) 1px, transparent 1px);
  opacity: 0.26;
}

.auth-card :deep(.input),
.auth-card :deep(.input:disabled),
.auth-card :deep(.btn-secondary) {
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.24), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.08)),
    rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.54),
    0 12px 28px rgba(15, 23, 42, 0.04);
  backdrop-filter: blur(20px) saturate(1.12);
  -webkit-backdrop-filter: blur(20px) saturate(1.12);
}

.dark .auth-card :deep(.input),
.dark .auth-card :deep(.input:disabled),
.dark .auth-card :deep(.btn-secondary) {
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.1), rgba(2, 6, 23, 0.035)),
    rgba(15, 23, 42, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.055),
    0 12px 28px rgba(0, 0, 0, 0.15);
}

.auth-card :deep(.input:focus) {
  border: 0;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.68),
    0 0 0 3px rgba(20, 184, 166, 0.11),
    0 16px 32px rgba(20, 184, 166, 0.075);
}

.auth-card :deep(.btn-primary),
.auth-card :deep(.btn-primary:disabled) {
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.34), transparent 42%),
    linear-gradient(135deg, rgba(20, 184, 166, 0.18), rgba(37, 99, 235, 0.1)),
    rgba(255, 255, 255, 0.22);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.66),
    0 18px 38px rgba(20, 184, 166, 0.13);
}

.auth-card :deep(.btn-primary:hover) {
  border: 0;
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.58), transparent 42%),
    linear-gradient(135deg, rgba(20, 184, 166, 0.24), rgba(37, 99, 235, 0.14)),
    rgba(255, 255, 255, 0.44);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.76),
    0 20px 42px rgba(20, 184, 166, 0.18);
}

.dark .auth-card :deep(.btn-primary),
.dark .auth-card :deep(.btn-primary:disabled) {
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.15), rgba(37, 99, 235, 0.09)),
    rgba(15, 23, 42, 0.18);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 18px 38px rgba(0, 0, 0, 0.22),
    0 8px 20px rgba(20, 184, 166, 0.08);
}

.dark .auth-card :deep(.input),
.dark .auth-card :deep(.input:disabled),
.dark .auth-card :deep(.btn-secondary) {
  border: 0;
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.08), rgba(2, 6, 23, 0.025)),
    rgba(15, 23, 42, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.035),
    0 12px 26px rgba(0, 0, 0, 0.1);
}

.text-gradient {
  @apply bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent;
}

@media (max-width: 640px) {
  .auth-shell {
    align-items: flex-start;
    padding: 92px 16px 24px;
  }

  .auth-header {
    padding: 12px 12px 0;
  }

  .auth-nav {
    gap: 10px;
    padding: 8px;
  }

  .auth-brand-copy {
    display: none;
  }

  .auth-nav-actions {
    gap: 4px;
  }

  .auth-icon-action {
    width: 32px;
    height: 32px;
  }

  .auth-home-pill {
    min-height: 32px;
    padding: 6px 10px;
  }

  .auth-home-pill span {
    display: none;
  }

  .auth-card {
    padding: 24px;
  }
}
</style>
