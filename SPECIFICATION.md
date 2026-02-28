# WARD Specification v1.0

**WARD — Web Access Rights Declaration**

A machine-readable protocol for website owners to declare and enforce content access rules for AI crawlers and bots.

## Overview

WARD provides three layers of AI content control:

1. **Policy file** (`ward.json`) — site-wide declaration of AI access rules
2. **HTML markup** (`data-ward` attributes) — element-level content protection
3. **Server enforcement** — middleware that physically removes protected content before serving to AI bots

Unlike `robots.txt`, WARD is not trust-based. Protected content is **physically absent** from responses served to AI bots.

## 1. Policy File: ward.json

### Location

```
https://example.com/.well-known/ward.json
```

### Schema

```json
{
  "version": "1.0",
  "publisher": "Company Name",
  "enforcement": "server",
  "markup": {
    "redact_attribute": "data-ward",
    "redact_value": "redact",
    "no_train_value": "no-train"
  },
  "default": {
    "indexing": true,
    "training": false,
    "summarization": true,
    "quotation": {
      "allowed": true,
      "attribution_required": true
    }
  },
  "rules": [
    {
      "path": "/blog/*",
      "training": false,
      "summarization": true
    },
    {
      "path": "/impressum",
      "training": false,
      "summarization": false,
      "note": "Contains PII"
    }
  ],
  "redacted_content": {
    "replacement": "comment",
    "message": "Content redacted per WARD policy"
  },
  "contact": "webmaster@example.com",
  "legal_basis": "EU DSM Directive Art. 4, EU AI Act Art. 53"
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Specification version. Currently `"1.0"` |
| `enforcement` | `"server"` \| `"advisory"` | Whether content is physically redacted or rules are advisory only |
| `default` | object | Default permissions for all paths |
| `default.indexing` | boolean | Allow AI bots to index content |
| `default.training` | boolean | Allow content to be used for AI model training |
| `default.summarization` | boolean | Allow content to be summarized by AI |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `publisher` | string | Organization name |
| `markup` | object | Custom attribute names (defaults shown above) |
| `default.quotation` | object | Quotation permissions |
| `rules` | array | Per-path rule overrides |
| `redacted_content` | object | How redacted content is replaced |
| `contact` | string | Contact email for crawlers |
| `legal_basis` | string | Legal reference for the policy |

### Rules

Rules override default permissions for specific paths. Each rule must have a `path` field.

Path patterns support `*` as a wildcard:
- `/blog/*` matches `/blog/my-post`, `/blog/2024/january`
- `/impressum` matches exactly `/impressum`

When multiple rules match, the most specific (longest non-wildcard) pattern wins.

## 2. HTML Markup

### Attributes

| Attribute | Value | Effect |
|-----------|-------|--------|
| `data-ward` | `"redact"` | Content physically removed for AI bots |
| `data-ward` | `"no-train"` | Content visible but must not be used for training |
| `data-ward` | `"no-summarize"` | Content visible but must not be summarized |
| `data-ward-reason` | string | Reason for protection (for logging/transparency) |

### Reason Values

| Value | Meaning |
|-------|---------|
| `pii` | Personal data (GDPR) |
| `copyright` | Copyrighted content |
| `business` | Business secrets |
| `medical` | Medical/health data |

### Example

```html
<h1>Impressum</h1>
<p>Angaben gemass § 5 TMG</p>

<!-- This block is physically removed for AI bots -->
<div data-ward="redact" data-ward-reason="pii">
  <p>Max Mustermann</p>
  <p>Musterstrasse 1, 12345 Berlin</p>
  <p>E-Mail: info@example.de</p>
</div>

<!-- This block is visible but cannot be used for training -->
<div data-ward="no-train" data-ward-reason="copyright">
  <article>Proprietary analysis...</article>
</div>
```

### What AI Bots Receive

```html
<h1>Impressum</h1>
<p>Angaben gemass § 5 TMG</p>

<div data-ward="redact" data-ward-reason="pii">
  <!-- Content redacted per WARD policy | Reason: pii -->
</div>

<div data-ward="no-train" data-ward-reason="copyright">
  <article>Proprietary analysis...</article>
</div>
```

The page structure is preserved. The bot knows a block exists, but protected content is physically absent.

## 3. Response Headers

When serving content to AI bots, the server adds:

| Header | Example | Description |
|--------|---------|-------------|
| `X-WARD-Enforcement` | `server` | Enforcement mode |
| `X-WARD-Bot-Detected` | `GPTBot` | Detected bot name |
| `X-WARD-Redacted-Blocks` | `3` | Number of blocks redacted |

## 4. Bot Detection

Primary method: User-Agent string matching against known AI crawlers.

Known AI crawlers (non-exhaustive):

| Bot | Company | Purpose |
|-----|---------|---------|
| GPTBot | OpenAI | Training |
| ChatGPT-User | OpenAI | Search |
| ClaudeBot | Anthropic | Training |
| Claude-Web | Anthropic | Search |
| Google-Extended | Google | Training |
| Bytespider | ByteDance | Training |
| CCBot | Common Crawl | Training |
| FacebookBot | Meta | Training |
| Applebot-Extended | Apple | Training |
| PerplexityBot | Perplexity | Both |
| Amazonbot | Amazon | Both |
| cohere-ai | Cohere | Training |

Regular search engine bots (Googlebot, Bingbot) are NOT affected — they receive the full page.

## Legal Basis

- **EU DSM Directive Art. 4** — right holders may reserve rights for text and data mining
- **EU AI Act Art. 53** — AI providers must respect opt-out mechanisms
- **GDPR Art. 5(1)(b)** — purpose limitation principle

WARD makes these legal rights technically enforceable.

## Not Cloaking

WARD is fundamentally different from SEO cloaking:

1. Search engine bots (Googlebot) receive the full page
2. Only AI training bots receive modified content
3. Purpose is privacy/compliance, not SEO manipulation
4. Policy is publicly declared in `ward.json`
5. EU law explicitly permits this

## License

This specification is released under the MIT License.
