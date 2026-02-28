/**
 * Full ward.json policy schema
 */
export interface WardPolicy {
  version: string
  publisher?: string
  enforcement: 'server' | 'advisory'
  markup?: {
    redact_attribute: string
    redact_value: string
    no_train_value?: string
  }
  default: WardDefaultRule
  rules?: WardRule[]
  redacted_content?: {
    replacement: 'comment' | 'empty'
    message?: string
  }
  contact?: string
  legal_basis?: string
}

/**
 * Default permissions applied when no specific rule matches
 */
export interface WardDefaultRule {
  indexing: boolean
  training: boolean
  summarization: boolean
  quotation?: {
    allowed: boolean
    attribution_required?: boolean
  }
}

/**
 * Per-path rule override
 */
export interface WardRule extends Partial<WardDefaultRule> {
  path: string
  note?: string
}

/**
 * Known AI bot registry entry
 */
export interface BotInfo {
  name: string
  userAgentPattern: string
  company: string
  purpose: 'training' | 'search' | 'both'
}

/**
 * Result of HTML redaction
 */
export interface RedactResult {
  html: string
  redactedCount: number
  reasons: string[]
}

/**
 * Options for redactHtml()
 */
export interface RedactOptions {
  /** Custom replacement message. Default: "Content redacted per WARD policy" */
  message?: string
  /** Policy URL to include in redaction comments */
  policyUrl?: string
  /** Attribute name to look for. Default: "data-ward" */
  attribute?: string
  /** Attribute value that triggers redaction. Default: "redact" */
  redactValue?: string
}

/**
 * Options for createWardMiddleware()
 */
export interface WardMiddlewareOptions {
  /** URL path to ward.json policy. Default: "/.well-known/ward.json" */
  policyPath?: string
  /** The ward policy object (if not fetching from policyPath) */
  policy?: WardPolicy
  /** Paths to apply middleware to. Default: all paths */
  paths?: string[]
  /** Paths to exclude from middleware */
  excludePaths?: string[]
  /** Custom redaction message */
  redactMessage?: string
  /** Callback when AI bot is detected */
  onBotDetected?: (bot: BotInfo, request: Request) => void | Promise<void>
}
