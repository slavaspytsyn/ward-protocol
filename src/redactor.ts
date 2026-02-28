import * as cheerio from 'cheerio'
import type { RedactOptions, RedactResult } from './types.js'

const DEFAULT_MESSAGE = 'Content redacted per WARD policy'
const DEFAULT_ATTRIBUTE = 'data-ward'
const DEFAULT_REDACT_VALUE = 'redact'

/**
 * Redact HTML by removing content from elements marked with data-ward="redact".
 * The element structure is preserved but inner content is replaced with an HTML comment.
 */
export function redactHtml(html: string, options?: RedactOptions): RedactResult {
  const message = options?.message ?? DEFAULT_MESSAGE
  const attribute = options?.attribute ?? DEFAULT_ATTRIBUTE
  const redactValue = options?.redactValue ?? DEFAULT_REDACT_VALUE
  const policyUrl = options?.policyUrl

  const $ = cheerio.load(html)
  const reasons: string[] = []
  let redactedCount = 0

  $(`[${attribute}="${redactValue}"]`).each((_, el) => {
    const $el = $(el)
    const reason = $el.attr('data-ward-reason') || 'unspecified'
    reasons.push(reason)
    redactedCount++

    // Build comment text
    const parts = [message]
    parts.push(`Reason: ${reason}`)
    if (policyUrl) {
      parts.push(`Policy: ${policyUrl}`)
    }

    // Replace inner content with comment, keep the element shell
    $el.html(`<!-- ${parts.join(' | ')} -->`)
  })

  return {
    html: $.html(),
    redactedCount,
    reasons,
  }
}
