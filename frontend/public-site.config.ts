/**
 * Public site frontend-only configuration.
 *
 * 这个文件只管理前台页面的视觉、交互和静态展示数据，不会改动任何后端接口。
 * 后续如果要改成后台管理端配置，可以优先把这里的字段迁移成接口返回数据。
 *
 * 修改建议：
 * 1. 只改字段右侧的值，不要随意改字段名。
 * 2. 颜色建议使用 hex，例如 #14b8a6。
 * 3. 文案主体仍放在 src/i18n/locales/*.ts，这里主要控制结构、图标、颜色和开关。
 */

export type BackgroundRenderer = 'three' | 'canvas'
export type SupportMascotRenderer = 'builtin' | 'live2d' | 'off'

export type HomeIconName =
  | 'server'
  | 'shield'
  | 'chart'
  | 'dollar'
  | 'users'
  | 'bell'
  | 'key'
  | 'swap'
  | 'terminal'
  | 'creditCard'
  | 'globe'
  | 'lock'
  | 'bolt'
  | 'cpu'

export type BrandIconName =
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

export type TerminalTone = 'command' | 'trace' | 'ok'

export type TerminalSourceLine = {
  prompt: string
  text: string
  tone: TerminalTone
}

export type ConfiguredText =
  | {
      text: string
      i18nKey?: never
    }
  | {
      text?: never
      i18nKey: string
    }

type FeatureVisual = 'models' | 'api' | 'billing' | 'routing' | 'guard' | 'global'

type FeatureCardConfig = {
  titleKey: string
  descriptionKey: string
  eyebrowKey: string
  icon: HomeIconName
  visual: FeatureVisual
  color: string
  featured?: boolean
}

type ThreeBackgroundThemeTuning = {
  backgroundDepth: number
  auroraIntensity: number
  gridIntensity: number
  perspectiveGridIntensity: number
  pointerGlowIntensity: number
  particleOpacity: number
  particleSize: number
  vignetteStrength: number
}

type PublicSiteConfig = {
  background: {
    /**
     * 背景版本开关：
     * - three：当前 Three.js 高级背景，效果更强，后续可继续扩展 3D。
     * - canvas：之前的 Canvas 版本，方便快速回退对比。
     */
    renderer: BackgroundRenderer

    /**
     * Three.js 背景深浅配置。
     *
     * 这里只控制视觉强度，不会改变接口、路由或业务逻辑。
     * 所有数值建议从 0.6 到 1.4 之间微调：
     * - 1：保持当前默认效果。
     * - 小于 1：更淡、更轻、更不抢内容。
     * - 大于 1：更深、更明显、更有沉浸感。
     *
     * light / dark 分别对应浅色主题和深色主题，互不影响。
     */
    three: {
      light: ThreeBackgroundThemeTuning
      dark: ThreeBackgroundThemeTuning
    }
  }

  supportMascot: {
    /**
     * 右下角客服入口：
     * - builtin：当前内置轻量小人，懒加载，加载成功后只显示小人。
     * - live2d：真实 Live2D 版本，需要同时填写 live2dModelPath。
     * - off：关闭小人，始终使用原来的客服按钮。
     */
    renderer: SupportMascotRenderer

    /**
     * 真实 Live2D 模型入口，只有 renderer = 'live2d' 时生效。
     * 示例：/live2d/support/model.model3.json
     */
    live2dModelPath: string

    /**
     * 小人组件懒加载延迟。加载完成前会显示原来的客服按钮兜底。
     */
    loadDelayMs: number

    /**
     * 小人加载超时时间。超时或失败后保留原来的客服按钮，避免入口消失。
     */
    timeoutMs: number

    /**
     * 小人气泡首次出现延迟。加载成功后会先提示用户可以点击找客服。
     */
    speechInitialDelayMs: number

    /**
     * 小人闲置时轮播一句话的间隔。
     */
    speechIntervalMs: number

    /**
     * 每句话停留多久。
     */
    speechDisplayMs: number

    /**
     * 小人气泡文案。第一句建议保留为“点我找客服”的提示。
     * 可以直接写 { text: '...' }，也可以使用 { i18nKey: '...' } 走国际化。
     */
    speechMessages: ConfiguredText[]
  }

  home: {
    githubUrl: string
    brandEchoText: string
    pointerStyle: Record<'--pointer-x' | '--pointer-y', string>
    matrix: {
      cols: number
      rows: number
      activeRadius: number
      colDelayMs: number
      rowDelayMs: number
      maxDelayMs: number
    }
    terminalSourceLines: TerminalSourceLine[]
    heroMetrics: Array<{
      labelKey: string
      valueKey: string
    }>
    routeRows: Array<{
      nameKey: string
      value?: string
      valueKey?: string
      color: string
    }>
    featureCards: FeatureCardConfig[]
    modelNodes: Array<{
      name: string
      icon: BrandIconName
      color: string
    }>
    billingBars: number[]
    routeLanes: number[]
    guardBadges: Array<{
      nameKey: string
      icon: HomeIconName
      color: string
    }>
    globalPoints: Array<{
      id: number
      left: string
      top: string
      delay: string
    }>
    flowSteps: Array<{
      titleKey: string
      descriptionKey: string
      icon: HomeIconName
    }>
    partnerItems: Array<{
      name: string
      icon: BrandIconName
      type: string
      color: string
    }>
    modelHighlights: Array<{
      name: ConfiguredText
      icon: BrandIconName
      statusKey: string
      color: string
    }>
  }
}

export const publicSiteConfig: PublicSiteConfig = {
  background: {
    renderer: 'three',

    three: {
      /**
       * 浅色主题背景深浅。
       *
       * backgroundDepth：背景底色层次强度。调低会更接近纯浅底，调高会更显淡青/淡蓝层次。
       * auroraIntensity：背景柔光/雾光强度。调低更干净，调高更梦幻。
       * gridIntensity：普通网格和矩阵响应强度。调低网格更隐，调高科技感更强。
       * perspectiveGridIntensity：透视网格/空间深度线强度。调高会更有 3D 纵深。
       * pointerGlowIntensity：鼠标附近高亮和联动光感强度。调低更安静，调高交互更明显。
       * particleOpacity：粒子整体亮度。调低粒子更隐，调高粒子更清楚。
       * particleSize：粒子整体大小。调低更细腻，调高更有存在感。
       * vignetteStrength：边缘收暗/聚焦强度。调高中心更聚焦，边缘更有包裹感。
       */
      light: {
        backgroundDepth: 1,
        auroraIntensity: 1,
        gridIntensity: 1,
        perspectiveGridIntensity: 1,
        pointerGlowIntensity: 1,
        particleOpacity: 0.8,
        particleSize: 1,
        vignetteStrength: 1
      },

      /**
       * 深色主题背景深浅。
       *
       * 如果深色模式太亮：优先降低 auroraIntensity、particleOpacity、gridIntensity。
       * 如果深色模式太空：优先提高 particleOpacity、perspectiveGridIntensity。
       * 如果鼠标互动太弱：提高 pointerGlowIntensity。
       * 如果画面太散：提高 vignetteStrength。
       */
      dark: {
        backgroundDepth: 1,
        auroraIntensity: 1,
        gridIntensity: 1,
        perspectiveGridIntensity: 1,
        pointerGlowIntensity: 1,
        particleOpacity: 1.5,
        particleSize: 1,
        vignetteStrength: 1
      }
    }
  },

  supportMascot: {
    renderer: 'builtin',
    live2dModelPath: '',
    // renderer: 'live2d',
    // live2dModelPath: 'https://model.oml2d.com/HK416-1-normal/model.json',
    loadDelayMs: 450,
    timeoutMs: 3200,
    speechInitialDelayMs: 900,
    speechIntervalMs: 8200,
    speechDisplayMs: 5200,
    speechMessages: [
      { i18nKey: 'support.mascotMessages.contact' },
      { i18nKey: 'support.mascotMessages.compatibility' },
      { i18nKey: 'support.mascotMessages.routing' },
      { i18nKey: 'support.mascotMessages.billing' },
      { i18nKey: 'support.mascotMessages.guard' }
    ]
  },

  home: {
    githubUrl: 'https://github.com/Wei-Shaw/sub2api',
    brandEchoText: '121API',
    pointerStyle: {
      '--pointer-x': '50%',
      '--pointer-y': '42%'
    },
    matrix: {
      cols: 12,
      rows: 8,
      activeRadius: 3.8,
      colDelayMs: 19,
      rowDelayMs: 31,
      maxDelayMs: 190
    },
    terminalSourceLines: [
      { prompt: '$', text: '121 route --model claude-sonnet-4 --stream', tone: 'command' },
      { prompt: '>', text: 'normalize.messages(provider="openai")', tone: 'trace' },
      { prompt: '>', text: 'scorePools({ latency: 31, quota: "ok" })', tone: 'trace' },
      { prompt: '>', text: 'bindStickySession("user_8f2", "edge-sha")', tone: 'trace' },
      { prompt: '>', text: 'fallbackGraph: gpt-4o -> gemini-2.5-pro', tone: 'trace' },
      { prompt: '>', text: 'redact(apiKey) && audit.write(requestId)', tone: 'trace' },
      { prompt: '>', text: 'stream.delta({ tokens: 128, toolCalls: 2 })', tone: 'trace' },
      { prompt: '>', text: 'semanticCache.lookup(promptHash) = miss', tone: 'trace' },
      { prompt: '>', text: 'retryPolicy.backoff(max=2, jitter=42ms)', tone: 'trace' },
      { prompt: '>', text: 'usage.record({ input: 1840, output: 512 })', tone: 'trace' },
      { prompt: '>', text: 'cost.sync(currency="USD", precision=6)', tone: 'trace' },
      { prompt: '>', text: 'guardrails.scan(content) = pass', tone: 'trace' },
      { prompt: '>', text: 'emit.sse("[DONE]")', tone: 'trace' },
      { prompt: '200', text: 'routed via 121API edge in 31ms', tone: 'ok' }
    ],
    heroMetrics: [
      { labelKey: 'home.metrics.compatibility.label', valueKey: 'home.metrics.compatibility.value' },
      { labelKey: 'home.metrics.routing.label', valueKey: 'home.metrics.routing.value' },
      { labelKey: 'home.metrics.billing.label', valueKey: 'home.metrics.billing.value' }
    ],
    routeRows: [
      { nameKey: 'home.routeRows.claudePool', value: '31 ms', color: '#22c55e' },
      { nameKey: 'home.routeRows.gptRoute', valueKey: 'home.routeRows.ready', color: '#3b82f6' },
      { nameKey: 'home.routeRows.geminiLane', valueKey: 'home.routeRows.sync', color: '#22d3ee' }
    ],
    featureCards: [
      {
        titleKey: 'home.featureCards.models.title',
        descriptionKey: 'home.featureCards.models.description',
        eyebrowKey: 'home.featureCards.models.eyebrow',
        icon: 'cpu',
        visual: 'models',
        color: '#14b8a6',
        featured: true
      },
      {
        titleKey: 'home.featureCards.api.title',
        descriptionKey: 'home.featureCards.api.description',
        eyebrowKey: 'home.featureCards.api.eyebrow',
        icon: 'terminal',
        visual: 'api',
        color: '#2563eb'
      },
      {
        titleKey: 'home.featureCards.billing.title',
        descriptionKey: 'home.featureCards.billing.description',
        eyebrowKey: 'home.featureCards.billing.eyebrow',
        icon: 'dollar',
        visual: 'billing',
        color: '#0ea5e9'
      },
      {
        titleKey: 'home.featureCards.routing.title',
        descriptionKey: 'home.featureCards.routing.description',
        eyebrowKey: 'home.featureCards.routing.eyebrow',
        icon: 'swap',
        visual: 'routing',
        color: '#0ea5e9'
      },
      {
        titleKey: 'home.featureCards.guard.title',
        descriptionKey: 'home.featureCards.guard.description',
        eyebrowKey: 'home.featureCards.guard.eyebrow',
        icon: 'lock',
        visual: 'guard',
        color: '#10b981'
      },
      {
        titleKey: 'home.featureCards.global.title',
        descriptionKey: 'home.featureCards.global.description',
        eyebrowKey: 'home.featureCards.global.eyebrow',
        icon: 'globe',
        visual: 'global',
        color: '#38bdf8'
      }
    ],
    modelNodes: [
      { name: 'OpenAI', icon: 'openai', color: '#16a34a' },
      { name: 'Claude', icon: 'claude', color: '#14b8a6' },
      { name: 'Gemini', icon: 'gemini', color: '#2563eb' },
      { name: 'DeepSeek', icon: 'deepseek', color: '#0ea5e9' },
      { name: 'Grok', icon: 'grok', color: '#111827' },
      { name: 'Qwen', icon: 'qwen', color: '#7c3aed' }
    ],
    billingBars: [38, 68, 46, 82, 58, 92, 64],
    routeLanes: [1, 2, 3, 4],
    guardBadges: [
      { nameKey: 'home.guardBadges.key', icon: 'key', color: '#14b8a6' },
      { nameKey: 'home.guardBadges.permission', icon: 'shield', color: '#2563eb' },
      { nameKey: 'home.guardBadges.risk', icon: 'lock', color: '#10b981' },
      { nameKey: 'home.guardBadges.logs', icon: 'chart', color: '#0ea5e9' }
    ],
    globalPoints: [
      { id: 1, left: '18%', top: '36%', delay: '0s' },
      { id: 2, left: '34%', top: '52%', delay: '.2s' },
      { id: 3, left: '52%', top: '32%', delay: '.4s' },
      { id: 4, left: '66%', top: '58%', delay: '.6s' },
      { id: 5, left: '78%', top: '42%', delay: '.8s' }
    ],
    flowSteps: [
      {
        titleKey: 'home.flowSteps.accounts.title',
        descriptionKey: 'home.flowSteps.accounts.description',
        icon: 'server'
      },
      {
        titleKey: 'home.flowSteps.strategy.title',
        descriptionKey: 'home.flowSteps.strategy.description',
        icon: 'swap'
      },
      {
        titleKey: 'home.flowSteps.endpoint.title',
        descriptionKey: 'home.flowSteps.endpoint.description',
        icon: 'terminal'
      },
      {
        titleKey: 'home.flowSteps.observability.title',
        descriptionKey: 'home.flowSteps.observability.description',
        icon: 'chart'
      }
    ],
    partnerItems: [
      { name: 'OpenAI', icon: 'openai', type: 'LLM', color: '#16a34a' },
      { name: 'Claude', icon: 'claude', type: 'Assistant', color: '#14b8a6' },
      { name: 'Gemini', icon: 'gemini', type: 'Multimodal', color: '#2563eb' },
      { name: 'DeepSeek', icon: 'deepseek', type: 'Reasoning', color: '#0ea5e9' },
      { name: 'Grok', icon: 'grok', type: 'Realtime', color: '#111827' },
      { name: 'Qwen', icon: 'qwen', type: 'Coding', color: '#7c3aed' },
      { name: 'Cherry Studio', icon: 'cherry-studio', type: 'Client', color: '#ef4444' },
      { name: 'Codex', icon: 'codex', type: 'Agent', color: '#14b8a6' },
      { name: 'Claude Code', icon: 'claude-code', type: 'Terminal', color: '#22d3ee' },
      { name: 'Gemini CLI', icon: 'gemini-cli', type: 'Tooling', color: '#3b82f6' },
      { name: 'Antigravity', icon: 'antigravity', type: 'IDE', color: '#e11d48' },
      { name: '121Api', icon: 'gateway', type: 'Gateway', color: '#0f766e' }
    ],
    modelHighlights: [
      { name: { text: 'Claude' }, icon: 'claude', statusKey: 'home.modelStatus.supported', color: '#14b8a6' },
      { name: { text: 'GPT' }, icon: 'gpt', statusKey: 'home.modelStatus.supported', color: '#16a34a' },
      { name: { text: 'Gemini' }, icon: 'gemini', statusKey: 'home.modelStatus.supported', color: '#2563eb' },
      { name: { text: 'DeepSeek' }, icon: 'deepseek', statusKey: 'home.modelStatus.extensible', color: '#0ea5e9' },
      { name: { text: 'Qwen' }, icon: 'qwen', statusKey: 'home.modelStatus.extensible', color: '#7c3aed' },
      { name: { text: 'Antigravity' }, icon: 'antigravity', statusKey: 'home.modelStatus.supported', color: '#e11d48' },
      { name: { i18nKey: 'home.modelStatus.moreModels' }, icon: 'more', statusKey: 'home.modelStatus.continuing', color: '#64748b' }
    ]
  }
}
