import type { WardPolicy, WardRule, WardDefaultRule } from './types.js'

/**
 * Parse and validate a ward.json policy object.
 * Throws on invalid input.
 */
export function parseWardPolicy(json: unknown): WardPolicy {
  if (!json || typeof json !== 'object') {
    throw new Error('ward.json must be a JSON object')
  }

  const obj = json as Record<string, unknown>

  if (!obj.version || typeof obj.version !== 'string') {
    throw new Error('ward.json must have a "version" string')
  }

  if (!obj.enforcement || !['server', 'advisory'].includes(obj.enforcement as string)) {
    throw new Error('ward.json must have "enforcement" set to "server" or "advisory"')
  }

  if (!obj.default || typeof obj.default !== 'object') {
    throw new Error('ward.json must have a "default" object')
  }

  const defaultRule = obj.default as Record<string, unknown>
  if (typeof defaultRule.indexing !== 'boolean') {
    throw new Error('ward.json default.indexing must be a boolean')
  }
  if (typeof defaultRule.training !== 'boolean') {
    throw new Error('ward.json default.training must be a boolean')
  }
  if (typeof defaultRule.summarization !== 'boolean') {
    throw new Error('ward.json default.summarization must be a boolean')
  }

  if (obj.rules !== undefined) {
    if (!Array.isArray(obj.rules)) {
      throw new Error('ward.json rules must be an array')
    }
    for (const rule of obj.rules) {
      if (!rule || typeof rule !== 'object' || typeof rule.path !== 'string') {
        throw new Error('Each rule must have a "path" string')
      }
    }
  }

  return json as WardPolicy
}

/**
 * Match a request path against policy rules.
 * Returns the most specific matching rule, or the default rule.
 */
export function getPathRule(policy: WardPolicy, path: string): WardDefaultRule & Partial<WardRule> {
  if (!policy.rules || policy.rules.length === 0) {
    return policy.default
  }

  // Find matching rules, prefer most specific (longest path pattern)
  let bestMatch: WardRule | null = null
  let bestSpecificity = -1

  for (const rule of policy.rules) {
    if (matchPath(rule.path, path)) {
      const specificity = rule.path.replace(/\*/g, '').length
      if (specificity > bestSpecificity) {
        bestMatch = rule
        bestSpecificity = specificity
      }
    }
  }

  if (!bestMatch) {
    return policy.default
  }

  // Merge default + rule (rule overrides)
  return { ...policy.default, ...bestMatch }
}

/**
 * Simple path pattern matching.
 * Supports * as wildcard for path segments.
 * Examples: "/blog/*" matches "/blog/my-post", "/blog/2024/post"
 */
function matchPath(pattern: string, path: string): boolean {
  if (pattern === path) return true

  // Convert glob pattern to regex
  const regexStr = '^' + pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // escape special chars except *
    .replace(/\*/g, '.*') + '$'

  return new RegExp(regexStr).test(path)
}

/**
 * Helper to generate a ward.json policy object.
 */
export function generateWardPolicy(options: {
  publisher?: string
  enforcement?: 'server' | 'advisory'
  training?: boolean
  summarization?: boolean
  indexing?: boolean
  rules?: WardRule[]
  contact?: string
}): WardPolicy {
  return {
    version: '1.0',
    publisher: options.publisher,
    enforcement: options.enforcement ?? 'server',
    markup: {
      redact_attribute: 'data-ward',
      redact_value: 'redact',
      no_train_value: 'no-train',
    },
    default: {
      indexing: options.indexing ?? true,
      training: options.training ?? false,
      summarization: options.summarization ?? true,
      quotation: {
        allowed: true,
        attribution_required: true,
      },
    },
    rules: options.rules,
    redacted_content: {
      replacement: 'comment',
      message: 'Content redacted per WARD policy',
    },
    contact: options.contact,
    legal_basis: 'EU DSM Directive Art. 4, EU AI Act Art. 53',
  }
}
