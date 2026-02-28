// Bot detection
export { detectAiBot, isAiBot, AI_BOTS } from './bots.js'

// Policy
export { parseWardPolicy, getPathRule, generateWardPolicy } from './policy.js'

// Redactor
export { redactHtml } from './redactor.js'

// Middleware
export { createWardMiddleware } from './middleware/nextjs.js'

// Types
export type {
  WardPolicy,
  WardDefaultRule,
  WardRule,
  BotInfo,
  RedactResult,
  RedactOptions,
  WardMiddlewareOptions,
} from './types.js'
