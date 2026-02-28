import { describe, it, expect } from 'vitest'
import { redactHtml } from '../src/redactor'

describe('redactHtml', () => {
  it('redacts elements with data-ward="redact"', () => {
    const html = `
      <html><body>
        <h1>Impressum</h1>
        <div data-ward="redact" data-ward-reason="pii">
          <p>Max Mustermann</p>
          <p>Musterstrasse 1, 12345 Berlin</p>
        </div>
      </body></html>
    `
    const result = redactHtml(html)

    expect(result.redactedCount).toBe(1)
    expect(result.reasons).toEqual(['pii'])
    expect(result.html).not.toContain('Max Mustermann')
    expect(result.html).not.toContain('Musterstrasse')
    expect(result.html).toContain('Content redacted per WARD policy')
    expect(result.html).toContain('Reason: pii')
    // Element shell preserved
    expect(result.html).toContain('data-ward="redact"')
  })

  it('handles multiple redacted blocks', () => {
    const html = `
      <html><body>
        <div data-ward="redact" data-ward-reason="pii"><p>Name</p></div>
        <div data-ward="redact" data-ward-reason="business"><p>Secret</p></div>
        <div data-ward="redact" data-ward-reason="medical"><p>Health</p></div>
      </body></html>
    `
    const result = redactHtml(html)

    expect(result.redactedCount).toBe(3)
    expect(result.reasons).toEqual(['pii', 'business', 'medical'])
    expect(result.html).not.toContain('Name')
    expect(result.html).not.toContain('Secret')
    expect(result.html).not.toContain('Health')
  })

  it('leaves non-redact ward attributes untouched', () => {
    const html = `
      <html><body>
        <div data-ward="no-train">Protected but visible content</div>
      </body></html>
    `
    const result = redactHtml(html)

    expect(result.redactedCount).toBe(0)
    expect(result.html).toContain('Protected but visible content')
  })

  it('handles HTML with no ward attributes', () => {
    const html = '<html><body><p>Normal content</p></body></html>'
    const result = redactHtml(html)

    expect(result.redactedCount).toBe(0)
    expect(result.reasons).toEqual([])
    expect(result.html).toContain('Normal content')
  })

  it('uses custom message', () => {
    const html = '<div data-ward="redact" data-ward-reason="pii"><p>Data</p></div>'
    const result = redactHtml(html, { message: 'Removed by WARD' })

    expect(result.html).toContain('Removed by WARD')
  })

  it('includes policy URL when provided', () => {
    const html = '<div data-ward="redact" data-ward-reason="pii"><p>Data</p></div>'
    const result = redactHtml(html, {
      policyUrl: 'https://example.com/.well-known/ward.json',
    })

    expect(result.html).toContain('Policy: https://example.com/.well-known/ward.json')
  })

  it('handles missing data-ward-reason gracefully', () => {
    const html = '<div data-ward="redact"><p>No reason given</p></div>'
    const result = redactHtml(html)

    expect(result.redactedCount).toBe(1)
    expect(result.reasons).toEqual(['unspecified'])
    expect(result.html).toContain('Reason: unspecified')
  })

  it('handles nested redacted elements', () => {
    const html = `
      <div data-ward="redact" data-ward-reason="pii">
        <div data-ward="redact" data-ward-reason="pii">
          <p>Deeply nested</p>
        </div>
      </div>
    `
    const result = redactHtml(html)

    // Outer redaction removes inner content including nested redact
    expect(result.html).not.toContain('Deeply nested')
    expect(result.redactedCount).toBeGreaterThanOrEqual(1)
  })
})
