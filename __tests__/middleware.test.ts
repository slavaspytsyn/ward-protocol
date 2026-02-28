import { describe, it, expect, vi } from 'vitest'
import { createWardMiddleware } from '../src/middleware/nextjs'

describe('createWardMiddleware', () => {
  it('returns null for non-bot requests', async () => {
    const middleware = createWardMiddleware()
    const request = new Request('https://example.com/impressum', {
      headers: { 'user-agent': 'Mozilla/5.0 Chrome/120.0' },
    })

    const result = await middleware(request)
    expect(result).toBeNull()
  })

  it('returns null for excluded paths', async () => {
    const middleware = createWardMiddleware()
    const request = new Request('https://example.com/_next/static/chunk.js', {
      headers: { 'user-agent': 'GPTBot/1.0' },
    })

    const result = await middleware(request)
    expect(result).toBeNull()
  })

  it('returns null when path not in allowed paths list', async () => {
    const middleware = createWardMiddleware({ paths: ['/impressum', '/datenschutz'] })
    const request = new Request('https://example.com/blog', {
      headers: { 'user-agent': 'GPTBot/1.0' },
    })

    const result = await middleware(request)
    expect(result).toBeNull()
  })

  it('calls onBotDetected callback', async () => {
    const onBotDetected = vi.fn()
    const middleware = createWardMiddleware({ onBotDetected })

    // Mock fetch to return HTML
    const originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response('<html><body><p>Hello</p></body></html>', {
        headers: { 'content-type': 'text/html' },
      }),
    )

    const request = new Request('https://example.com/impressum', {
      headers: { 'user-agent': 'GPTBot/1.0' },
    })

    await middleware(request)

    expect(onBotDetected).toHaveBeenCalledTimes(1)
    expect(onBotDetected.mock.calls[0][0].name).toBe('GPTBot')

    globalThis.fetch = originalFetch
  })

  it('adds X-WARD headers to response', async () => {
    const middleware = createWardMiddleware()

    const originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response('<html><body><div data-ward="redact" data-ward-reason="pii"><p>PII</p></div></body></html>', {
        headers: { 'content-type': 'text/html' },
      }),
    )

    const request = new Request('https://example.com/impressum', {
      headers: { 'user-agent': 'ClaudeBot/1.0' },
    })

    const result = await middleware(request)

    expect(result).not.toBeNull()
    expect(result!.headers.get('X-WARD-Enforcement')).toBe('server')
    expect(result!.headers.get('X-WARD-Bot-Detected')).toBe('ClaudeBot')
    expect(result!.headers.get('X-WARD-Redacted-Blocks')).toBe('1')

    const html = await result!.text()
    expect(html).not.toContain('PII')
    expect(html).toContain('Content redacted per WARD policy')

    globalThis.fetch = originalFetch
  })

  it('passes through non-HTML responses with headers only', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response('{"data": "json"}', {
        headers: { 'content-type': 'application/json' },
      }),
    )

    const request = new Request('https://example.com/api/data', {
      headers: { 'user-agent': 'GPTBot/1.0' },
    })

    // api is excluded by default, use a custom path
    const middleware2 = createWardMiddleware({ excludePaths: [] })
    const result = await middleware2(request)

    expect(result).not.toBeNull()
    expect(result!.headers.get('X-WARD-Bot-Detected')).toBe('GPTBot')
    expect(result!.headers.get('X-WARD-Redacted-Blocks')).toBe('0')

    globalThis.fetch = originalFetch
  })
})
