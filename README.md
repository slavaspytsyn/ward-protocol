# ward-protocol

**WARD (Web Access Rights Declaration)** — server-enforced AI bot content control for websites.

Unlike `robots.txt`, WARD doesn't rely on trust. Protected content is **physically removed** before serving to AI bots.

## Install

```bash
npm install ward-protocol
```

## Quick Start

### 1. Mark protected content in HTML

```html
<div data-ward="redact" data-ward-reason="pii">
  <p>Max Mustermann</p>
  <p>Musterstrasse 1, 12345 Berlin</p>
</div>
```

### 2. Detect AI bots

```typescript
import { detectAiBot, isAiBot } from 'ward-protocol'

const bot = detectAiBot(request.headers.get('user-agent'))
if (bot) {
  console.log(`AI bot detected: ${bot.name} (${bot.company})`)
}
```

### 3. Redact HTML

```typescript
import { redactHtml } from 'ward-protocol'

const result = redactHtml(html, {
  policyUrl: 'https://example.com/.well-known/ward.json',
})

console.log(`Redacted ${result.redactedCount} blocks`)
// result.html — cleaned HTML with PII removed
```

### 4. Next.js Middleware

```typescript
// middleware.ts
import { createWardMiddleware } from 'ward-protocol'

const ward = createWardMiddleware({
  onBotDetected: (bot, req) => {
    console.log(`${bot.name} accessing ${new URL(req.url).pathname}`)
  },
})

export async function middleware(request: NextRequest) {
  const response = await ward(request)
  if (response) return response
  return NextResponse.next()
}
```

### 5. Create ward.json

```typescript
import { generateWardPolicy } from 'ward-protocol'

const policy = generateWardPolicy({
  publisher: 'My Company',
  training: false,
  summarization: true,
  contact: 'webmaster@example.com',
  rules: [
    { path: '/impressum', summarization: false },
  ],
})

// Save to public/.well-known/ward.json
```

## API

### Bot Detection

| Function | Description |
|----------|-------------|
| `detectAiBot(userAgent)` | Returns `BotInfo` or `null` |
| `isAiBot(userAgent)` | Returns `boolean` |
| `AI_BOTS` | Array of known AI bot entries |

### Policy

| Function | Description |
|----------|-------------|
| `parseWardPolicy(json)` | Parse and validate ward.json |
| `getPathRule(policy, path)` | Get effective rule for a path |
| `generateWardPolicy(options)` | Generate a ward.json policy |

### Redactor

| Function | Description |
|----------|-------------|
| `redactHtml(html, options?)` | Remove `data-ward="redact"` content |

Options: `message`, `policyUrl`, `attribute`, `redactValue`

### Middleware

| Function | Description |
|----------|-------------|
| `createWardMiddleware(options?)` | Create Next.js middleware |

Options: `paths`, `excludePaths`, `redactMessage`, `onBotDetected`, `policyPath`, `policy`

## What AI Bots Receive

**Before (human browser):**
```html
<div data-ward="redact" data-ward-reason="pii">
  <p>Max Mustermann, Musterstrasse 1, Berlin</p>
</div>
```

**After (AI bot):**
```html
<div data-ward="redact" data-ward-reason="pii">
  <!-- Content redacted per WARD policy | Reason: pii -->
</div>
```

The page structure stays intact. The bot knows a block exists, but PII is physically absent.

## Specification

See [SPECIFICATION.md](./SPECIFICATION.md) for the full ward.json format specification.

## Legal Basis

- EU DSM Directive Art. 4 — right to reserve rights for text/data mining
- EU AI Act Art. 53 — AI providers must respect opt-out mechanisms
- GDPR Art. 5(1)(b) — purpose limitation

## License

MIT
