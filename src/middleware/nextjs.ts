import { detectAiBot } from '../bots.js'
import { redactHtml } from '../redactor.js'
import type { WardMiddlewareOptions, BotInfo } from '../types.js'

/**
 * Create a WARD middleware for Next.js.
 *
 * Usage in middleware.ts:
 * ```ts
 * import { createWardMiddleware } from 'ward-protocol'
 *
 * const wardMiddleware = createWardMiddleware({
 *   policyUrl: 'https://example.com/.well-known/ward.json',
 * })
 *
 * export async function middleware(request: NextRequest) {
 *   return wardMiddleware(request)
 * }
 * ```
 */
export function createWardMiddleware(options: WardMiddlewareOptions = {}) {
  const {
    paths,
    excludePaths = ['/_next', '/api', '/favicon.ico'],
    redactMessage,
    onBotDetected,
  } = options

  return async function wardMiddleware(request: Request): Promise<Response | null> {
    const userAgent = request.headers.get('user-agent') || ''
    const bot = detectAiBot(userAgent)

    // Not an AI bot — pass through
    if (!bot) return null

    const url = new URL(request.url)
    const pathname = url.pathname

    // Check exclude paths
    if (excludePaths.some((p) => pathname.startsWith(p))) {
      return null
    }

    // Check included paths (if specified)
    if (paths && !paths.some((p) => pathname.startsWith(p))) {
      return null
    }

    // Notify callback
    if (onBotDetected) {
      await onBotDetected(bot, request)
    }

    // Fetch the original page
    const response = await fetch(request.url, {
      headers: {
        // Forward headers but replace User-Agent to avoid infinite loop
        ...Object.fromEntries(request.headers.entries()),
        'user-agent': 'WARD-Internal-Fetch',
      },
    })

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
      return addWardHeaders(response, bot, 0)
    }

    const html = await response.text()
    const result = redactHtml(html, {
      message: redactMessage,
      policyUrl: options.policyPath
        ? `${url.origin}${options.policyPath}`
        : `${url.origin}/.well-known/ward.json`,
    })

    const newResponse = new Response(result.html, {
      status: response.status,
      headers: response.headers,
    })

    return addWardHeaders(newResponse, bot, result.redactedCount)
  }
}

function addWardHeaders(response: Response, bot: BotInfo, redactedCount: number): Response {
  const headers = new Headers(response.headers)
  headers.set('X-WARD-Enforcement', 'server')
  headers.set('X-WARD-Bot-Detected', bot.name)
  headers.set('X-WARD-Redacted-Blocks', String(redactedCount))
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
