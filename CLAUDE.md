# ward-protocol — npm package

## Quick Context

Open-source npm пакет для WARD стандарта. Определяет AI-ботов, парсит ward.json политику, вырезает помеченный контент из HTML, предоставляет Next.js middleware.

**npm:** ward-protocol (not yet published, dry-run OK)
**GitHub:** vaclavnew/ward-protocol (private — закрыт до аудита, лицензия MIT)
**Version:** 0.1.0
**Size:** 13.4 kB packed
**Dependency:** cheerio ^1.2.0 (HTML parsing)

## Status (2026-02-28)

- ✅ Код готов, 42 теста проходят
- ✅ ESM + CJS + TypeScript declarations
- ✅ README.md + SPECIFICATION.md
- ❌ Не опубликован на npm

## Exports

```typescript
// Bot detection
detectAiBot(userAgent: string): BotInfo | null
isAiBot(userAgent: string): boolean
AI_BOTS: BotInfo[]  // 14 known AI bots

// Policy
parseWardPolicy(json: unknown): WardPolicy        // validate + parse
getPathRule(policy, path): WardDefaultRule          // match path → rule (most specific wins)
generateWardPolicy(options): WardPolicy             // helper to create ward.json

// Redactor
redactHtml(html, options?): RedactResult            // remove data-ward="redact" content

// Middleware
createWardMiddleware(options?): (req) => Response | null  // Next.js middleware

// Types
WardPolicy, WardDefaultRule, WardRule, BotInfo, RedactResult, RedactOptions, WardMiddlewareOptions
```

## Architecture

```
src/
├── index.ts              — re-exports all public API
├── types.ts              — TypeScript interfaces
├── bots.ts               — AI_BOTS registry (14 bots) + detectAiBot() + isAiBot()
├── policy.ts             — parseWardPolicy() + getPathRule() + generateWardPolicy()
├── redactor.ts           — redactHtml() using cheerio
└── middleware/
    └── nextjs.ts         — createWardMiddleware()

__tests__/
├── bots.test.ts          — bot detection tests
├── policy.test.ts        — policy parsing + path matching + specificity
└── redactor.test.ts      — HTML redaction tests
```

## Key Technical Details

### Bot Registry (bots.ts)
14 AI bots from 9 companies: OpenAI (GPTBot, ChatGPT-User, OAI-SearchBot), Anthropic (ClaudeBot, Claude-Web), Google (Google-Extended), ByteDance (Bytespider), Common Crawl (CCBot), Meta (FacebookBot, Meta-ExternalAgent), Apple (Applebot-Extended), Perplexity (PerplexityBot), Amazon (Amazonbot), Cohere (cohere-ai).

Each bot has: name, userAgentPattern, company, purpose ('training' | 'search' | 'both').

Detection: `userAgent.includes(bot.userAgentPattern)` — simple string match. Regular search bots (Googlebot, Bingbot) NOT in registry = NOT affected.

### Policy Matching (policy.ts)
- `getPathRule()` returns most specific matching rule (longest non-wildcard prefix wins)
- `/blog/private/*` beats `/blog/*` for path `/blog/private/post`
- Unmatched paths → default rule
- Wildcard `*` in path patterns → regex `.*`

### HTML Redaction (redactor.ts)
- Uses cheerio to find `[data-ward="redact"]` elements
- Replaces inner HTML with `<!-- Content redacted per WARD policy | Reason: {reason} -->`
- Preserves element shell (structure visible, content absent)
- Reads `data-ward-reason` attribute for logging (pii, copyright, business, medical)
- Returns: cleaned HTML + redactedCount + reasons array

### Next.js Middleware (middleware/nextjs.ts)
- Detects bot → fetches original page (with User-Agent: WARD-Internal-Fetch to avoid loop) → redacts HTML → adds X-WARD-* headers
- Default excludes: `/_next`, `/api`, `/favicon.ico`
- Returns `null` for non-bots (pass-through)
- Callback: `onBotDetected(bot, request)` for logging/alerts
- Headers added: `X-WARD-Enforcement`, `X-WARD-Bot-Detected`, `X-WARD-Redacted-Blocks`

## Build & Test

```bash
npm run build     # tsup → dist/ (ESM + CJS + d.ts)
npm test          # vitest run (42 tests)
npm run lint      # tsc --noEmit
```

Config: tsup for build, vitest for tests, TypeScript strict mode.

## ward.json Spec (v1.0)

Location: `/.well-known/ward.json`

Required: version, enforcement ('server'|'advisory'), default (indexing, training, summarization)
Optional: publisher, markup config, rules[], redacted_content, contact, legal_basis

See SPECIFICATION.md for full schema.

## Related

- **Standard & docs:** ~/Projects/_World/ward/ → CLAUDE.md (зонтичная документация)
- **SaaS platform:** ~/Projects/_World/getward.org/ → CLAUDE.md
- **SaaS plan:** ./GETWARD_ORG_PLAN.md
- **First adopter:** ~/Projects/_Grund/webpruefer/ → CLAUDE.md
- **Гранты:** ~/Projects/_World/Grants/ → GRANT_PIPELINE.md

## Language

- Code: English
- Communication with Slava: Russian
