import { describe, it, expect } from 'vitest'
import { detectAiBot, isAiBot, AI_BOTS } from '../src/bots'

describe('detectAiBot', () => {
  it('detects GPTBot', () => {
    const bot = detectAiBot('Mozilla/5.0 AppleWebKit/537.36 (compatible; GPTBot/1.0; +https://openai.com/gptbot)')
    expect(bot).not.toBeNull()
    expect(bot!.name).toBe('GPTBot')
    expect(bot!.company).toBe('OpenAI')
  })

  it('detects ClaudeBot', () => {
    const bot = detectAiBot('ClaudeBot/1.0')
    expect(bot).not.toBeNull()
    expect(bot!.name).toBe('ClaudeBot')
    expect(bot!.company).toBe('Anthropic')
  })

  it('detects PerplexityBot', () => {
    const bot = detectAiBot('Mozilla/5.0 PerplexityBot/1.0')
    expect(bot).not.toBeNull()
    expect(bot!.name).toBe('PerplexityBot')
  })

  it('detects Bytespider', () => {
    const bot = detectAiBot('Bytespider; spider-feedback@bytedance.com')
    expect(bot).not.toBeNull()
    expect(bot!.company).toBe('ByteDance')
  })

  it('returns null for regular browsers', () => {
    expect(detectAiBot('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')).toBeNull()
    expect(detectAiBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Gecko/20100101 Firefox/120.0')).toBeNull()
  })

  it('returns null for Googlebot (not AI training)', () => {
    expect(detectAiBot('Googlebot/2.1 (+http://www.google.com/bot.html)')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(detectAiBot('')).toBeNull()
  })

  it('returns null for undefined-like input', () => {
    expect(detectAiBot(undefined as unknown as string)).toBeNull()
  })
})

describe('isAiBot', () => {
  it('returns true for known bots', () => {
    expect(isAiBot('GPTBot/1.0')).toBe(true)
    expect(isAiBot('ClaudeBot/1.0')).toBe(true)
  })

  it('returns false for regular browsers', () => {
    expect(isAiBot('Mozilla/5.0 Chrome/120.0')).toBe(false)
  })
})

describe('AI_BOTS registry', () => {
  it('has at least 12 entries', () => {
    expect(AI_BOTS.length).toBeGreaterThanOrEqual(12)
  })

  it('all entries have required fields', () => {
    for (const bot of AI_BOTS) {
      expect(bot.name).toBeTruthy()
      expect(bot.userAgentPattern).toBeTruthy()
      expect(bot.company).toBeTruthy()
      expect(['training', 'search', 'both']).toContain(bot.purpose)
    }
  })
})
