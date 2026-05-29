<template>
  <!-- Custom Home Content: Full Page Mode -->
  <div v-if="homeContent" class="min-h-screen">
    <iframe
      v-if="isHomeContentUrl"
      :src="homeContent.trim()"
      class="h-screen w-full border-0"
      allowfullscreen
    ></iframe>
    <!-- HTML mode - SECURITY: homeContent is admin-only setting, XSS risk is acceptable -->
    <div v-else v-html="homeContent"></div>
  </div>

  <div
    v-else
    ref="homeRoot"
    class="home-page"
    :class="{
      'is-pointer-active': pointerActive,
      'is-theme-switching': isThemeSwitching
    }"
    :style="pointerStyle"
    @pointermove="handlePointerMove"
    @pointerleave="resetPointer"
  >
    <InteractiveRouteBackground :is-dark="isDark" />

    <header class="home-header">
      <nav class="home-nav" :aria-label="t('home.navigationLabel')">
        <router-link to="/home" class="brand-lockup" aria-label="121Api home">
          <span class="brand-mark">
            <img :src="siteLogo || '/logo.png'" alt="" />
          </span>
          <span class="brand-copy">
            <strong>{{ siteName }}</strong>
            <span>{{ t('home.brandTagline') }}</span>
          </span>
        </router-link>

        <div class="nav-actions">
          <LocaleSwitcher />
          <a
            v-if="docUrl"
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="icon-action"
            :title="t('home.viewDocs')"
          >
            <Icon name="book" size="md" />
          </a>
          <button
            class="icon-action"
            type="button"
            :title="isDark ? t('home.switchToLight') : t('home.switchToDark')"
            :disabled="isThemeSwitching"
            @click="toggleTheme"
          >
            <Icon v-if="isDark" name="sun" size="md" />
            <Icon v-else name="moon" size="md" />
          </button>
          <router-link :to="isAuthenticated ? dashboardPath : '/login'" class="login-pill">
            <span v-if="isAuthenticated" class="login-avatar">{{ userInitial }}</span>
            <span v-else class="login-pill-icon">
              <Icon name="login" size="sm" :stroke-width="1.8" />
            </span>
            <span>{{ isAuthenticated ? t('home.dashboard') : t('home.login') }}</span>
          </router-link>
        </div>
      </nav>
    </header>

    <main class="home-main">
      <section class="hero-section" aria-labelledby="home-hero-title">
        <div class="hero-copy">
          <div class="hero-kicker">
            <Icon name="sparkles" size="sm" />
            <span>{{ t('home.heroKicker') }}</span>
          </div>

          <h1 id="home-hero-title" class="hero-title">
            <span
              v-for="(word, index) in heroWords"
              :key="`${word}-${index}`"
              class="hero-word"
              :style="{ animationDelay: `${index * 0.08}s` }"
            >
              {{ word }}
            </span>
          </h1>

          <p class="hero-subtitle">
            {{ heroSubtitle }}
          </p>

          <div class="hero-actions">
            <router-link :to="isAuthenticated ? dashboardPath : '/login'" class="primary-cta">
              <span>{{ isAuthenticated ? t('home.goToDashboard') : t('home.getStarted') }}</span>
              <Icon name="arrowRight" size="md" />
            </router-link>
            <a href="#capabilities" class="secondary-cta">
              <Icon name="terminal" size="md" />
              <span>{{ t('home.viewCapabilities') }}</span>
            </a>
          </div>

          <dl class="hero-metrics" :aria-label="t('home.metricsAria')">
            <div v-for="metric in heroMetrics" :key="metric.label">
              <dt>{{ metric.label }}</dt>
              <dd>{{ metric.value }}</dd>
            </div>
          </dl>
        </div>

        <div class="hero-visual" aria-hidden="true">
          <div class="route-cockpit spotlight-card">
            <div class="cockpit-topbar">
              <span></span>
              <span></span>
              <span></span>
              <p>{{ t('home.cockpit.title') }}</p>
            </div>

            <div class="cockpit-grid">
              <div class="route-map">
                <div class="map-head">
                  <span>{{ t('home.cockpit.trafficFlow') }}</span>
                  <strong>{{ t('home.cockpit.healthy') }}</strong>
                </div>
                <div
                  class="map-layers"
                  :class="{ 'is-matrix-active': matrixActive }"
                  @pointermove="handleMatrixMove"
                  @pointerleave="resetMatrixFocus"
                >
                  <div class="matrix-hover-grid" aria-hidden="true">
                    <span
                      v-for="cell in matrixCells"
                      :key="cell.id"
                      class="matrix-cell"
                      :style="{
                        '--cell-intensity': cell.intensity.toFixed(3),
                        '--cell-delay': `${cell.delay}ms`
                      }"
                    ></span>
                  </div>
                  <span class="hub hub-core brand-core-node">
                    <img
                      :src="siteLogo || '/logo.png'"
                      alt=""
                      class="project-logo-icon brand-core-logo"
                    />
                  </span>
                  <span class="hub hub-a">
                    <BrandIcon name="claude" size="md" />
                  </span>
                  <span class="hub hub-b">
                    <BrandIcon name="gpt" size="md" />
                  </span>
                  <span class="hub hub-c">
                    <BrandIcon name="gemini" size="md" />
                  </span>
                  <span class="hub hub-d">
                    <BrandIcon name="antigravity" size="md" />
                  </span>
                  <i class="beam beam-1"></i>
                  <i class="beam beam-2"></i>
                  <i class="beam beam-3"></i>
                  <i class="beam beam-4"></i>
                </div>
              </div>

              <div class="route-status">
                <div v-for="row in routeRows" :key="row.name" class="status-row">
                  <span class="status-dot" :style="{ '--tone': row.color }"></span>
                  <div>
                    <p>{{ row.name }}</p>
                    <strong>{{ row.value }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div class="terminal-strip hacker-terminal">
              <p
                v-for="line in terminalVisibleLines"
                :key="line.id"
                class="terminal-line"
                :class="[`terminal-line-${line.tone}`, { 'is-active': line.active }]"
              >
                <span class="terminal-prompt">{{ line.prompt }}</span>
                <code>{{ line.text }}</code>
                <i v-if="line.active" class="terminal-cursor"></i>
              </p>
            </div>
          </div>

          <div class="floating-ticket ticket-a">
            <Icon name="shield" size="sm" />
            <span>{{ t('home.tags.stickySession') }}</span>
          </div>
          <div class="floating-ticket ticket-b">
            <Icon name="chart" size="sm" />
            <span>{{ t('home.tags.realtimeBilling') }}</span>
          </div>
        </div>
      </section>

      <section ref="capabilitySection" id="capabilities" class="section-block capability-showcase">
        <div class="brand-echo" aria-hidden="true">
          <span class="brand-echo-word" :data-text="brandEchoText">{{ brandEchoText }}</span>
        </div>

        <div class="section-heading">
          <span>{{ t('home.showcase.capabilityKicker') }}</span>
          <h2>{{ t('home.showcase.capabilityTitle') }}</h2>
          <p>{{ t('home.showcase.capabilityDescription') }}</p>
        </div>

        <div
          ref="featureMosaic"
          class="feature-mosaic"
          :class="{ 'is-mosaic-active': mosaicActive }"
          @pointermove="handleMosaicMove"
          @pointerleave="resetMosaicFocus"
        >
          <article
            v-for="feature in featureCards"
            :key="feature.title"
            class="feature-card aurora-card"
            :class="[`feature-card-${feature.visual}`, { 'is-featured': feature.featured }]"
            :style="{ '--feature-tone': feature.color }"
          >
            <div class="feature-card-head">
              <div class="feature-icon">
                <Icon :name="feature.icon" size="lg" />
              </div>
              <span>{{ feature.eyebrow }}</span>
            </div>

            <div class="feature-visual" :class="`feature-visual-${feature.visual}`" aria-hidden="true">
              <template v-if="feature.visual === 'models'">
                <div class="model-aggregation">
                  <span
                    v-for="(model, index) in modelNodes"
                    :key="model.name"
                    class="model-node"
                    :style="{ '--model-color': model.color, '--node-index': `${index}` }"
                  >
                    <BrandIcon :name="model.icon" size="lg" />
                  </span>
                  <div class="model-core brand-core-node">
                    <img
                      :src="siteLogo || '/logo.png'"
                      alt=""
                      class="project-logo-icon brand-core-logo"
                    />
                  </div>
                  <i v-for="spark in 9" :key="spark" class="model-spark"></i>
                </div>
              </template>

              <template v-else-if="feature.visual === 'api'">
                <div class="mini-code-card">
                  <span>POST /v1/chat/completions</span>
                  <p>{ model: "claude-sonnet-4", stream: true }</p>
                  <strong>200 routed</strong>
                </div>
              </template>

              <template v-else-if="feature.visual === 'billing'">
                <div class="billing-visual">
                  <span v-for="bar in billingBars" :key="bar" :style="{ height: `${bar}%` }"></span>
                </div>
              </template>

              <template v-else-if="feature.visual === 'routing'">
                <div class="route-visual">
                  <span v-for="lane in routeLanes" :key="lane" :class="`lane-${lane}`"></span>
                  <strong class="route-core brand-core-node">
                    <img
                      :src="siteLogo || '/logo.png'"
                      alt=""
                      class="project-logo-icon brand-core-logo"
                    />
                  </strong>
                </div>
              </template>

              <template v-else-if="feature.visual === 'guard'">
                <div class="guard-visual">
                  <span
                    v-for="badge in guardBadges"
                    :key="badge.name"
                    :style="{ '--guard-color': badge.color }"
                  >
                    <Icon :name="badge.icon" size="md" />
                  </span>
                </div>
              </template>

              <template v-else>
                <div class="global-visual">
                  <span
                    v-for="point in globalPoints"
                    :key="point.id"
                    :style="{ left: point.left, top: point.top, animationDelay: point.delay }"
                  ></span>
                </div>
              </template>
            </div>

            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </article>
        </div>
      </section>

      <section class="section-block flow-section">
        <div class="flow-panel aurora-card">
          <div class="flow-copy">
            <span>{{ t('home.showcase.flowKicker') }}</span>
            <h2>{{ t('home.showcase.flowTitle') }}</h2>
            <p>{{ t('home.showcase.flowDescription') }}</p>
          </div>

          <div class="flow-steps">
            <article v-for="(step, index) in flowSteps" :key="step.title" class="flow-step">
              <span class="step-index">0{{ index + 1 }}</span>
              <Icon :name="step.icon" size="md" />
              <div>
                <h3>{{ step.title }}</h3>
                <p>{{ step.description }}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="models" class="section-block model-section">
        <div class="section-heading compact">
          <span>{{ t('home.showcase.ecosystemKicker') }}</span>
          <h2>{{ t('home.showcase.ecosystemTitle') }}</h2>
          <p>{{ t('home.showcase.ecosystemDescription') }}</p>
        </div>

        <div class="partner-carousel" :aria-label="t('home.showcase.ecosystemAria')">
          <div class="partner-fade partner-fade-left"></div>
          <div class="partner-fade partner-fade-right"></div>
          <div class="partner-track">
            <article
              v-for="(partner, index) in partnerLoop"
              :key="`${partner.name}-${index}`"
              class="partner-item aurora-card"
              :class="{ 'is-image-icon': partner.icon === 'codex' }"
              :style="{ '--partner-color': partner.color }"
            >
              <span class="partner-logo">
                <img
                  v-if="partner.icon === 'gateway'"
                  :src="siteLogo || '/logo.png'"
                  alt=""
                  class="project-logo-icon"
                />
                <BrandIcon v-else :name="partner.icon" size="lg" />
              </span>
              <strong>{{ partner.name }}</strong>
              <em>{{ partner.type }}</em>
            </article>
          </div>
        </div>

        <div class="model-strip">
          <span
            v-for="provider in modelHighlights"
            :key="provider.name"
            :style="{ '--provider-color': provider.color }"
          >
            <span class="provider-mark">
              <BrandIcon :name="provider.icon" size="sm" />
            </span>
            <span class="provider-copy">
              <strong>{{ provider.name }}</strong>
              <em>{{ provider.status }}</em>
            </span>
          </span>
        </div>
      </section>

      <section id="trust" class="section-block trust-section">
        <div class="trust-card aurora-card">
          <div>
            <span class="trust-kicker">{{ t('home.showcase.trustKicker') }}</span>
            <h2>{{ t('home.showcase.trustTitle') }}</h2>
            <p>{{ t('home.showcase.trustDescription') }}</p>
          </div>
          <router-link :to="isAuthenticated ? dashboardPath : '/login'" class="trust-link">
            <span>{{ isAuthenticated ? t('home.goToDashboard') : t('home.getStarted') }}</span>
            <Icon name="arrowRight" size="md" />
          </router-link>
        </div>
      </section>
    </main>

    <footer class="home-footer">
      <div class="footer-inner">
        <p>&copy; {{ currentYear }} {{ siteName }}. {{ t('home.footer.allRightsReserved') }}</p>
        <div class="footer-links">
          <router-link to="/legal/terms">{{ t('home.footer.terms') }}</router-link>
          <router-link to="/legal/privacy-policy">{{ t('home.footer.privacy') }}</router-link>
          <a
            v-if="docUrl"
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ t('home.docs') }}
          </a>
          <a :href="githubUrl" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore, useAppStore } from '@/stores'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import InteractiveRouteBackground from '@/components/common/InteractiveRouteBackground.vue'
import Icon from '@/components/icons/Icon.vue'
import BrandIcon from '@/components/icons/BrandIcon.vue'
import {
  publicSiteConfig,
  type BrandIconName,
  type ConfiguredText,
  type HomeIconName,
  type TerminalSourceLine
} from '../../public-site.config'

const { t } = useI18n()
const homeConfig = publicSiteConfig.home

const authStore = useAuthStore()
const appStore = useAppStore()
const homeRoot = ref<HTMLElement | null>(null)
const featureMosaic = ref<HTMLElement | null>(null)
const capabilitySection = ref<HTMLElement | null>(null)

const pointerActive = ref(false)
const mosaicActive = ref(false)
const isDark = ref(document.documentElement.classList.contains('dark'))
const isThemeSwitching = ref(false)
const matrixFocus = ref<{ col: number; row: number } | null>(null)
const mosaicPointer = {
  active: false,
  initialized: false,
  targetX: 0,
  targetY: 0,
  smoothX: 0,
  smoothY: 0
}
let mosaicFrame = 0
let themeSwitchTimer = 0
let terminalTimer = 0
let brandEchoFrame = 0
let terminalLineIndex = 0
let terminalCharIndex = 0
let terminalLineId = 0
let terminalNeedsNewLine = true

type TerminalVisibleLine = TerminalSourceLine & {
  id: number
  active: boolean
}

const terminalSourceLines = homeConfig.terminalSourceLines

const terminalVisibleLines = ref<TerminalVisibleLine[]>([])

const siteName = computed(() => appStore.cachedPublicSettings?.site_name || appStore.siteName || 'Sub2API')
const siteLogo = computed(() => appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || '')
const siteSubtitle = computed(() => appStore.cachedPublicSettings?.site_subtitle || 'AI API Gateway Platform')
const docUrl = computed(() => appStore.cachedPublicSettings?.doc_url || appStore.docUrl || '')
const homeContent = computed(() => appStore.cachedPublicSettings?.home_content || '')
const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAdmin = computed(() => authStore.isAdmin)
const dashboardPath = computed(() => (isAdmin.value ? '/admin/dashboard' : '/dashboard'))
const currentYear = computed(() => new Date().getFullYear())
const githubUrl = homeConfig.githubUrl

const heroWords = computed(() => {
  const title = siteName.value.trim() || t('home.defaultSiteName')
  return title.split(/\s+/).filter(Boolean)
})

const heroSubtitle = computed(() => {
  const subtitle = siteSubtitle.value.trim()
  if (subtitle && subtitle !== 'AI API Gateway Platform' && subtitle !== 'Subscription to API Conversion Platform') {
    return subtitle
  }
  return t('home.heroDescription')
})

const userInitial = computed(() => {
  const user = authStore.user
  if (!user || !user.email) return ''
  return user.email.charAt(0).toUpperCase()
})

const isHomeContentUrl = computed(() => {
  const content = homeContent.value.trim()
  return content.startsWith('http://') || content.startsWith('https://')
})

const pointerStyle = {
  ...homeConfig.pointerStyle
}

const matrixCols = homeConfig.matrix.cols
const matrixRows = homeConfig.matrix.rows
const matrixActive = computed(() => matrixFocus.value !== null)
const matrixCells = computed(() =>
  Array.from({ length: matrixCols * matrixRows }, (_, index) => {
    const col = index % matrixCols
    const row = Math.floor(index / matrixCols)
    const distance = matrixFocus.value
      ? Math.hypot(col - matrixFocus.value.col, row - matrixFocus.value.row)
      : Number.POSITIVE_INFINITY

    return {
      id: index,
      intensity: Math.max(0, 1 - distance / homeConfig.matrix.activeRadius),
      delay: (col * homeConfig.matrix.colDelayMs + row * homeConfig.matrix.rowDelayMs) % homeConfig.matrix.maxDelayMs
    }
  })
)

const brandEchoText = homeConfig.brandEchoText

function resolveConfiguredText(source: ConfiguredText) {
  if ('i18nKey' in source && source.i18nKey) {
    return t(source.i18nKey)
  }
  return source.text ?? ''
}

const heroMetrics = computed(() =>
  homeConfig.heroMetrics.map((item) => ({
    label: t(item.labelKey),
    value: t(item.valueKey)
  }))
)

const routeRows = computed(() =>
  homeConfig.routeRows.map((item) => ({
    name: t(item.nameKey),
    value: item.valueKey ? t(item.valueKey) : item.value || '',
    color: item.color
  }))
)

type FeatureCard = {
  title: string
  description: string
  eyebrow: string
  icon: HomeIconName
  visual: 'models' | 'api' | 'billing' | 'routing' | 'guard' | 'global'
  color: string
  featured?: boolean
}

const featureCards = computed<FeatureCard[]>(() =>
  homeConfig.featureCards.map((item) => ({
    title: t(item.titleKey),
    description: t(item.descriptionKey),
    eyebrow: t(item.eyebrowKey),
    icon: item.icon,
    visual: item.visual,
    color: item.color,
    featured: item.featured
  }))
)

const modelNodes = homeConfig.modelNodes

const billingBars = homeConfig.billingBars
const routeLanes = homeConfig.routeLanes
const guardBadges = computed<Array<{ name: string; icon: HomeIconName; color: string }>>(() =>
  homeConfig.guardBadges.map((item) => ({
    name: t(item.nameKey),
    icon: item.icon,
    color: item.color
  }))
)
const globalPoints = homeConfig.globalPoints

type FlowStep = {
  title: string
  description: string
  icon: HomeIconName
}

const flowSteps = computed<FlowStep[]>(() =>
  homeConfig.flowSteps.map((item) => ({
    title: t(item.titleKey),
    description: t(item.descriptionKey),
    icon: item.icon
  }))
)

const partnerItems = homeConfig.partnerItems

const partnerLoop = computed(() => [...partnerItems, ...partnerItems])

const modelHighlights = computed<Array<{ name: string; icon: BrandIconName; status: string; color: string }>>(() =>
  homeConfig.modelHighlights.map((item) => ({
    name: resolveConfiguredText(item.name),
    icon: item.icon,
    status: t(item.statusKey),
    color: item.color
  }))
)

function handlePointerMove(event: PointerEvent) {
  const rect = homeRoot.value?.getBoundingClientRect()
  if (!rect) return
  const relativeX = Math.min(rect.width, Math.max(0, event.clientX - rect.left))
  const relativeY = Math.min(rect.height, Math.max(0, event.clientY - rect.top))
  const xPercent = (relativeX / rect.width) * 100
  const yPercent = (relativeY / rect.height) * 100

  pointerActive.value = true
  homeRoot.value?.style.setProperty('--pointer-x', `${xPercent}%`)
  homeRoot.value?.style.setProperty('--pointer-y', `${yPercent}%`)

  const mosaicRect = featureMosaic.value?.getBoundingClientRect()
  if (
    mosaicActive.value &&
    mosaicRect &&
    (event.clientX < mosaicRect.left ||
      event.clientX > mosaicRect.right ||
      event.clientY < mosaicRect.top ||
      event.clientY > mosaicRect.bottom)
  ) {
    resetMosaicFocus()
  }
}

function resetPointer() {
  pointerActive.value = false
  homeRoot.value?.style.setProperty('--pointer-x', '50%')
  homeRoot.value?.style.setProperty('--pointer-y', '42%')
  resetMosaicFocus()
}

function handleMatrixMove(event: PointerEvent) {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))

  target.style.setProperty('--matrix-x', `${x * 100}%`)
  target.style.setProperty('--matrix-y', `${y * 100}%`)
  matrixFocus.value = {
    col: Math.min(matrixCols - 1, Math.max(0, Math.floor(x * matrixCols))),
    row: Math.min(matrixRows - 1, Math.max(0, Math.floor(y * matrixRows)))
  }
}

function resetMatrixFocus(event: PointerEvent) {
  const target = event.currentTarget as HTMLElement
  target.style.setProperty('--matrix-x', '50%')
  target.style.setProperty('--matrix-y', '50%')
  matrixFocus.value = null
}

function scheduleMosaicRender() {
  if (mosaicFrame) return
  mosaicFrame = window.requestAnimationFrame(renderMosaicFocus)
}

function renderMosaicFocus() {
  mosaicFrame = 0
  const target = featureMosaic.value
  if (!target || !mosaicPointer.initialized) return

  const pull = mosaicPointer.active ? 0.18 : 0.12
  mosaicPointer.smoothX += (mosaicPointer.targetX - mosaicPointer.smoothX) * pull
  mosaicPointer.smoothY += (mosaicPointer.targetY - mosaicPointer.smoothY) * pull

  updateMosaicFocus(target, mosaicPointer.smoothX, mosaicPointer.smoothY)

  const delta = Math.abs(mosaicPointer.targetX - mosaicPointer.smoothX) + Math.abs(mosaicPointer.targetY - mosaicPointer.smoothY)
  if (mosaicPointer.active && delta > 0.22) {
    scheduleMosaicRender()
  }
}

function updateMosaicFocus(target: HTMLElement, x: number, y: number) {
  const rect = target.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const clientX = rect.left + x
  const clientY = rect.top + y
  const xPercent = (x / rect.width) * 100
  const yPercent = (y / rect.height) * 100

  target.style.setProperty('--mosaic-x', `${x}px`)
  target.style.setProperty('--mosaic-y', `${y}px`)
  target.style.setProperty('--mosaic-x-percent', `${xPercent}%`)
  target.style.setProperty('--mosaic-y-percent', `${yPercent}%`)

  target.querySelectorAll<HTMLElement>('.feature-card').forEach((card, index) => {
    const cardRect = card.getBoundingClientRect()
    const localX = Math.min(cardRect.width, Math.max(0, clientX - cardRect.left))
    const localY = Math.min(cardRect.height, Math.max(0, clientY - cardRect.top))
    const dx =
      clientX < cardRect.left
        ? cardRect.left - clientX
        : clientX > cardRect.right
          ? clientX - cardRect.right
          : 0
    const dy =
      clientY < cardRect.top
        ? cardRect.top - clientY
        : clientY > cardRect.bottom
          ? clientY - cardRect.bottom
          : 0
    const distance = Math.hypot(dx, dy)
    const isInside =
      clientX >= cardRect.left &&
      clientX <= cardRect.right &&
      clientY >= cardRect.top &&
      clientY <= cardRect.bottom
    const edgeDistance = isInside
      ? Math.min(localX, cardRect.width - localX, localY, cardRect.height - localY)
      : 0
    const edgePull = isInside ? Math.max(0, 1 - edgeDistance / 130) : 1
    const baseAlpha = isInside ? 0.5 + edgePull * 0.36 : 0
    const softAlpha = isInside ? 0.18 + edgePull * 0.22 : 0
    const delay = Math.round(Math.min(260, distance * 0.58))
    const phase = -Math.round((index * 360 + (x + y) * 0.16) % 5600)

    card.style.setProperty('--card-x', `${localX}px`)
    card.style.setProperty('--card-y', `${localY}px`)
    card.style.setProperty('--beam-alpha', baseAlpha.toFixed(3))
    card.style.setProperty('--beam-soft', softAlpha.toFixed(3))
    card.style.setProperty('--beam-delay', `${delay}ms`)
    card.style.setProperty('--beam-phase', `${phase}ms`)
  })
}

function handleMosaicMove(event: PointerEvent) {
  const target = featureMosaic.value
  const rect = target?.getBoundingClientRect()
  if (!target || !rect) return
  const x = Math.min(rect.width, Math.max(0, event.clientX - rect.left))
  const y = Math.min(rect.height, Math.max(0, event.clientY - rect.top))

  if (!mosaicPointer.initialized) {
    mosaicPointer.smoothX = x
    mosaicPointer.smoothY = y
    mosaicPointer.initialized = true
  }

  mosaicPointer.active = true
  mosaicPointer.targetX = x
  mosaicPointer.targetY = y
  mosaicActive.value = true
  scheduleMosaicRender()
}

function resetMosaicFocus() {
  if (mosaicFrame) {
    window.cancelAnimationFrame(mosaicFrame)
    mosaicFrame = 0
  }
  mosaicPointer.active = false
  mosaicPointer.initialized = false
  mosaicActive.value = false
  featureMosaic.value?.style.setProperty('--mosaic-x', '50%')
  featureMosaic.value?.style.setProperty('--mosaic-y', '50%')
  featureMosaic.value?.style.setProperty('--mosaic-x-percent', '50%')
  featureMosaic.value?.style.setProperty('--mosaic-y-percent', '50%')
  featureMosaic.value?.querySelectorAll<HTMLElement>('.feature-card').forEach((card) => {
    card.style.removeProperty('--card-x')
    card.style.removeProperty('--card-y')
    card.style.removeProperty('--beam-alpha')
    card.style.removeProperty('--beam-soft')
    card.style.removeProperty('--beam-delay')
    card.style.removeProperty('--beam-phase')
  })
}

function scheduleTerminalTick(delay = 42) {
  window.clearTimeout(terminalTimer)
  terminalTimer = window.setTimeout(tickTerminal, delay)
}

function beginTerminalLine() {
  const source = terminalSourceLines[terminalLineIndex % terminalSourceLines.length]
  terminalCharIndex = 0
  terminalNeedsNewLine = false
  terminalVisibleLines.value = [
    ...terminalVisibleLines.value.map((line) => ({ ...line, active: false })),
    {
      id: ++terminalLineId,
      prompt: source.prompt,
      text: '',
      tone: source.tone,
      active: true
    }
  ].slice(-2)
}

function tickTerminal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    terminalVisibleLines.value = terminalSourceLines.slice(-2).map((line, index) => ({
      ...line,
      id: index + 1,
      active: index === 1
    }))
    return
  }

  if (isThemeSwitching.value) {
    scheduleTerminalTick(180)
    return
  }

  if (terminalNeedsNewLine || terminalVisibleLines.value.length === 0) {
    beginTerminalLine()
    scheduleTerminalTick(120)
    return
  }

  const source = terminalSourceLines[terminalLineIndex % terminalSourceLines.length]
  const activeLine = terminalVisibleLines.value.find((line) => line.active)
  if (!activeLine) {
    terminalNeedsNewLine = true
    scheduleTerminalTick(80)
    return
  }

  if (terminalCharIndex < source.text.length) {
    terminalCharIndex += 1
    const typedText = source.text.slice(0, terminalCharIndex)
    terminalVisibleLines.value = terminalVisibleLines.value.map((line) =>
      line.id === activeLine.id ? { ...line, text: typedText } : line
    )

    const char = source.text[terminalCharIndex - 1]
    const isPunctuation = /[.,:;()[\]{}=>-]/.test(char)
    const isWhitespace = /\s/.test(char)
    const delay = isPunctuation ? 82 : isWhitespace ? 28 : 34 + Math.random() * 38
    scheduleTerminalTick(delay)
    return
  }

  terminalLineIndex = (terminalLineIndex + 1) % terminalSourceLines.length
  terminalCharIndex = 0
  terminalNeedsNewLine = true
  scheduleTerminalTick(source.tone === 'ok' ? 1100 : 520)
}

function startTerminalTyping() {
  terminalVisibleLines.value = []
  terminalLineIndex = 0
  terminalCharIndex = 0
  terminalLineId = 0
  terminalNeedsNewLine = true
  tickTerminal()
}

function stopTerminalTyping() {
  window.clearTimeout(terminalTimer)
  terminalTimer = 0
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function updateBrandEcho() {
  brandEchoFrame = 0
  const target = capabilitySection.value
  if (!target) return

  const rect = target.getBoundingClientRect()
  const viewportHeight = window.innerHeight || 1
  const viewportCenter = viewportHeight * 0.44
  const progress = clamp((viewportCenter - rect.top) / Math.max(1, rect.height), -0.35, 1.25)
  const parallax = progress * 92

  target.style.setProperty('--brand-echo-shift', `${parallax.toFixed(2)}px`)
}

function scheduleBrandEchoUpdate() {
  if (brandEchoFrame) return
  brandEchoFrame = window.requestAnimationFrame(updateBrandEcho)
}

function toggleTheme() {
  if (isThemeSwitching.value) return

  isThemeSwitching.value = true
  document.documentElement.classList.add('theme-switching')
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')

  window.clearTimeout(themeSwitchTimer)
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
  startTerminalTyping()
  updateBrandEcho()
  window.addEventListener('scroll', scheduleBrandEchoUpdate, { passive: true })
  window.addEventListener('resize', scheduleBrandEchoUpdate, { passive: true })
  authStore.checkAuth()
  if (!appStore.publicSettingsLoaded) {
    appStore.fetchPublicSettings()
  }
})

onBeforeUnmount(() => {
  if (mosaicFrame) {
    window.cancelAnimationFrame(mosaicFrame)
  }
  if (brandEchoFrame) {
    window.cancelAnimationFrame(brandEchoFrame)
  }
  window.removeEventListener('scroll', scheduleBrandEchoUpdate)
  window.removeEventListener('resize', scheduleBrandEchoUpdate)
  stopTerminalTyping()
  window.clearTimeout(themeSwitchTimer)
  document.documentElement.classList.remove('theme-switching')
})
</script>

<style scoped>
.home-page {
  --pointer-x: 50%;
  --pointer-y: 42%;
  --ink: #101827;
  --muted: #5f6c80;
  --surface: rgba(255, 255, 255, 0.78);
  --surface-strong: rgba(255, 255, 255, 0.92);
  --line: rgba(18, 28, 45, 0.135);
  --card-fill: rgba(255, 255, 255, 0.5);
  --card-fill-strong: rgba(255, 255, 255, 0.62);
  --aurora-line: rgba(20, 184, 166, 0.34);
  --glass-bg: rgba(255, 255, 255, 0.58);
  --glass-bg-strong: rgba(255, 255, 255, 0.76);
  --glass-border: rgba(255, 255, 255, 0.62);
  --glass-line: rgba(15, 23, 42, 0.1);
  --glass-shadow: rgba(15, 23, 42, 0.09);
  position: relative;
  min-height: 100vh;
  overflow: visible;
  background: transparent;
  color: var(--ink);
  isolation: isolate;
}

.dark .home-page {
  --ink: #f8fafc;
  --muted: #a9b4c4;
  --surface: rgba(12, 18, 31, 0.72);
  --surface-strong: rgba(15, 23, 42, 0.88);
  --line: rgba(226, 232, 240, 0.12);
  --card-fill: rgba(12, 18, 31, 0.72);
  --card-fill-strong: rgba(15, 23, 42, 0.9);
  --aurora-line: rgba(45, 212, 191, 0.28);
  --glass-bg: rgba(8, 13, 24, 0.48);
  --glass-bg-strong: rgba(10, 16, 28, 0.66);
  --glass-border: rgba(255, 255, 255, 0.13);
  --glass-line: rgba(226, 232, 240, 0.13);
  --glass-shadow: rgba(0, 0, 0, 0.28);
  background: transparent;
}

:global(html.theme-switching) .home-page > :not(.route-background),
:global(html.theme-switching) .home-page > :not(.route-background) *,
:global(html.theme-switching) .home-page > :not(.route-background)::before,
:global(html.theme-switching) .home-page > :not(.route-background)::after,
:global(html.theme-switching) .home-page > :not(.route-background) *::before,
:global(html.theme-switching) .home-page > :not(.route-background) *::after {
  animation-play-state: paused !important;
  backdrop-filter: none !important;
  filter: none !important;
  transition-delay: 0s !important;
  transition-duration: 0.01ms !important;
}

.home-header {
  position: relative;
  z-index: 20;
  padding: 18px 24px 0;
}

.home-nav {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  max-width: 1180px;
  margin: 0 auto;
  overflow: visible;
  padding: 9px 11px;
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.42)),
    var(--glass-bg);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    inset 0 -1px 0 rgba(15, 23, 42, 0.04),
    0 20px 60px var(--glass-shadow);
  backdrop-filter: blur(26px) saturate(1.28);
  -webkit-backdrop-filter: blur(26px) saturate(1.28);
  isolation: isolate;
}

.home-nav::before,
.home-nav::after {
  content: '';
  pointer-events: none;
  position: absolute;
  inset: 0;
}

.home-nav::before {
  z-index: 0;
  border-radius: inherit;
  background:
    radial-gradient(circle at 16% 0%, rgba(255, 255, 255, 0.74), transparent 32%),
    radial-gradient(circle at 86% 12%, rgba(45, 212, 191, 0.16), transparent 34%),
    linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.2) 46%, transparent 58%);
  opacity: 0.92;
}

.home-nav::after {
  z-index: 0;
  border-radius: inherit;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.16),
    inset 0 12px 28px rgba(255, 255, 255, 0.18);
  opacity: 0.82;
}

.dark .home-nav {
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.32), rgba(2, 6, 23, 0.34)),
    var(--glass-bg);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    inset 0 -1px 0 rgba(0, 0, 0, 0.22),
    0 22px 64px var(--glass-shadow);
}

.dark .home-nav::before {
  background:
    radial-gradient(circle at 12% -4%, rgba(255, 255, 255, 0.14), transparent 34%),
    radial-gradient(circle at 86% 12%, rgba(45, 212, 191, 0.18), transparent 36%),
    linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.08) 46%, transparent 58%);
}

.home-nav > * {
  position: relative;
  z-index: 1;
}

.brand-lockup,
.nav-actions {
  display: flex;
  align-items: center;
}

.brand-lockup {
  min-width: 0;
  gap: 10px;
  border-radius: 8px;
  padding: 2px 4px 2px 2px;
  transition:
    background 0.22s ease,
    transform 0.22s ease;
}

.brand-lockup:hover {
  background: rgba(255, 255, 255, 0.34);
  transform: translateY(-1px);
}

.dark .brand-lockup:hover {
  background: rgba(255, 255, 255, 0.06);
}

.brand-mark {
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

.brand-mark img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-copy {
  display: grid;
  gap: 1px;
  line-height: 1.1;
}

.brand-copy strong {
  max-width: 180px;
  overflow: hidden;
  color: var(--ink);
  font-size: 14px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brand-copy span {
  color: var(--muted);
  font-size: 11px;
}

.icon-action,
.login-pill,
.secondary-cta,
.trust-link {
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.nav-actions {
  gap: 8px;
  z-index: 3;
}

.nav-actions :deep(.relative) {
  z-index: 5;
}

.icon-action {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--muted);
}

.icon-action:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.54);
  background: rgba(255, 255, 255, 0.42);
  color: var(--ink);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.68),
    0 10px 22px rgba(15, 23, 42, 0.07);
}

.icon-action:disabled {
  cursor: default;
  opacity: 0.62;
}

.icon-action:focus,
.icon-action:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.18);
}

.dark .icon-action:hover {
  border-color: rgba(255, 255, 255, 0.11);
  background: rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 12px 24px rgba(0, 0, 0, 0.18);
}

.dark .icon-action:focus,
.dark .icon-action:focus-visible {
  box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.22);
}

.login-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.56);
  border-radius: 999px;
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.13), rgba(37, 99, 235, 0.09)),
    rgba(255, 255, 255, 0.56);
  padding: 7px 14px;
  color: #0f766e;
  font-size: 13px;
  font-weight: 750;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78),
    0 12px 24px rgba(20, 184, 166, 0.09);
  backdrop-filter: blur(18px) saturate(1.18);
  -webkit-backdrop-filter: blur(18px) saturate(1.18);
}

.login-pill:hover {
  transform: translateY(-2px);
  border-color: rgba(20, 184, 166, 0.34);
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.14), rgba(37, 99, 235, 0.1)),
    rgba(255, 255, 255, 0.74);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 16px 30px rgba(20, 184, 166, 0.14);
}

.dark .login-pill {
  border-color: rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.16), rgba(37, 99, 235, 0.1)),
    rgba(15, 23, 42, 0.42);
  color: #99f6e4;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 14px 28px rgba(0, 0, 0, 0.22);
}

.home-nav :deep(.relative > button) {
  min-height: 36px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  transition:
    transform 0.22s ease,
    border-color 0.22s ease,
    background 0.22s ease,
    color 0.22s ease,
    box-shadow 0.22s ease;
}

.home-nav :deep(.relative > button:hover) {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.54);
  background: rgba(255, 255, 255, 0.42);
  color: var(--ink);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.68),
    0 10px 22px rgba(15, 23, 42, 0.07);
}

.dark .home-nav :deep(.relative > button:hover) {
  border-color: rgba(255, 255, 255, 0.11);
  background: rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 12px 24px rgba(0, 0, 0, 0.18);
}

.home-nav :deep(.absolute.right-0) {
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

.dark .home-nav :deep(.absolute.right-0) {
  border-color: rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.52), rgba(2, 6, 23, 0.54)),
    rgba(15, 23, 42, 0.62);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 24px 54px rgba(0, 0, 0, 0.36);
}

.login-avatar,
.login-pill-icon {
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  border-radius: 999px;
  background: rgba(20, 184, 166, 0.14);
  color: #0f766e;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.56),
    0 8px 18px rgba(20, 184, 166, 0.12);
}

.login-avatar {
  font-size: 10px;
}

.login-pill-icon {
  background:
    radial-gradient(circle at 35% 24%, rgba(255, 255, 255, 0.7), transparent 46%),
    rgba(20, 184, 166, 0.16);
}

.dark .login-avatar,
.dark .login-pill-icon {
  background: rgba(45, 212, 191, 0.14);
  color: #99f6e4;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 8px 18px rgba(45, 212, 191, 0.12);
}

.home-main {
  position: relative;
  z-index: 5;
}

.brand-echo {
  pointer-events: none;
  position: absolute;
  z-index: 0;
  top: 38px;
  left: 50%;
  width: min(1320px, calc(100vw - 36px));
  text-align: center;
  opacity: 0.78;
  transform:
    translate3d(-50%, var(--brand-echo-shift), 0)
    scale(1);
  transform-origin: center center;
  transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.brand-echo::before {
  content: '';
  position: absolute;
  inset: 18% 7% 12%;
  background:
    radial-gradient(ellipse at 50% 58%, rgba(20, 184, 166, 0.08), transparent 62%),
    linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.07), transparent);
  filter: blur(18px);
  opacity: 0.72;
}

.brand-echo-word {
  position: relative;
  display: inline-block;
  color: transparent;
  font-size: clamp(120px, 19vw, 245px);
  font-weight: 900;
  line-height: 0.86;
  opacity: 0.44;
  -webkit-text-stroke: 1.25px rgba(15, 118, 110, 0.22);
  text-transform: uppercase;
  white-space: nowrap;
}

.brand-echo-word::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(20, 184, 166, 0.09) 26%,
    rgba(37, 99, 235, 0.3) 48%,
    rgba(20, 184, 166, 0.12) 64%,
    transparent 100%
  );
  background-size: 240% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: outline-shine 8s linear infinite;
}

.dark .brand-echo-word {
  opacity: 0.48;
  -webkit-text-stroke-color: rgba(94, 234, 212, 0.22);
}

.capability-showcase > :not(.brand-echo) {
  position: relative;
  z-index: 1;
}

.hero-section {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(420px, 1.05fr);
  align-items: center;
  gap: 42px;
  max-width: 1180px;
  min-height: min(720px, calc(100vh - 90px));
  margin: 0 auto;
  padding: 72px 24px 54px;
}

.hero-copy {
  max-width: 610px;
}

.hero-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  border: 1px solid rgba(20, 184, 166, 0.24);
  border-radius: 999px;
  background: rgba(20, 184, 166, 0.09);
  padding: 8px 12px;
  color: #0f766e;
  font-size: 12px;
  font-weight: 760;
}

.dark .hero-kicker {
  color: #5eead4;
}

.hero-title {
  margin: 0;
  color: var(--ink);
  font-size: 64px;
  font-weight: 860;
  line-height: 1.02;
}

.hero-word {
  display: inline-block;
  margin-right: 0.24em;
  opacity: 0;
  animation: word-rise 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.hero-subtitle {
  max-width: 590px;
  margin-top: 22px;
  color: var(--muted);
  font-size: 18px;
  line-height: 1.85;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 34px;
}

.primary-cta,
.secondary-cta,
.trust-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  border-radius: 8px;
  padding: 0 18px;
  font-size: 14px;
  font-weight: 800;
}

.primary-cta {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.16), rgba(37, 99, 235, 0.1)),
    rgba(255, 255, 255, 0.58);
  color: #0f766e;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    inset 0 -1px 0 rgba(15, 23, 42, 0.04),
    0 18px 34px rgba(20, 184, 166, 0.12);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
}

.primary-cta::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.32) 46%, transparent 58%);
  transform: translateX(-120%);
  animation: shine-pass 4.6s ease-in-out infinite;
}

.primary-cta > * {
  position: relative;
}

.primary-cta:hover,
.secondary-cta:hover,
.trust-link:hover {
  transform: translateY(-2px);
}

.primary-cta:hover {
  border-color: rgba(20, 184, 166, 0.48);
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.18), rgba(37, 99, 235, 0.14)),
    rgba(255, 255, 255, 0.76);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    0 20px 38px rgba(20, 184, 166, 0.18);
}

.secondary-cta {
  border: 1px solid rgba(255, 255, 255, 0.58);
  background: var(--glass-bg);
  color: var(--ink);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.62),
    0 14px 28px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(18px) saturate(1.16);
  -webkit-backdrop-filter: blur(18px) saturate(1.16);
}

.secondary-cta:hover {
  border-color: rgba(20, 184, 166, 0.36);
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 34px 0 0;
}

.hero-metrics div {
  border: 1px solid rgba(255, 255, 255, 0.54);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.66), rgba(255, 255, 255, 0.42)),
    rgba(255, 255, 255, 0.48);
  padding: 13px 14px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.76),
    0 16px 34px rgba(15, 23, 42, 0.05);
  backdrop-filter: blur(18px) saturate(1.14);
  -webkit-backdrop-filter: blur(18px) saturate(1.14);
}

.dark .hero-metrics div {
  border-color: rgba(255, 255, 255, 0.1);
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.36), rgba(2, 6, 23, 0.3)),
    rgba(15, 23, 42, 0.42);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 16px 34px rgba(0, 0, 0, 0.18);
}

.hero-metrics dt {
  color: var(--muted);
  font-size: 11px;
}

.hero-metrics dd {
  margin: 5px 0 0;
  color: var(--ink);
  font-size: 13px;
  font-weight: 780;
}

.hero-visual {
  position: relative;
  display: grid;
  min-height: 500px;
  place-items: center;
  perspective: 1400px;
}

.spotlight-card {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  backdrop-filter: blur(22px) saturate(1.18);
  -webkit-backdrop-filter: blur(22px) saturate(1.18);
}

.spotlight-card::before {
  content: '';
  position: absolute;
  inset: -1px;
  pointer-events: none;
  background: radial-gradient(
    520px circle at var(--pointer-x) var(--pointer-y),
    rgba(20, 184, 166, 0.18),
    rgba(59, 130, 246, 0.08) 34%,
    transparent 68%
  );
  opacity: 0;
  transition: opacity 0.25s ease;
}

.spotlight-card:hover::before {
  opacity: 1;
}

.aurora-card {
  --feature-tone: #14b8a6;
  --beam-alpha: 0;
  --beam-soft: 0;
  --beam-delay: 0ms;
  --beam-phase: 0ms;
  --card-x: 50%;
  --card-y: 50%;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.64);
  border-radius: 8px;
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.82), transparent 34%),
    radial-gradient(circle at 94% 12%, color-mix(in srgb, var(--feature-tone) 15%, transparent), transparent 36%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.58), rgba(255, 255, 255, 0.32)),
    var(--card-fill-strong);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    inset 0 -1px 0 rgba(15, 23, 42, 0.035),
    0 24px 68px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(30px) saturate(1.22);
  -webkit-backdrop-filter: blur(30px) saturate(1.22);
  isolation: isolate;
}

.aurora-card::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  padding: 1px;
  border-radius: inherit;
  background:
    linear-gradient(
      90deg,
      transparent 0%,
      color-mix(in srgb, var(--feature-tone) 0%, transparent) 24%,
      color-mix(in srgb, var(--feature-tone) 74%, transparent) 42%,
      rgba(255, 255, 255, 0.9) 50%,
      rgba(37, 99, 235, 0.72) 58%,
      transparent 76%
    ) top left / 220% 1px no-repeat,
    linear-gradient(
      180deg,
      transparent 0%,
      color-mix(in srgb, var(--feature-tone) 72%, transparent) 42%,
      rgba(255, 255, 255, 0.82) 50%,
      rgba(37, 99, 235, 0.62) 60%,
      transparent 78%
    ) top right / 1px 220% no-repeat,
    linear-gradient(
      270deg,
      transparent 0%,
      rgba(37, 99, 235, 0.58) 36%,
      rgba(255, 255, 255, 0.78) 48%,
      color-mix(in srgb, var(--feature-tone) 70%, transparent) 58%,
      transparent 80%
    ) bottom right / 220% 1px no-repeat,
    linear-gradient(
      0deg,
      transparent 0%,
      rgba(37, 99, 235, 0.46) 38%,
      rgba(255, 255, 255, 0.72) 48%,
      color-mix(in srgb, var(--feature-tone) 68%, transparent) 60%,
      transparent 82%
    ) bottom left / 1px 220% no-repeat,
    radial-gradient(
      190px circle at var(--card-x) var(--card-y),
      rgba(255, 255, 255, 0.9),
      color-mix(in srgb, var(--feature-tone) 62%, transparent) 18%,
      rgba(37, 99, 235, 0.34) 36%,
      transparent 68%
    );
  opacity: var(--beam-alpha);
  pointer-events: none;
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: border-sweep 6.8s cubic-bezier(0.45, 0, 0.2, 1) infinite;
  animation-delay: var(--beam-phase);
  transition:
    opacity 0.62s cubic-bezier(0.22, 1, 0.36, 1) var(--beam-delay),
    filter 0.62s cubic-bezier(0.22, 1, 0.36, 1) var(--beam-delay);
}

.aurora-card::after {
  content: '';
  position: absolute;
  inset: -1px;
  z-index: 1;
  padding: 2px;
  border-radius: inherit;
  pointer-events: none;
  background: radial-gradient(
    210px circle at var(--card-x) var(--card-y),
    color-mix(in srgb, var(--feature-tone) 48%, transparent),
    rgba(37, 99, 235, 0.2) 34%,
    transparent 72%
  );
  filter: blur(7px);
  opacity: var(--beam-soft);
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1) var(--beam-delay);
}

.aurora-card:hover {
  --beam-alpha: 0.92;
  --beam-soft: 0.46;
  --beam-delay: 0ms;
}

.dark .aurora-card {
  border-color: rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.24), rgba(2, 6, 23, 0.12)),
    var(--card-fill-strong);
  box-shadow:
    0 24px 70px rgba(0, 0, 0, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.route-cockpit {
  width: min(100%, 560px);
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(12, 18, 31, 0.96), rgba(14, 24, 44, 0.9)),
    #0f172a;
  box-shadow:
    0 30px 70px rgba(15, 23, 42, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
  transform: rotateX(6deg) rotateY(-7deg) translateY(0);
  transition:
    transform 0.35s ease,
    box-shadow 0.35s ease;
}

.route-cockpit:hover {
  transform: rotateX(2deg) rotateY(-2deg) translateY(-8px);
  box-shadow:
    0 36px 90px rgba(15, 23, 42, 0.36),
    0 0 0 1px rgba(20, 184, 166, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.09);
}

.cockpit-topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 14px 16px;
}

.cockpit-topbar span {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.cockpit-topbar span:nth-child(1) {
  background: #ef4444;
}

.cockpit-topbar span:nth-child(2) {
  background: #38bdf8;
}

.cockpit-topbar span:nth-child(3) {
  background: #22c55e;
}

.cockpit-topbar p {
  flex: 1;
  margin: 0 48px 0 0;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  text-align: center;
}

.cockpit-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(160px, 0.8fr);
  gap: 16px;
  padding: 18px;
}

.route-map,
.route-status,
.terminal-strip {
  position: relative;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.38);
}

.map-head {
  display: flex;
  justify-content: space-between;
  padding: 14px 14px 0;
  color: #94a3b8;
  font-size: 12px;
}

.map-head strong {
  color: #22c55e;
  font-weight: 760;
}

.map-layers {
  --matrix-x: 50%;
  --matrix-y: 50%;
  position: relative;
  height: 260px;
  margin: 8px;
  overflow: hidden;
  border-radius: 8px;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.09) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.09) 1px, transparent 1px);
  background-size: 32px 32px;
  cursor: crosshair;
  isolation: isolate;
}

.map-layers::before,
.map-layers::after {
  content: '';
  position: absolute;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.24s ease;
}

.map-layers::before {
  z-index: 1;
  inset: 0;
  background:
    radial-gradient(
      132px circle at var(--matrix-x) var(--matrix-y),
      rgba(255, 255, 255, 0.42),
      rgba(20, 184, 166, 0.2) 22%,
      rgba(59, 130, 246, 0.12) 48%,
      transparent 72%
    ),
    conic-gradient(
      from 90deg at var(--matrix-x) var(--matrix-y),
      transparent,
      rgba(20, 184, 166, 0.14),
      transparent 34%,
      rgba(34, 211, 238, 0.1),
      transparent 72%
    );
  mix-blend-mode: screen;
}

.map-layers::after {
  z-index: 3;
  width: 140px;
  height: 1px;
  left: var(--matrix-x);
  top: var(--matrix-y);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.82), transparent);
  box-shadow: 0 0 20px rgba(20, 184, 166, 0.72);
  transform: translate(-50%, -50%);
}

.map-layers.is-matrix-active::before,
.map-layers.is-matrix-active::after {
  opacity: 1;
}

.map-layers.is-matrix-active {
  background-color: rgba(1, 8, 20, 0.68);
  box-shadow:
    inset 0 0 0 1px rgba(20, 184, 166, 0.2),
    inset 0 0 42px rgba(20, 184, 166, 0.12);
}

.matrix-hover-grid {
  position: absolute;
  z-index: 1;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: repeat(8, minmax(0, 1fr));
}

.matrix-cell {
  position: relative;
  border-right: 1px solid rgba(20, 184, 166, 0.06);
  border-bottom: 1px solid rgba(20, 184, 166, 0.06);
  background:
    linear-gradient(
      135deg,
      rgb(20 184 166 / calc(var(--cell-intensity) * 0.32)),
      rgb(37 99 235 / calc(var(--cell-intensity) * 0.18))
    );
  opacity: calc(0.12 + var(--cell-intensity) * 0.88);
  transform: scale(calc(0.985 + var(--cell-intensity) * 0.03));
  transition:
    background 0.18s ease var(--cell-delay),
    border-color 0.18s ease var(--cell-delay),
    box-shadow 0.18s ease var(--cell-delay),
    opacity 0.18s ease var(--cell-delay),
    transform 0.18s ease var(--cell-delay);
}

.matrix-cell::after {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: 2px;
  background:
    linear-gradient(
      160deg,
      rgb(255 255 255 / calc(var(--cell-intensity) * 0.22)),
      transparent 54%
    );
  opacity: calc(var(--cell-intensity) * 0.85);
}

.map-layers.is-matrix-active .matrix-cell {
  border-color: rgb(20 184 166 / calc(0.08 + var(--cell-intensity) * 0.32));
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / calc(var(--cell-intensity) * 0.16)),
    0 0 calc(var(--cell-intensity) * 22px) rgb(20 184 166 / calc(var(--cell-intensity) * 0.34));
}

.map-layers.is-matrix-active .hub {
  filter: saturate(1.2) brightness(1.08);
}

.map-layers.is-matrix-active .hub-core {
  box-shadow: none;
}

.hub {
  position: absolute;
  z-index: 2;
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.2), transparent 42%),
    rgba(15, 23, 42, 0.9);
  color: #dbeafe;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 12px 28px rgba(15, 23, 42, 0.18);
  transition:
    border-color 0.32s ease,
    box-shadow 0.32s ease,
    color 0.32s ease,
    transform 0.32s ease;
}

.hub-core {
  left: 50%;
  top: 50%;
  width: 58px;
  height: 58px;
  transform: translate(-50%, -50%);
  color: #fff;
}

.hub :deep(.brand-icon) {
  filter: drop-shadow(0 0 10px rgba(20, 184, 166, 0.18));
}

.project-logo-icon {
  display: block;
  width: 76%;
  height: 76%;
  object-fit: contain;
  filter: drop-shadow(0 8px 16px rgba(15, 23, 42, 0.16));
}

.brand-core-node {
  overflow: visible;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.brand-core-node .brand-core-logo {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  filter: drop-shadow(0 12px 22px rgba(15, 23, 42, 0.24));
}

.hub-a {
  left: 10%;
  top: 16%;
}

.hub-b {
  right: 12%;
  top: 20%;
}

.hub-c {
  left: 15%;
  bottom: 17%;
}

.hub-d {
  right: 16%;
  bottom: 16%;
}

.beam {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 48%;
  height: 1px;
  transform-origin: left center;
  background: linear-gradient(90deg, rgba(20, 184, 166, 0.8), transparent);
}

.beam::after {
  content: '';
  position: absolute;
  width: 36px;
  height: 1px;
  background: #fff;
  box-shadow: 0 0 18px rgba(20, 184, 166, 0.9);
  animation: beam-run 2.8s linear infinite;
}

.beam-1 {
  transform: rotate(222deg);
}

.beam-2 {
  transform: rotate(318deg);
}

.beam-3 {
  transform: rotate(138deg);
}

.beam-4 {
  transform: rotate(42deg);
}

.beam-2::after {
  animation-delay: 0.6s;
}

.beam-3::after {
  animation-delay: 1.1s;
}

.beam-4::after {
  animation-delay: 1.7s;
}

.route-status {
  display: grid;
  gap: 10px;
  align-content: center;
  padding: 14px;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 8px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.64);
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #22c55e;
}

.status-row p {
  margin: 0;
  color: #94a3b8;
  font-size: 11px;
}

.status-row strong {
  display: block;
  margin-top: 2px;
  color: #f8fafc;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
}

.status-dot {
  background: var(--tone);
  box-shadow: 0 0 24px color-mix(in srgb, var(--tone) 36%, transparent);
}

.terminal-strip {
  margin: 0 18px 18px;
  padding: 14px 16px;
  color: #94a3b8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

.terminal-strip p {
  margin: 0;
}

.terminal-strip p + p {
  margin-top: 8px;
}

.terminal-strip span {
  color: #22c55e;
}

.hacker-terminal {
  position: relative;
  display: grid;
  min-height: 72px;
  align-content: center;
  gap: 7px;
  overflow: hidden;
  isolation: isolate;
}

.hacker-terminal::before,
.hacker-terminal::after {
  content: '';
  position: absolute;
  pointer-events: none;
  inset: 0;
  z-index: 0;
}

.hacker-terminal::before {
  background:
    linear-gradient(180deg, transparent 0%, rgba(94, 234, 212, 0.09) 48%, transparent 100%),
    repeating-linear-gradient(180deg, rgba(148, 163, 184, 0.06) 0 1px, transparent 1px 6px);
  opacity: 0.28;
  transform: translateY(-38%);
  animation: terminal-scan 5.8s linear infinite;
}

.hacker-terminal::after {
  background:
    radial-gradient(circle at 10% 50%, rgba(45, 212, 191, 0.12), transparent 34%),
    linear-gradient(90deg, rgba(34, 211, 238, 0.08), transparent 34%, rgba(20, 184, 166, 0.08));
  opacity: 0.5;
  mix-blend-mode: screen;
}

.terminal-line {
  position: relative;
  z-index: 1;
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  margin: 0;
  overflow: hidden;
  color: #8da2b8;
  line-height: 1.35;
  opacity: 0.76;
  text-shadow: 0 0 16px rgba(20, 184, 166, 0.12);
  transform-origin: left center;
  animation: terminal-line-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.terminal-line.is-active {
  color: #d8fff8;
  opacity: 1;
}

.hacker-terminal .terminal-line + .terminal-line {
  margin-top: 0;
}

.terminal-prompt {
  width: 26px;
  flex: 0 0 26px;
  color: #5eead4;
  font-weight: 800;
  text-align: right;
  text-shadow: 0 0 14px rgba(45, 212, 191, 0.44);
}

.terminal-line-ok .terminal-prompt {
  color: #86efac;
  text-shadow: 0 0 14px rgba(34, 197, 94, 0.42);
}

.terminal-line code {
  min-width: 0;
  overflow: hidden;
  color: currentColor;
  font: inherit;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.terminal-cursor {
  width: 7px;
  height: 14px;
  flex: 0 0 7px;
  border-radius: 1px;
  background: #5eead4;
  box-shadow: 0 0 16px rgba(45, 212, 191, 0.72);
  animation: terminal-cursor 0.88s steps(1) infinite;
}

.floating-ticket {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.86), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.58), rgba(255, 255, 255, 0.34)),
    rgba(255, 255, 255, 0.34);
  padding: 10px 12px;
  color: var(--ink);
  font-size: 12px;
  font-weight: 780;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    inset 0 -1px 0 rgba(15, 23, 42, 0.035),
    0 18px 42px rgba(15, 23, 42, 0.09);
  backdrop-filter: blur(24px) saturate(1.24);
  -webkit-backdrop-filter: blur(24px) saturate(1.24);
  animation: ticket-float 5s ease-in-out infinite;
}

.dark .floating-ticket {
  border-color: rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.36), rgba(2, 6, 23, 0.28)),
    rgba(15, 23, 42, 0.58);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 18px 40px rgba(0, 0, 0, 0.28);
}

.ticket-a {
  left: 10px;
  top: 86px;
}

.ticket-b {
  right: 4px;
  bottom: 92px;
  animation-delay: 1.2s;
}

.section-block {
  position: relative;
  max-width: 1180px;
  margin: 0 auto;
  padding: 54px 24px;
}

.section-heading {
  max-width: 620px;
  margin: 0 auto 28px;
  text-align: center;
}

.section-heading span,
.flow-copy span,
.trust-kicker {
  color: #0f766e;
  font-size: 12px;
  font-weight: 820;
  text-transform: uppercase;
}

.dark .section-heading span,
.dark .flow-copy span,
.dark .trust-kicker {
  color: #5eead4;
}

.section-heading h2,
.flow-copy h2,
.trust-card h2 {
  margin: 10px 0 0;
  color: var(--ink);
  font-size: 34px;
  font-weight: 840;
  line-height: 1.18;
}

.section-heading p,
.flow-copy p,
.trust-card p {
  margin: 14px 0 0;
  color: var(--muted);
  line-height: 1.75;
}

.section-heading.compact {
  margin-bottom: 22px;
}

.capability-showcase {
  --brand-echo-shift: 0px;
  position: relative;
  max-width: 1220px;
  padding-top: 118px;
  overflow: visible;
}

.feature-mosaic {
  --mosaic-x: 50%;
  --mosaic-y: 50%;
  --mosaic-x-percent: 50%;
  --mosaic-y-percent: 50%;
  position: relative;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: minmax(250px, auto);
  gap: 14px;
}

.feature-mosaic::before {
  content: '';
  position: absolute;
  inset: -18px;
  z-index: 0;
  background:
    radial-gradient(
      330px circle at var(--mosaic-x) var(--mosaic-y),
      rgba(20, 184, 166, 0.22),
      rgba(37, 99, 235, 0.11) 34%,
      transparent 72%
    );
  filter: blur(15px);
  opacity: 0;
  transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.feature-mosaic::after {
  content: '';
  position: absolute;
  inset: -1px;
  z-index: 0;
  background:
    linear-gradient(90deg, transparent 0%, rgba(20, 184, 166, 0.52) 44%, rgba(255, 255, 255, 0.82) 50%, rgba(37, 99, 235, 0.42) 56%, transparent 100%) 0 0 / 260% 1px repeat-x,
    linear-gradient(90deg, transparent 0%, rgba(37, 99, 235, 0.34) 38%, rgba(20, 184, 166, 0.48) 50%, transparent 82%) 0 100% / 240% 1px repeat-x,
    linear-gradient(180deg, transparent 0%, rgba(20, 184, 166, 0.48) 42%, rgba(255, 255, 255, 0.72) 50%, rgba(37, 99, 235, 0.36) 58%, transparent 100%) 0 0 / 1px 260% repeat-y,
    linear-gradient(180deg, transparent 0%, rgba(37, 99, 235, 0.34) 34%, rgba(20, 184, 166, 0.46) 50%, transparent 78%) 100% 0 / 1px 240% repeat-y;
  opacity: 0;
  animation: shared-border-flow 8.8s cubic-bezier(0.45, 0, 0.2, 1) infinite;
  mask-image: radial-gradient(
    380px circle at var(--mosaic-x) var(--mosaic-y),
    #000 0%,
    rgba(0, 0, 0, 0.86) 35%,
    rgba(0, 0, 0, 0.38) 58%,
    transparent 78%
  );
  transition: opacity 0.72s cubic-bezier(0.22, 1, 0.36, 1);
}

.feature-mosaic.is-mosaic-active::before {
  opacity: 0.42;
}

.feature-mosaic.is-mosaic-active::after {
  opacity: 1;
}

.feature-card {
  --beam-alpha: 0;
  --beam-soft: 0;
  z-index: 1;
  display: flex;
  min-height: 250px;
  flex-direction: column;
  padding: 20px;
  transition:
    transform 0.38s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.38s ease,
    border-color 0.38s ease;
}

.feature-card:hover {
  transform: translateY(-6px);
  border-color: color-mix(in srgb, var(--feature-tone) 52%, rgba(148, 163, 184, 0.22));
  box-shadow:
    0 26px 62px rgba(15, 23, 42, 0.13),
    0 0 0 1px color-mix(in srgb, var(--feature-tone) 20%, transparent);
}

.feature-mosaic.is-mosaic-active .feature-card {
  border-color: rgba(148, 163, 184, 0.18);
}

.feature-mosaic.is-mosaic-active .feature-card:hover {
  --beam-alpha: 0.96;
  --beam-soft: 0.5;
}

.feature-card > * {
  position: relative;
  z-index: 1;
}

.feature-card.is-featured {
  grid-column: span 6;
  grid-row: span 2;
  min-height: 492px;
}

.feature-card:not(.is-featured) {
  grid-column: span 3;
}

.feature-card.feature-card-global {
  display: grid;
  grid-column: span 12;
  min-height: 232px;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 0.42fr);
  grid-template-rows: auto minmax(0, 1fr) auto;
  column-gap: 24px;
  align-items: start;
}

.feature-card.feature-card-global .feature-card-head {
  grid-column: 1;
}

.feature-card.feature-card-global .feature-visual {
  grid-column: 2;
  grid-row: 1 / span 3;
  min-height: 168px;
  align-self: stretch;
  margin: 0;
}

.feature-card.feature-card-global h3 {
  grid-column: 1;
  margin-top: 36px;
}

.feature-card.feature-card-global p {
  grid-column: 1;
  max-width: 650px;
}

.feature-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.feature-card-head span {
  border-radius: 999px;
  background: color-mix(in srgb, var(--feature-tone) 12%, transparent);
  padding: 5px 8px;
  color: color-mix(in srgb, var(--feature-tone) 74%, #0f172a);
  font-size: 10px;
  font-weight: 850;
  text-transform: uppercase;
}

.dark .feature-card-head span {
  color: color-mix(in srgb, var(--feature-tone) 84%, #ffffff);
}

.feature-icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--feature-tone) 24%, rgba(148, 163, 184, 0.2));
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.86), transparent 42%),
    radial-gradient(circle at 68% 88%, color-mix(in srgb, var(--feature-tone) 15%, transparent), transparent 56%),
    rgba(255, 255, 255, 0.42);
  color: color-mix(in srgb, var(--feature-tone) 70%, #0f172a);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.88),
    0 12px 24px color-mix(in srgb, var(--feature-tone) 10%, rgba(15, 23, 42, 0.06));
}

.dark .feature-icon {
  border-color: color-mix(in srgb, var(--feature-tone) 28%, rgba(226, 232, 240, 0.12));
  background:
    radial-gradient(circle at 30% 24%, color-mix(in srgb, var(--feature-tone) 20%, transparent), transparent 48%),
    rgba(15, 23, 42, 0.58);
  color: color-mix(in srgb, var(--feature-tone) 70%, #e2e8f0);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 12px 24px rgba(0, 0, 0, 0.14);
}

.feature-card h3 {
  margin: auto 0 0;
  color: var(--ink);
  font-size: 18px;
  font-weight: 800;
}

.feature-card.is-featured h3 {
  font-size: 25px;
}

.feature-card p {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.75;
}

.feature-visual {
  position: relative;
  display: grid;
  min-height: 124px;
  flex: 1;
  margin: 18px 0;
  place-items: center;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.38);
  background:
    radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--feature-tone) 18%, transparent), transparent 58%),
    radial-gradient(circle at 28% 10%, rgba(255, 255, 255, 0.72), transparent 48%),
    linear-gradient(180deg, rgba(248, 250, 252, 0.34), rgba(241, 245, 249, 0.12));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.62),
    inset 0 -1px 0 rgba(15, 23, 42, 0.025);
  backdrop-filter: blur(14px) saturate(1.08);
  -webkit-backdrop-filter: blur(14px) saturate(1.08);
}

.dark .feature-visual {
  background:
    radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--feature-tone) 22%, transparent), transparent 58%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.66), rgba(2, 6, 23, 0.32));
}

.feature-card.is-featured .feature-visual {
  min-height: 280px;
}

.model-aggregation {
  position: relative;
  width: min(420px, 100%);
  height: 252px;
}

.model-aggregation::before,
.model-aggregation::after {
  content: '';
  position: absolute;
  inset: 28px;
  border: 1px solid rgba(20, 184, 166, 0.18);
  border-radius: 50%;
  animation: orbit-breathe 5.6s ease-in-out infinite;
}

.model-aggregation::after {
  inset: 56px;
  border-color: rgba(37, 99, 235, 0.16);
  animation-delay: 1s;
}

.model-core {
  position: absolute;
  left: 50%;
  top: 50%;
  display: grid;
  width: 88px;
  height: 88px;
  place-items: center;
  color: #fff;
  transform: translate(-50%, -50%);
}

.model-core .project-logo-icon {
  width: 76%;
  height: 76%;
}

.model-node {
  --node-angle: calc(var(--node-index) * 60deg - 90deg);
  position: absolute;
  left: 50%;
  top: 50%;
  display: inline-flex;
  width: 62px;
  height: 62px;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--model-color) 36%, rgba(148, 163, 184, 0.24));
  border-radius: 8px;
  background:
    radial-gradient(circle at 32% 24%, color-mix(in srgb, var(--model-color) 18%, transparent), transparent 44%),
    rgba(255, 255, 255, 0.82);
  padding: 0;
  color: color-mix(in srgb, var(--model-color) 70%, #111827);
  box-shadow: 0 14px 32px color-mix(in srgb, var(--model-color) 14%, rgba(15, 23, 42, 0.08));
  transform:
    translate(-50%, -50%)
    rotate(var(--node-angle))
    translateX(142px)
    rotate(calc(-1 * var(--node-angle)));
  animation: model-float 4.8s ease-in-out infinite;
  animation-delay: calc(var(--node-index) * -0.42s);
}

.dark .model-node {
  background:
    radial-gradient(circle at 32% 24%, color-mix(in srgb, var(--model-color) 24%, transparent), transparent 44%),
    rgba(15, 23, 42, 0.86);
  color: color-mix(in srgb, var(--model-color) 78%, #ffffff);
}

.model-node :deep(.brand-icon) {
  filter: drop-shadow(0 0 12px color-mix(in srgb, var(--model-color) 24%, transparent));
}

.model-spark {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: #fff;
  box-shadow:
    0 0 10px rgba(20, 184, 166, 0.9),
    0 0 22px rgba(37, 99, 235, 0.45);
  opacity: 0;
  animation: spark-pop 2.8s ease-in-out infinite;
}

.model-spark:nth-child(8) {
  left: 18%;
  top: 32%;
  animation-delay: 0s;
}

.model-spark:nth-child(9) {
  left: 34%;
  top: 72%;
  animation-delay: .35s;
}

.model-spark:nth-child(10) {
  left: 62%;
  top: 20%;
  animation-delay: .7s;
}

.model-spark:nth-child(11) {
  left: 78%;
  top: 58%;
  animation-delay: 1.05s;
}

.model-spark:nth-child(12) {
  left: 49%;
  top: 38%;
  animation-delay: 1.4s;
}

.model-spark:nth-child(13) {
  left: 23%;
  top: 56%;
  animation-delay: 1.75s;
}

.model-spark:nth-child(14) {
  left: 70%;
  top: 36%;
  animation-delay: 2.1s;
}

.model-spark:nth-child(15) {
  left: 58%;
  top: 76%;
  animation-delay: 2.45s;
}

.model-spark:nth-child(16) {
  left: 42%;
  top: 18%;
  animation-delay: 2.8s;
}

.mini-code-card {
  width: min(260px, 100%);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.94);
  padding: 16px;
  color: #cbd5e1;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.18);
}

.mini-code-card span {
  color: #5eead4;
}

.mini-code-card p {
  margin: 12px 0;
  color: #93c5fd;
  font-size: 11px;
}

.mini-code-card strong {
  color: #86efac;
}

.billing-visual {
  display: flex;
  height: 112px;
  align-items: end;
  gap: 10px;
}

.billing-visual span {
  display: block;
  width: 18px;
  border-radius: 7px 7px 3px 3px;
  background:
    linear-gradient(180deg, rgba(125, 211, 252, 0.92), rgba(20, 184, 166, 0.88));
  box-shadow: 0 10px 24px rgba(14, 165, 233, 0.13);
  animation: bar-rise 3.6s ease-in-out infinite;
}

.billing-visual span:nth-child(3n) {
  background: linear-gradient(180deg, rgba(147, 197, 253, 0.92), rgba(45, 212, 191, 0.86));
}

.billing-visual span:nth-child(even) {
  animation-delay: .4s;
}

.route-visual {
  position: relative;
  width: min(240px, 100%);
  height: 120px;
}

.route-visual span {
  position: absolute;
  left: 8px;
  right: 8px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, #14b8a6, #2563eb, transparent);
  animation: route-glow 3s ease-in-out infinite;
}

.route-visual .lane-1 {
  top: 18%;
}

.route-visual .lane-2 {
  top: 38%;
  animation-delay: .35s;
}

.route-visual .lane-3 {
  top: 58%;
  animation-delay: .7s;
}

.route-visual .lane-4 {
  top: 78%;
  animation-delay: 1.05s;
}

.route-visual strong {
  position: absolute;
  left: 50%;
  top: 50%;
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  color: #fff;
  transform: translate(-50%, -50%);
}

.route-visual strong .project-logo-icon {
  width: 78%;
  height: 78%;
}

.guard-visual {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  width: min(220px, 100%);
}

.guard-visual span {
  --guard-color: #14b8a6;
  display: grid;
  min-height: 54px;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--guard-color) 34%, rgba(148, 163, 184, 0.22));
  border-radius: 8px;
  background:
    radial-gradient(circle at 32% 24%, color-mix(in srgb, var(--guard-color) 14%, transparent), transparent 52%),
    color-mix(in srgb, var(--guard-color) 8%, transparent);
  color: color-mix(in srgb, var(--guard-color) 84%, #0f172a);
  animation: badge-pulse 4s ease-in-out infinite;
}

.dark .guard-visual span {
  color: color-mix(in srgb, var(--guard-color) 82%, #ffffff);
}

.guard-visual span:nth-child(2) {
  animation-delay: .5s;
}

.guard-visual span:nth-child(3) {
  animation-delay: 1s;
}

.guard-visual span:nth-child(4) {
  animation-delay: 1.5s;
}

.global-visual {
  position: relative;
  width: min(240px, 100%);
  height: 124px;
  border-radius: 8px;
  background-image:
    radial-gradient(circle, rgba(20, 184, 166, 0.28) 1px, transparent 1px);
  background-size: 18px 18px;
}

.global-visual::before {
  content: '';
  position: absolute;
  inset: 16px;
  border: 1px solid rgba(20, 184, 166, 0.22);
  border-radius: 50%;
}

.global-visual span {
  position: absolute;
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #14b8a6;
  box-shadow: 0 0 22px rgba(20, 184, 166, 0.58);
  animation: point-ping 2.8s ease-in-out infinite;
}

.flow-panel,
.trust-card {
  padding: 28px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
}

.flow-panel {
  display: grid;
  grid-template-columns: minmax(260px, 0.72fr) minmax(0, 1fr);
  gap: 26px;
}

.flow-copy {
  align-self: center;
}

.flow-steps {
  position: relative;
  display: grid;
  gap: 12px;
}

.flow-steps::before {
  content: '';
  position: absolute;
  top: 20px;
  bottom: 20px;
  left: 22px;
  width: 1px;
  background: linear-gradient(transparent, rgba(20, 184, 166, 0.5), transparent);
}

.flow-step {
  --flow-tone: #14b8a6;
  position: relative;
  display: grid;
  grid-template-columns: 46px 38px 1fr;
  gap: 12px;
  align-items: start;
  overflow: hidden;
  border: 0;
  border-radius: 8px;
  background: transparent;
  padding: 14px;
  transition:
    transform 0.2s ease,
    color 0.2s ease;
}

.flow-step::before {
  content: none;
}

.flow-step > * {
  position: relative;
  z-index: 1;
}

.dark .flow-step {
  background: transparent;
}

.flow-step:hover {
  transform: translateX(4px);
  background: transparent;
}

.flow-step:hover::before {
  opacity: 0;
}

.dark .flow-step:hover {
  background: transparent;
}

.step-index {
  color: #94a3b8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  font-weight: 800;
}

.flow-step svg {
  color: #0f766e;
}

.flow-step h3 {
  margin: 0;
  color: var(--ink);
  font-size: 15px;
  font-weight: 800;
}

.flow-step p {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

.partner-carousel {
  position: relative;
  width: min(100%, 1180px);
  margin: 0 auto;
  overflow: hidden;
  padding: 18px 0 28px;
  mask-image: linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent);
}

.partner-track {
  display: flex;
  width: max-content;
  gap: 14px;
  animation: partner-marquee 34s linear infinite;
}

.partner-carousel:hover .partner-track {
  animation-play-state: paused;
}

.partner-fade {
  pointer-events: none;
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 3;
  width: 120px;
}

.partner-fade-left {
  left: 0;
  background: linear-gradient(90deg, color-mix(in srgb, var(--card-fill-strong) 94%, transparent), transparent);
}

.partner-fade-right {
  right: 0;
  background: linear-gradient(270deg, color-mix(in srgb, var(--card-fill-strong) 94%, transparent), transparent);
}

.partner-item {
  --partner-color: #14b8a6;
  --feature-tone: #14b8a6;
  display: grid;
  width: 170px;
  min-height: 152px;
  flex: 0 0 auto;
  grid-template-rows: auto auto 1fr;
  align-items: center;
  justify-items: center;
  padding: 18px 14px;
  text-align: center;
  transition:
    background 0.42s ease,
    border-color 0.42s ease,
    box-shadow 0.42s ease,
    transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

.partner-item:hover {
  z-index: 4;
  border-color: rgba(255, 255, 255, 0.64);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.74), rgba(255, 255, 255, 0.48)),
    rgba(255, 255, 255, 0.56);
  box-shadow:
    0 20px 46px rgba(15, 23, 42, 0.1),
    0 0 0 1px rgba(20, 184, 166, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.74);
  transform: translateY(-6px);
}

.dark .partner-item:hover {
  border-color: rgba(255, 255, 255, 0.13);
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.34), rgba(2, 6, 23, 0.28)),
    rgba(15, 23, 42, 0.7);
  box-shadow:
    0 20px 46px rgba(0, 0, 0, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.partner-logo {
  display: grid;
  width: 58px;
  height: 58px;
  place-items: center;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.74), rgba(248, 250, 252, 0.38));
  color: color-mix(in srgb, var(--partner-color) 78%, #0f172a);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 12px 28px rgba(15, 23, 42, 0.06);
  transition:
    border-color 0.42s ease,
    box-shadow 0.42s ease,
    color 0.42s ease,
    transform 0.42s ease;
}

.partner-item:hover .partner-logo {
  border-color: rgba(20, 184, 166, 0.24);
  color: #0f766e;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    0 14px 32px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
}

.dark .partner-logo {
  border-color: rgba(226, 232, 240, 0.12);
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.72), rgba(15, 23, 42, 0.34));
  color: color-mix(in srgb, var(--partner-color) 68%, #e2e8f0);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 12px 28px rgba(0, 0, 0, 0.18);
}

.dark .partner-item:hover .partner-logo {
  border-color: rgba(45, 212, 191, 0.2);
  color: #99f6e4;
}

.partner-logo :deep(.brand-icon) {
  filter: none;
}

.partner-item.is-image-icon .partner-logo {
  border-color: rgba(148, 163, 184, 0.12);
  background: rgba(255, 255, 255, 0.34);
  box-shadow: 0 14px 30px rgba(79, 70, 229, 0.1);
}

.partner-item.is-image-icon:hover .partner-logo {
  border-color: rgba(99, 102, 241, 0.16);
  background: rgba(255, 255, 255, 0.5);
  box-shadow: 0 16px 34px rgba(79, 70, 229, 0.14);
}

.dark .partner-item.is-image-icon .partner-logo {
  border-color: rgba(226, 232, 240, 0.08);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 34px rgba(79, 70, 229, 0.2);
}

.partner-item.is-image-icon .partner-logo :deep(.brand-icon) {
  width: 44px;
  height: 44px;
  filter: drop-shadow(0 10px 18px rgba(79, 70, 229, 0.16));
}

.partner-logo .project-logo-icon {
  width: 72%;
  height: 72%;
  filter: none;
}

.partner-item strong {
  max-width: 100%;
  margin-top: 14px;
  overflow: hidden;
  color: var(--ink);
  font-size: 14px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.partner-item em {
  margin-top: 6px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.045);
  padding: 4px 8px;
  color: #64748b;
  font-size: 11px;
  font-style: normal;
  font-weight: 800;
  transition:
    background 0.42s ease,
    color 0.42s ease;
}

.partner-item:hover em {
  background: rgba(20, 184, 166, 0.08);
  color: #0f766e;
}

.dark .partner-item em {
  background: rgba(226, 232, 240, 0.08);
  color: #94a3b8;
}

.dark .partner-item:hover em {
  background: rgba(45, 212, 191, 0.1);
  color: #99f6e4;
}

.model-strip {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 6px;
}

.model-strip > span {
  --provider-color: #14b8a6;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.52);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.66), rgba(255, 255, 255, 0.38)),
    rgba(255, 255, 255, 0.46);
  padding: 7px 12px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.68),
    0 12px 26px rgba(15, 23, 42, 0.05);
  backdrop-filter: blur(16px) saturate(1.12);
  -webkit-backdrop-filter: blur(16px) saturate(1.12);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.model-strip > span:hover {
  transform: translateY(-3px);
  border-color: rgba(20, 184, 166, 0.3);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.76), rgba(255, 255, 255, 0.52)),
    rgba(255, 255, 255, 0.58);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78),
    0 14px 30px rgba(15, 23, 42, 0.08);
}

.dark .model-strip > span {
  border-color: rgba(255, 255, 255, 0.1);
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.32), rgba(2, 6, 23, 0.24)),
    rgba(15, 23, 42, 0.54);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 12px 26px rgba(0, 0, 0, 0.2);
}

.dark .model-strip > span:hover {
  border-color: rgba(45, 212, 191, 0.22);
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.42), rgba(2, 6, 23, 0.32)),
    rgba(15, 23, 42, 0.72);
}

.provider-mark {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.045);
  color: color-mix(in srgb, var(--provider-color) 64%, #334155);
}

.provider-copy {
  display: flex;
  align-items: baseline;
  gap: 7px;
}

.model-strip strong {
  color: var(--ink);
  font-size: 13px;
}

.model-strip em {
  color: #64748b;
  font-size: 11px;
  font-style: normal;
  font-weight: 760;
}

.dark .model-strip em {
  color: #94a3b8;
}

.dark .provider-mark {
  background: rgba(226, 232, 240, 0.08);
  color: color-mix(in srgb, var(--provider-color) 62%, #e2e8f0);
}

.trust-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.trust-card > div {
  max-width: 740px;
}

.trust-link {
  flex: 0 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.58);
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.12), rgba(37, 99, 235, 0.1)),
    rgba(255, 255, 255, 0.56);
  color: #0f766e;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.88),
    0 18px 34px rgba(20, 184, 166, 0.13);
  backdrop-filter: blur(18px);
}

.trust-link:hover {
  border-color: rgba(20, 184, 166, 0.44);
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.16), rgba(37, 99, 235, 0.12)),
    rgba(255, 255, 255, 0.92);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    0 20px 38px rgba(20, 184, 166, 0.16);
}

.dark .trust-link,
.dark .primary-cta {
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.16), rgba(37, 99, 235, 0.12)),
    rgba(15, 23, 42, 0.68);
  color: #99f6e4;
}

.home-footer {
  position: relative;
  z-index: 5;
  padding: 18px 24px 34px;
}

.footer-inner {
  display: flex;
  max-width: 1180px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin: 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.48);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.52), rgba(255, 255, 255, 0.28)),
    rgba(255, 255, 255, 0.34);
  padding: 14px 16px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.62),
    0 16px 44px rgba(15, 23, 42, 0.05);
  backdrop-filter: blur(18px) saturate(1.1);
  -webkit-backdrop-filter: blur(18px) saturate(1.1);
}

.dark .footer-inner {
  border-color: rgba(255, 255, 255, 0.09);
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.26), rgba(2, 6, 23, 0.18)),
    rgba(15, 23, 42, 0.34);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    0 16px 44px rgba(0, 0, 0, 0.2);
}

.footer-inner p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.footer-links a {
  color: var(--muted);
  font-size: 13px;
  transition: color 0.2s ease;
}

.footer-links a:hover {
  color: var(--ink);
}

@keyframes word-rise {
  0% {
    opacity: 0;
    filter: blur(9px);
    transform: translateY(22px) scale(0.97);
  }
  100% {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0) scale(1);
  }
}

@keyframes shine-pass {
  0%,
  58% {
    transform: translateX(-120%);
  }
  74%,
  100% {
    transform: translateX(120%);
  }
}

@keyframes border-sweep {
  0% {
    background-position:
      210% 0,
      100% 210%,
      -110% 100%,
      0 -110%,
      50% 50%;
  }
  18% {
    background-position:
      120% 0,
      100% 132%,
      -38% 100%,
      0 -46%,
      50% 50%;
  }
  42% {
    background-position:
      12% 0,
      100% 44%,
      62% 100%,
      0 32%,
      50% 50%;
  }
  68% {
    background-position:
      -82% 0,
      100% -42%,
      154% 100%,
      0 116%,
      50% 50%;
  }
  100% {
    background-position:
      -210% 0,
      100% -110%,
      250% 100%,
      0 210%,
      50% 50%;
  }
}

@keyframes outline-shine {
  0% {
    background-position: 180% 0;
  }
  100% {
    background-position: -180% 0;
  }
}

@keyframes shared-border-flow {
  0% {
    background-position:
      180% 0,
      -80% 100%,
      0 180%,
      100% -80%;
  }
  36% {
    background-position:
      54% 0,
      48% 100%,
      0 66%,
      100% 42%;
  }
  68% {
    background-position:
      -42% 0,
      142% 100%,
      0 -36%,
      100% 132%;
  }
  100% {
    background-position:
      -180% 0,
      260% 100%,
      0 -180%,
      100% 260%;
  }
}

@keyframes orbit-breathe {
  0%,
  100% {
    opacity: 0.62;
    transform: scale(0.98);
  }
  50% {
    opacity: 1;
    transform: scale(1.04);
  }
}

@keyframes model-float {
  0%,
  100% {
    margin-top: 0;
  }
  50% {
    margin-top: -8px;
  }
}

@keyframes spark-pop {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.2);
  }
  36% {
    opacity: 1;
    transform: scale(1);
  }
  62% {
    opacity: 0.35;
    transform: scale(1.8);
  }
}

@keyframes bar-rise {
  0%,
  100% {
    transform: scaleY(0.9);
  }
  50% {
    transform: scaleY(1.06);
  }
}

@keyframes route-glow {
  0%,
  100% {
    opacity: 0.38;
    transform: translateX(-4px);
  }
  50% {
    opacity: 1;
    transform: translateX(4px);
  }
}

@keyframes badge-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 rgba(20, 184, 166, 0);
    transform: translateY(0);
  }
  50% {
    box-shadow: 0 14px 30px rgba(20, 184, 166, 0.16);
    transform: translateY(-3px);
  }
}

@keyframes point-ping {
  0%,
  100% {
    opacity: 0.42;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.28);
  }
}

@keyframes partner-marquee {
  to {
    transform: translateX(-50%);
  }
}

@keyframes beam-run {
  from {
    left: 0;
    opacity: 0;
  }
  18%,
  76% {
    opacity: 1;
  }
  to {
    left: 100%;
    opacity: 0;
  }
}

@keyframes terminal-scan {
  0% {
    transform: translateY(-58%);
  }
  100% {
    transform: translateY(58%);
  }
}

@keyframes terminal-line-in {
  0% {
    opacity: 0;
    filter: blur(4px);
    transform: translateY(8px);
  }
  100% {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
  }
}

@keyframes terminal-cursor {
  0%,
  48% {
    opacity: 1;
  }
  49%,
  100% {
    opacity: 0;
  }
}

@keyframes ticket-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

/* Integrated glass pass: keep the page luminous without visible stitched borders. */
.aurora-card,
.spotlight-card,
.hero-metrics div,
.flow-step,
.partner-item,
.model-strip > span,
.trust-card,
.footer-inner,
.primary-cta,
.secondary-cta,
.trust-link,
.login-pill,
.floating-ticket {
  border: 0;
}

.aurora-card {
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.36), transparent 36%),
    radial-gradient(circle at 94% 12%, color-mix(in srgb, var(--feature-tone) 9%, transparent), transparent 38%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.055)),
    rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.46),
    inset 0 -1px 0 rgba(15, 23, 42, 0.018),
    0 24px 70px rgba(15, 23, 42, 0.055);
  backdrop-filter: blur(24px) saturate(1.16);
  -webkit-backdrop-filter: blur(24px) saturate(1.16);
}

.dark .aurora-card {
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.045), transparent 36%),
    radial-gradient(circle at 94% 12%, color-mix(in srgb, var(--feature-tone) 11%, transparent), transparent 38%),
    linear-gradient(180deg, rgba(30, 41, 59, 0.09), rgba(2, 6, 23, 0.025)),
    rgba(8, 13, 24, 0.14);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1),
    0 24px 74px rgba(0, 0, 0, 0.2);
}

.aurora-card::before,
.aurora-card::after,
.flow-step::before {
  opacity: 0;
}

.aurora-card:hover {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78),
    0 28px 76px rgba(15, 23, 42, 0.1),
    0 18px 44px color-mix(in srgb, var(--feature-tone) 11%, transparent);
}

.dark .aurora-card:hover {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 28px 78px rgba(0, 0, 0, 0.3),
    0 18px 44px color-mix(in srgb, var(--feature-tone) 12%, transparent);
}

.feature-card:hover,
.feature-mosaic.is-mosaic-active .feature-card,
.feature-mosaic.is-mosaic-active .feature-card:hover,
.partner-item:hover,
.flow-step:hover {
  border: 0;
}

.feature-card:hover {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.76),
    0 28px 68px rgba(15, 23, 42, 0.11),
    0 18px 48px color-mix(in srgb, var(--feature-tone) 10%, transparent);
}

.feature-mosaic::after {
  opacity: 0 !important;
}

.feature-visual {
  border: 0;
  background:
    radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--feature-tone) 14%, transparent), transparent 60%),
    radial-gradient(circle at 28% 10%, rgba(255, 255, 255, 0.54), transparent 50%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0.08)),
    rgba(255, 255, 255, 0.18);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.46),
    inset 0 -26px 56px rgba(15, 23, 42, 0.025);
  backdrop-filter: blur(20px) saturate(1.12);
  -webkit-backdrop-filter: blur(20px) saturate(1.12);
}

.dark .feature-visual {
  background:
    radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--feature-tone) 18%, transparent), transparent 60%),
    linear-gradient(180deg, rgba(30, 41, 59, 0.22), rgba(2, 6, 23, 0.08)),
    rgba(15, 23, 42, 0.18);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.055),
    inset 0 -28px 60px rgba(0, 0, 0, 0.1);
}

.model-aggregation::before,
.model-aggregation::after,
.global-visual::before {
  border: 0;
  background:
    radial-gradient(ellipse at 50% 50%, transparent 42%, color-mix(in srgb, var(--feature-tone) 11%, transparent) 58%, transparent 72%);
  box-shadow: 0 0 34px color-mix(in srgb, var(--feature-tone) 8%, transparent);
  opacity: 0.78;
}

.model-aggregation::after {
  opacity: 0.58;
}

.model-node,
.guard-visual span,
.partner-logo,
.provider-mark,
.status-row,
.route-map,
.route-status,
.terminal-strip,
.mini-code-card {
  border: 0;
}

.model-node {
  background:
    radial-gradient(circle at 30% 18%, rgba(255, 255, 255, 0.54), transparent 46%),
    color-mix(in srgb, var(--model-color) 8%, rgba(255, 255, 255, 0.58));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.62),
    0 14px 32px color-mix(in srgb, var(--model-color) 11%, rgba(15, 23, 42, 0.06));
  backdrop-filter: blur(18px) saturate(1.12);
  -webkit-backdrop-filter: blur(18px) saturate(1.12);
}

.dark .model-node {
  background:
    radial-gradient(circle at 30% 18%, color-mix(in srgb, var(--model-color) 18%, transparent), transparent 48%),
    rgba(15, 23, 42, 0.44);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 14px 32px rgba(0, 0, 0, 0.18);
}

.mini-code-card {
  background:
    radial-gradient(circle at 18% 0%, rgba(94, 234, 212, 0.12), transparent 40%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.72), rgba(8, 13, 24, 0.56));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 18px 42px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(18px) saturate(1.16);
  -webkit-backdrop-filter: blur(18px) saturate(1.16);
}

.billing-visual span {
  background:
    linear-gradient(180deg, rgba(125, 211, 252, 0.72), rgba(20, 184, 166, 0.68));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.26),
    0 12px 28px rgba(14, 165, 233, 0.1);
}

.billing-visual span:nth-child(3n) {
  background: linear-gradient(180deg, rgba(147, 197, 253, 0.68), rgba(45, 212, 191, 0.62));
}

.guard-visual span {
  background:
    radial-gradient(circle at 32% 18%, rgba(255, 255, 255, 0.34), transparent 52%),
    color-mix(in srgb, var(--guard-color) 9%, rgba(255, 255, 255, 0.2));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.38),
    0 12px 26px color-mix(in srgb, var(--guard-color) 8%, transparent);
  backdrop-filter: blur(16px) saturate(1.1);
  -webkit-backdrop-filter: blur(16px) saturate(1.1);
}

.dark .guard-visual span {
  background:
    radial-gradient(circle at 32% 18%, color-mix(in srgb, var(--guard-color) 14%, transparent), transparent 52%),
    rgba(15, 23, 42, 0.2);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.055),
    0 12px 26px rgba(0, 0, 0, 0.12);
}

.global-visual {
  background-image:
    radial-gradient(circle, color-mix(in srgb, var(--feature-tone) 22%, transparent) 1px, transparent 1px);
  background-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    inset 0 -24px 48px rgba(15, 23, 42, 0.025);
}

.route-map,
.route-status,
.terminal-strip {
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.34), rgba(2, 6, 23, 0.2)),
    rgba(2, 6, 23, 0.2);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.055);
}

.status-row {
  background: rgba(255, 255, 255, 0.045);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.045),
    0 10px 24px rgba(0, 0, 0, 0.1);
}

.map-layers {
  background-color: rgba(1, 8, 20, 0.46);
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.06) 1px, transparent 1px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.045),
    inset 0 -40px 70px rgba(0, 0, 0, 0.1);
}

.map-layers.is-matrix-active {
  background-color: rgba(1, 8, 20, 0.5);
  box-shadow:
    inset 0 0 48px rgba(20, 184, 166, 0.1),
    0 0 42px rgba(20, 184, 166, 0.08);
}

.matrix-cell {
  border-right: 0;
  border-bottom: 0;
}

.map-layers.is-matrix-active .matrix-cell {
  border: 0;
  box-shadow: 0 0 calc(var(--cell-intensity) * 18px) rgb(20 184 166 / calc(var(--cell-intensity) * 0.22));
}

.hub:not(.brand-core-node) {
  border: 0;
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.16), transparent 42%),
    rgba(15, 23, 42, 0.72);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 12px 28px rgba(15, 23, 42, 0.16);
}

.flow-step,
.hero-metrics div,
.partner-item,
.model-strip > span,
.footer-inner {
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.28), transparent 38%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.08)),
    rgba(255, 255, 255, 0.14);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.52),
    0 16px 42px rgba(15, 23, 42, 0.045);
  backdrop-filter: blur(22px) saturate(1.16);
  -webkit-backdrop-filter: blur(22px) saturate(1.16);
}

.dark .flow-step,
.dark .hero-metrics div,
.dark .partner-item,
.dark .model-strip > span,
.dark .footer-inner {
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.12), rgba(2, 6, 23, 0.04)),
    rgba(15, 23, 42, 0.14);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.055),
    0 16px 42px rgba(0, 0, 0, 0.15);
}

.flow-step:hover,
.partner-item:hover,
.model-strip > span:hover {
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.34), transparent 38%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.12)),
    rgba(255, 255, 255, 0.18);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 20px 48px rgba(15, 23, 42, 0.075);
}

.dark .flow-step:hover,
.dark .partner-item:hover,
.dark .model-strip > span:hover {
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.16), rgba(2, 6, 23, 0.08)),
    rgba(15, 23, 42, 0.2);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.075),
    0 20px 48px rgba(0, 0, 0, 0.2);
}

.partner-logo {
  background:
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.58), transparent 48%),
    rgba(255, 255, 255, 0.28);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.58),
    0 12px 28px rgba(15, 23, 42, 0.045);
}

.dark .partner-logo {
  background:
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.09), transparent 48%),
    rgba(255, 255, 255, 0.06);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 12px 28px rgba(0, 0, 0, 0.14);
}

.provider-mark {
  background: color-mix(in srgb, var(--provider-color) 7%, rgba(255, 255, 255, 0.22));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.dark .provider-mark {
  background: color-mix(in srgb, var(--provider-color) 8%, rgba(255, 255, 255, 0.055));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.045);
}

/* Inner content sits on the same glass surface instead of becoming nested panels. */
.feature-card-head span,
.feature-icon,
.feature-visual,
.mini-code-card,
.route-map,
.route-status,
.terminal-strip,
.status-row,
.hub:not(.brand-core-node),
.model-node,
.guard-visual span,
.partner-logo,
.partner-item em,
.model-strip > span,
.provider-mark {
  border: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.feature-visual {
  overflow: visible;
}

.feature-visual::before {
  content: '';
  pointer-events: none;
  position: absolute;
  inset: -18px;
  z-index: -1;
  background:
    radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--feature-tone) 14%, transparent), transparent 58%),
    radial-gradient(circle at 28% 12%, rgba(255, 255, 255, 0.28), transparent 46%);
  filter: blur(10px);
  opacity: 0.86;
}

.dark .feature-visual::before {
  background:
    radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--feature-tone) 18%, transparent), transparent 58%),
    radial-gradient(circle at 28% 12%, rgba(255, 255, 255, 0.055), transparent 46%);
  opacity: 0.9;
}

.feature-icon {
  width: 44px;
  height: 44px;
  color: color-mix(in srgb, var(--feature-tone) 76%, #0f172a);
  filter: drop-shadow(0 12px 18px color-mix(in srgb, var(--feature-tone) 12%, transparent));
}

.dark .feature-icon {
  color: color-mix(in srgb, var(--feature-tone) 78%, #e2e8f0);
  filter: drop-shadow(0 12px 18px color-mix(in srgb, var(--feature-tone) 14%, transparent));
}

.feature-card-head span,
.partner-item em {
  padding-left: 0;
  padding-right: 0;
}

.feature-card-head span {
  color: color-mix(in srgb, var(--feature-tone) 70%, #334155);
}

.dark .feature-card-head span {
  color: color-mix(in srgb, var(--feature-tone) 78%, #cbd5e1);
}

.mini-code-card {
  color: #334155;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.28);
}

.dark .mini-code-card {
  color: #cbd5e1;
  text-shadow: none;
}

.mini-code-card p {
  color: #2563eb;
}

.dark .mini-code-card p {
  color: #93c5fd;
}

.mini-code-card strong {
  color: #0f766e;
}

.dark .mini-code-card strong {
  color: #86efac;
}

.route-map,
.route-status,
.terminal-strip {
  background: transparent;
}

.terminal-strip.hacker-terminal {
  background:
    radial-gradient(circle at 14% 42%, rgba(45, 212, 191, 0.12), transparent 38%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(2, 6, 23, 0.03));
}

.map-layers {
  background-color: transparent;
  box-shadow: none;
}

.map-layers.is-matrix-active {
  background-color: transparent;
  box-shadow: none;
}

.status-row {
  padding-left: 0;
  padding-right: 0;
}

.hub:not(.brand-core-node),
.model-node,
.guard-visual span,
.partner-logo,
.provider-mark {
  filter: drop-shadow(0 12px 20px rgba(15, 23, 42, 0.08));
}

.dark .hub:not(.brand-core-node),
.dark .model-node,
.dark .guard-visual span,
.dark .partner-logo,
.dark .provider-mark {
  filter: drop-shadow(0 12px 20px rgba(0, 0, 0, 0.18));
}

.guard-visual span {
  min-height: 48px;
}

.partner-logo {
  width: 54px;
  height: 54px;
}

.partner-item:hover .partner-logo {
  box-shadow: none;
}

.model-strip > span {
  padding-left: 8px;
  padding-right: 8px;
}

.feature-card,
.flow-panel,
.trust-card {
  background:
    radial-gradient(circle at var(--card-x, 50%) var(--card-y, 42%), color-mix(in srgb, var(--feature-tone, #14b8a6) 8%, transparent), transparent 42%),
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.26), transparent 36%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.035)),
    rgba(255, 255, 255, 0.085);
}

.dark .feature-card,
.dark .flow-panel,
.dark .trust-card {
  background:
    radial-gradient(circle at var(--card-x, 50%) var(--card-y, 42%), color-mix(in srgb, var(--feature-tone, #14b8a6) 10%, transparent), transparent 42%),
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.035), transparent 36%),
    linear-gradient(180deg, rgba(30, 41, 59, 0.075), rgba(2, 6, 23, 0.018)),
    rgba(8, 13, 24, 0.1);
}

.feature-card::after,
.flow-panel::after,
.trust-card::after {
  content: '';
  pointer-events: none;
  position: absolute;
  inset: -26%;
  z-index: 0;
  padding: 0;
  border-radius: 999px;
  background:
    radial-gradient(circle at 50% 48%, color-mix(in srgb, var(--feature-tone, #14b8a6) 13%, transparent), transparent 44%),
    radial-gradient(circle at 68% 28%, rgba(37, 99, 235, 0.08), transparent 34%);
  filter: blur(22px);
  opacity: 0.72;
  transform: translate3d(0, 0, 0);
  -webkit-mask: none;
  mask: none;
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
}

.feature-card:hover::after,
.flow-panel:hover::after,
.trust-card:hover::after {
  opacity: 0.95;
  transform: scale(1.04);
}

.flow-panel > *,
.trust-card > *,
.partner-item > * {
  position: relative;
  z-index: 1;
}

.hero-metrics div,
.flow-step,
.partner-item,
.model-strip > span {
  border: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.hero-metrics div {
  padding: 10px 0;
}

.hero-metrics dd {
  text-shadow: 0 8px 22px rgba(20, 184, 166, 0.16);
}

.flow-steps {
  gap: 18px;
}

.flow-steps::before {
  left: 22px;
  background: linear-gradient(transparent, rgba(20, 184, 166, 0.28), rgba(37, 99, 235, 0.18), transparent);
  filter: blur(0.2px);
}

.flow-step {
  overflow: visible;
  padding: 3px 0;
}

.flow-step::after {
  content: '';
  pointer-events: none;
  position: absolute;
  inset: -10px -14px;
  z-index: 0;
  border-radius: 999px;
  background: radial-gradient(circle at 25% 50%, rgba(20, 184, 166, 0.11), transparent 58%);
  filter: blur(12px);
  opacity: 0;
  transition:
    opacity 0.28s ease,
    transform 0.28s ease;
}

.flow-step:hover {
  transform: translateX(6px);
}

.flow-step:hover::after {
  opacity: 0.7;
  transform: translateX(4px) scaleX(0.82);
}

.step-index {
  color: rgba(15, 118, 110, 0.58);
  text-shadow: 0 10px 22px rgba(20, 184, 166, 0.18);
}

.dark .step-index {
  color: rgba(153, 246, 228, 0.58);
}

.feature-icon,
.model-node,
.guard-visual span,
.partner-logo,
.provider-mark,
.hub:not(.brand-core-node) {
  background: transparent;
  box-shadow: none;
}

.feature-icon svg,
.guard-visual span svg,
.provider-mark :deep(.brand-icon),
.partner-logo :deep(.brand-icon),
.model-node :deep(.brand-icon),
.hub :deep(.brand-icon) {
  filter: drop-shadow(0 12px 22px color-mix(in srgb, var(--feature-tone, #14b8a6) 16%, transparent));
}

.model-aggregation::before,
.model-aggregation::after {
  inset: 0;
  border-radius: 999px;
  background:
    radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--feature-tone) 14%, transparent), transparent 38%),
    conic-gradient(from 120deg, transparent, color-mix(in srgb, var(--feature-tone) 12%, transparent), transparent 34%, rgba(37, 99, 235, 0.08), transparent 68%);
  filter: blur(24px);
  opacity: 0.42;
}

.model-aggregation::after {
  inset: 42px;
  opacity: 0.34;
  animation-delay: 1s;
}

.model-node {
  filter:
    drop-shadow(0 18px 24px color-mix(in srgb, var(--model-color) 18%, transparent))
    drop-shadow(0 0 24px color-mix(in srgb, var(--model-color) 16%, transparent));
  opacity: 0.98;
}

.mini-code-card {
  padding: 8px 0;
}

.mini-code-card span,
.mini-code-card p,
.mini-code-card strong {
  display: block;
}

.mini-code-card span::before,
.mini-code-card p::before,
.mini-code-card strong::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 9px;
  border-radius: 999px;
  background: currentColor;
  box-shadow: 0 0 14px currentColor;
  opacity: 0.42;
  vertical-align: 1px;
}

.global-visual {
  background-image: none;
  background-color: transparent;
  box-shadow: none;
}

.global-visual::before {
  inset: -18px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 50% 52%, rgba(20, 184, 166, 0.16), transparent 44%),
    radial-gradient(circle at 68% 28%, rgba(37, 99, 235, 0.12), transparent 34%);
  filter: blur(12px);
  opacity: 0.86;
}

.partner-item {
  overflow: visible;
}

.partner-item::after {
  content: '';
  pointer-events: none;
  position: absolute;
  inset: 10px 0 18px;
  z-index: 0;
  border-radius: 999px;
  background: radial-gradient(circle at 50% 32%, color-mix(in srgb, var(--partner-color) 14%, transparent), transparent 62%);
  filter: blur(16px);
  opacity: 0;
  transition:
    opacity 0.42s ease,
    transform 0.42s ease;
}

.partner-item:hover,
.dark .partner-item:hover {
  border: 0;
  background: transparent;
  box-shadow: none;
}

.partner-item:hover::after {
  opacity: 1;
  transform: scale(1.08);
}

.partner-logo,
.partner-item.is-image-icon .partner-logo,
.partner-item.is-image-icon:hover .partner-logo,
.dark .partner-item.is-image-icon .partner-logo {
  border: 0;
  background: transparent;
  box-shadow: none;
}

.partner-item:hover em,
.dark .partner-item:hover em {
  background: transparent;
}

.model-strip {
  gap: 18px;
}

.model-strip > span:hover,
.dark .model-strip > span:hover {
  border: 0;
  background: transparent;
  box-shadow: none;
  transform: translateY(-3px);
}

.provider-mark {
  color: color-mix(in srgb, var(--provider-color) 74%, #334155);
}

.dark .provider-mark {
  color: color-mix(in srgb, var(--provider-color) 72%, #e2e8f0);
}

.dark .feature-card-head span,
.dark .feature-icon,
.dark .feature-visual,
.dark .mini-code-card,
.dark .route-map,
.dark .route-status,
.dark .terminal-strip,
.dark .status-row,
.dark .hub:not(.brand-core-node),
.dark .model-node,
.dark .guard-visual span,
.dark .partner-logo,
.dark .partner-item em,
.dark .model-strip > span,
.dark .provider-mark {
  border: 0;
  background: transparent;
  background-color: transparent;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.dark .feature-visual {
  overflow: visible;
}

.dark .terminal-strip.hacker-terminal {
  background:
    radial-gradient(circle at 14% 42%, rgba(45, 212, 191, 0.12), transparent 38%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.1), rgba(2, 6, 23, 0.04));
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

/* Keep the outer card frame and its aurora sweep; only inner visual blocks are frameless. */
.aurora-card,
.spotlight-card,
.feature-card,
.flow-panel,
.trust-card,
.partner-item,
.footer-inner {
  border: 1px solid color-mix(in srgb, var(--feature-tone, #14b8a6) 18%, rgba(255, 255, 255, 0.34));
}

.dark .aurora-card,
.dark .spotlight-card,
.dark .feature-card,
.dark .flow-panel,
.dark .trust-card,
.dark .partner-item,
.dark .footer-inner {
  border-color: color-mix(in srgb, var(--feature-tone, #14b8a6) 22%, rgba(255, 255, 255, 0.08));
}

.aurora-card::before {
  opacity: var(--beam-alpha);
}

.feature-card:hover,
.feature-mosaic.is-mosaic-active .feature-card:hover,
.partner-item:hover,
.dark .partner-item:hover {
  border: 1px solid color-mix(in srgb, var(--feature-tone, #14b8a6) 46%, rgba(255, 255, 255, 0.18));
}

.feature-mosaic.is-mosaic-active .feature-card {
  border-color: color-mix(in srgb, var(--feature-tone, #14b8a6) 22%, rgba(148, 163, 184, 0.16));
}

.feature-mosaic.is-mosaic-active::after {
  opacity: 0.88 !important;
}

/* Final homepage polish: stable geometry, original brand colors, and integrated flow rows. */
.feature-card,
.partner-item {
  box-sizing: border-box;
  border: 1px solid color-mix(in srgb, var(--feature-tone, #14b8a6) 18%, rgba(255, 255, 255, 0.34));
}

.feature-card {
  will-change: transform;
  contain: paint;
}

.feature-card:hover,
.feature-mosaic.is-mosaic-active .feature-card,
.feature-mosaic.is-mosaic-active .feature-card:hover,
.partner-item:hover,
.dark .partner-item:hover {
  border-style: solid;
  border-width: 1px;
}

.feature-mosaic.is-mosaic-active .feature-card:not(:hover) {
  --beam-alpha: 0;
  --beam-soft: 0;
  border-color: color-mix(in srgb, var(--feature-tone, #14b8a6) 18%, rgba(148, 163, 184, 0.16));
  transform: none;
}

.feature-card:hover,
.feature-mosaic.is-mosaic-active .feature-card:hover {
  border-color: color-mix(in srgb, var(--feature-tone, #14b8a6) 46%, rgba(255, 255, 255, 0.18));
}

.dark .feature-card,
.dark .partner-item {
  border-color: color-mix(in srgb, var(--feature-tone, #14b8a6) 22%, rgba(255, 255, 255, 0.08));
}

.feature-mosaic.is-mosaic-active::after {
  opacity: 0 !important;
}

.feature-mosaic.is-mosaic-active::before {
  opacity: 0;
}

.model-node {
  color: initial;
}

.model-node :deep(.brand-icon),
.model-node :deep(.model-icon) {
  color: initial;
  filter:
    drop-shadow(0 12px 20px rgba(15, 23, 42, 0.1))
    drop-shadow(0 0 18px color-mix(in srgb, var(--model-color) 13%, transparent));
}

.dark .model-node :deep(.brand-icon),
.dark .model-node :deep(.model-icon) {
  color: initial;
  filter:
    drop-shadow(0 14px 24px rgba(0, 0, 0, 0.2))
    drop-shadow(0 0 20px color-mix(in srgb, var(--model-color) 16%, transparent));
}

.flow-step,
.flow-step:hover,
.dark .flow-step,
.dark .flow-step:hover {
  border: 0;
  background: transparent;
  box-shadow: none;
  transform: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.flow-step::before,
.flow-step::after,
.flow-step:hover::before,
.flow-step:hover::after {
  content: none;
  display: none;
}

.flow-step svg {
  transition:
    color 0.24s ease,
    transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.24s ease;
}

.flow-step:hover svg {
  color: #14b8a6;
  filter: drop-shadow(0 10px 18px rgba(20, 184, 166, 0.2));
  transform: translateX(2px);
}

@media (max-width: 1040px) {
  .hero-section {
    grid-template-columns: 1fr;
    min-height: auto;
    padding-top: 58px;
  }

  .hero-copy {
    max-width: 760px;
    text-align: center;
    margin: 0 auto;
  }

  .hero-subtitle {
    margin-left: auto;
    margin-right: auto;
  }

  .hero-actions {
    justify-content: center;
  }

  .hero-visual {
    min-height: 440px;
  }

  .feature-mosaic {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: minmax(250px, auto);
  }

  .feature-card.is-featured,
  .feature-card:not(.is-featured) {
    grid-column: span 1;
  }

  .feature-card.feature-card-global {
    display: flex;
    min-height: 250px;
  }

  .feature-card.feature-card-global .feature-card-head,
  .feature-card.feature-card-global .feature-visual,
  .feature-card.feature-card-global h3,
  .feature-card.feature-card-global p {
    grid-column: auto;
    grid-row: auto;
  }

  .feature-card.feature-card-global .feature-visual {
    min-height: 160px;
    align-self: stretch;
    margin: 18px 0;
  }

  .feature-card.feature-card-global h3 {
    margin-top: auto;
  }

  .feature-card.is-featured {
    grid-row: span 1;
    min-height: 430px;
  }

  .feature-card.is-featured .feature-visual {
    min-height: 232px;
  }

  .model-aggregation {
    height: 220px;
  }

  .model-node {
    transform:
      translate(-50%, -50%)
      rotate(var(--node-angle))
      translateX(108px)
      rotate(calc(-1 * var(--node-angle)));
  }

  .flow-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .home-header {
    padding: 12px 12px 0;
  }

  .home-nav {
    gap: 10px;
    padding: 8px;
  }

  .brand-copy {
    display: none;
  }

  .nav-actions {
    gap: 4px;
  }

  .hero-section,
  .section-block {
    padding-left: 16px;
    padding-right: 16px;
  }

  .capability-showcase {
    padding-top: 86px;
  }

  .brand-echo {
    width: calc(100% - 24px);
    top: 42px;
  }

  .hero-title {
    font-size: 42px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .hero-metrics {
    grid-template-columns: 1fr;
  }

  .hero-visual {
    min-height: 400px;
  }

  .route-cockpit {
    transform: none;
  }

  .route-cockpit:hover {
    transform: translateY(-4px);
  }

  .cockpit-grid {
    grid-template-columns: 1fr;
  }

  .map-layers {
    height: 220px;
  }

  .floating-ticket {
    display: none;
  }

  .feature-mosaic {
    grid-template-columns: 1fr;
  }

  .feature-card,
  .feature-card.is-featured {
    min-height: 0;
  }

  .feature-card.is-featured .feature-visual,
  .feature-visual {
    min-height: 190px;
  }

  .model-node {
    width: 52px;
    height: 52px;
    transform:
      translate(-50%, -50%)
      rotate(var(--node-angle))
      translateX(104px)
      rotate(calc(-1 * var(--node-angle)));
  }

  .model-core {
    width: 72px;
    height: 72px;
  }

  .partner-carousel {
    mask-image: none;
  }

  .partner-fade {
    display: none;
  }

  .section-heading h2,
  .flow-copy h2,
  .trust-card h2 {
    font-size: 28px;
  }

  .flow-step {
    grid-template-columns: 38px 32px 1fr;
  }

  .trust-card,
  .footer-inner {
    align-items: flex-start;
    flex-direction: column;
  }

  .trust-link {
    width: 100%;
  }
}

@media (max-width: 440px) {
  .icon-action {
    width: 32px;
    height: 32px;
  }

  .login-pill {
    min-height: 32px;
    padding: 6px 10px;
  }

  .hero-title {
    font-size: 36px;
  }

  .primary-cta,
  .secondary-cta {
    width: 100%;
  }

  .partner-item {
    width: 146px;
    min-height: 136px;
  }

  .partner-logo {
    width: 46px;
    height: 46px;
  }

  .model-strip > span {
    width: 100%;
    justify-content: flex-start;
  }

  .provider-copy {
    margin-left: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand-echo {
    transform: translate3d(-50%, 0, 0) !important;
  }

  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
