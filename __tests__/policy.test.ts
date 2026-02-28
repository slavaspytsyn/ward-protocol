import { describe, it, expect } from 'vitest'
import { parseWardPolicy, getPathRule, generateWardPolicy } from '../src/policy'

const validPolicy = {
  version: '1.0',
  publisher: 'Test GmbH',
  enforcement: 'server',
  default: {
    indexing: true,
    training: false,
    summarization: true,
  },
  rules: [
    { path: '/blog/*', training: false, summarization: true },
    { path: '/impressum', training: false, summarization: false },
  ],
}

describe('parseWardPolicy', () => {
  it('parses valid policy', () => {
    const policy = parseWardPolicy(validPolicy)
    expect(policy.version).toBe('1.0')
    expect(policy.enforcement).toBe('server')
    expect(policy.default.training).toBe(false)
  })

  it('throws on null', () => {
    expect(() => parseWardPolicy(null)).toThrow('must be a JSON object')
  })

  it('throws on missing version', () => {
    expect(() => parseWardPolicy({ enforcement: 'server', default: {} })).toThrow('version')
  })

  it('throws on invalid enforcement', () => {
    expect(() => parseWardPolicy({ version: '1.0', enforcement: 'magic', default: {} })).toThrow('enforcement')
  })

  it('throws on missing default', () => {
    expect(() => parseWardPolicy({ version: '1.0', enforcement: 'server' })).toThrow('default')
  })

  it('throws on missing default.indexing', () => {
    expect(() =>
      parseWardPolicy({
        version: '1.0',
        enforcement: 'server',
        default: { training: false, summarization: true },
      }),
    ).toThrow('indexing')
  })

  it('throws on invalid rules (not array)', () => {
    expect(() =>
      parseWardPolicy({
        version: '1.0',
        enforcement: 'server',
        default: { indexing: true, training: false, summarization: true },
        rules: 'not-array',
      }),
    ).toThrow('rules must be an array')
  })

  it('throws on rule without path', () => {
    expect(() =>
      parseWardPolicy({
        version: '1.0',
        enforcement: 'server',
        default: { indexing: true, training: false, summarization: true },
        rules: [{ training: false }],
      }),
    ).toThrow('path')
  })

  it('accepts advisory enforcement', () => {
    const policy = parseWardPolicy({
      version: '1.0',
      enforcement: 'advisory',
      default: { indexing: true, training: false, summarization: true },
    })
    expect(policy.enforcement).toBe('advisory')
  })
})

describe('getPathRule', () => {
  const policy = parseWardPolicy(validPolicy)

  it('returns matching rule for exact path', () => {
    const rule = getPathRule(policy, '/impressum')
    expect(rule.summarization).toBe(false)
  })

  it('returns matching rule for wildcard path', () => {
    const rule = getPathRule(policy, '/blog/my-post')
    expect(rule.summarization).toBe(true)
    expect(rule.path).toBe('/blog/*')
  })

  it('returns default for unmatched path', () => {
    const rule = getPathRule(policy, '/about')
    expect(rule.indexing).toBe(true)
    expect(rule.training).toBe(false)
  })

  it('returns default when no rules defined', () => {
    const noRulesPolicy = parseWardPolicy({
      version: '1.0',
      enforcement: 'server',
      default: { indexing: true, training: false, summarization: true },
    })
    const rule = getPathRule(noRulesPolicy, '/anything')
    expect(rule.indexing).toBe(true)
  })

  it('prefers more specific rule', () => {
    const specificPolicy = parseWardPolicy({
      version: '1.0',
      enforcement: 'server',
      default: { indexing: true, training: false, summarization: true },
      rules: [
        { path: '/blog/*', summarization: true },
        { path: '/blog/private/*', summarization: false },
      ],
    })
    const rule = getPathRule(specificPolicy, '/blog/private/secret')
    expect(rule.summarization).toBe(false)
  })
})

describe('generateWardPolicy', () => {
  it('generates valid policy with defaults', () => {
    const policy = generateWardPolicy({ publisher: 'Test' })
    expect(policy.version).toBe('1.0')
    expect(policy.enforcement).toBe('server')
    expect(policy.default.training).toBe(false)
    expect(policy.default.indexing).toBe(true)
    expect(policy.markup?.redact_attribute).toBe('data-ward')

    // Validate it parses correctly
    const parsed = parseWardPolicy(policy)
    expect(parsed.publisher).toBe('Test')
  })

  it('respects custom options', () => {
    const policy = generateWardPolicy({
      enforcement: 'advisory',
      training: true,
      indexing: false,
    })
    expect(policy.enforcement).toBe('advisory')
    expect(policy.default.training).toBe(true)
    expect(policy.default.indexing).toBe(false)
  })
})
