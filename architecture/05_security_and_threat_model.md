# Security Architecture & Threat Model

## 1. Threat Modeling & Attack Vectors (STRIDE Matrix)

| Threat Category | Potential Attack Vector | Defensive Counter-Measure |
|---|---|---|
| **Spoofing** | Forged webhook requests simulating fake leads. | Webhook signature verification and source IP rate limiting. |
| **Tampering** | Modifying lead status or booking slot IDs directly in API calls. | Strict Zod schema validation; server-side state transition enforcement. |
| **Repudiation** | Operator claiming a lead was handled when it was ignored. | Immutable append-only `AuditEvent` audit trail logged for every state change. |
| **Information Disclosure** | Exposing customer phone numbers and physical addresses publicly. | PII masking on public APIs; interactive booking links use signed random UUIDs. |
| **Denial of Service** | Inundating webhook ingress with 10,000 requests/sec. | In-memory token bucket rate limiting (max 100 req/min per IP). |
| **Elevation of Privilege** | Exploiting prototype pollution or unvalidated inputs. | Explicit TypeScript object typing, parameterized queries, zero `eval`. |

---

## 2. Input Validation & Sanitization Policy
1. **Zero Raw Input Trust**: All inbound HTTP bodies are parsed through strict Zod schemas before reaching business logic.
2. **XSS Protection**: HTML entities in customer names, addresses, and messages are escaped before rendering in the DOM.
3. **No Hardcoded Secrets**: Configuration is read from environment variables with safe fallback defaults for local demo execution.
