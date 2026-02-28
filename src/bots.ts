import type { BotInfo } from './types.js'

/**
 * Registry of known AI crawlers/bots.
 * Sources: robots.txt documentation from OpenAI, Anthropic, Google, etc.
 */
export const AI_BOTS: BotInfo[] = [
  // OpenAI
  { name: 'GPTBot', userAgentPattern: 'GPTBot', company: 'OpenAI', purpose: 'training' },
  { name: 'ChatGPT-User', userAgentPattern: 'ChatGPT-User', company: 'OpenAI', purpose: 'search' },
  { name: 'OAI-SearchBot', userAgentPattern: 'OAI-SearchBot', company: 'OpenAI', purpose: 'search' },

  // Anthropic
  { name: 'ClaudeBot', userAgentPattern: 'ClaudeBot', company: 'Anthropic', purpose: 'training' },
  { name: 'Claude-Web', userAgentPattern: 'Claude-Web', company: 'Anthropic', purpose: 'search' },

  // Google
  { name: 'Google-Extended', userAgentPattern: 'Google-Extended', company: 'Google', purpose: 'training' },

  // ByteDance
  { name: 'Bytespider', userAgentPattern: 'Bytespider', company: 'ByteDance', purpose: 'training' },

  // Common Crawl
  { name: 'CCBot', userAgentPattern: 'CCBot', company: 'Common Crawl', purpose: 'training' },

  // Meta
  { name: 'FacebookBot', userAgentPattern: 'FacebookBot', company: 'Meta', purpose: 'training' },
  { name: 'Meta-ExternalAgent', userAgentPattern: 'Meta-ExternalAgent', company: 'Meta', purpose: 'training' },

  // Apple
  { name: 'Applebot-Extended', userAgentPattern: 'Applebot-Extended', company: 'Apple', purpose: 'training' },

  // Perplexity
  { name: 'PerplexityBot', userAgentPattern: 'PerplexityBot', company: 'Perplexity', purpose: 'both' },

  // Amazon
  { name: 'Amazonbot', userAgentPattern: 'Amazonbot', company: 'Amazon', purpose: 'both' },

  // Cohere
  { name: 'cohere-ai', userAgentPattern: 'cohere-ai', company: 'Cohere', purpose: 'training' },
]

/**
 * Detect if a User-Agent string belongs to a known AI bot.
 * Returns the matching BotInfo or null.
 */
export function detectAiBot(userAgent: string): BotInfo | null {
  if (!userAgent) return null

  for (const bot of AI_BOTS) {
    if (userAgent.includes(bot.userAgentPattern)) {
      return bot
    }
  }

  return null
}

/**
 * Quick check: is this User-Agent a known AI bot?
 */
export function isAiBot(userAgent: string): boolean {
  return detectAiBot(userAgent) !== null
}
