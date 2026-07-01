# AI output security review

Use this guide when a change turns model output, agent output, imported design content, or generated code into previews, files, commands, API calls, or persisted project state.

AI output is useful product data, but reviewers should treat it as untrusted input until it crosses a validated contract boundary.

## Review triggers

Apply this review when a pull request changes any of these paths:

- Prompt, tool, agent, or model-provider responses.
- JSON renderer handoff contracts.
- Generated HTML, CSS, JavaScript, SVG, Markdown, ZIP, PDF, PPTX, or image artifacts.
- File names, paths, links, imports, exports, or workspace writes proposed by AI output.
- Generated actions that can call local agents, desktop APIs, network fetchers, package managers, or shell-like tools.
- Recovery or fallback behavior when generated output is invalid, partial, oversized, or maliciously shaped.

## Contract boundary

Before model output reaches a renderer, preview, export, file write, or action runner, reviewers should confirm:

- The accepted schema is explicit and versioned where practical.
- Unknown fields are ignored or rejected according to a documented policy.
- Required fields are validated before side effects run.
- URLs, file paths, imports, and asset references are normalized and policy-checked after decoding and redirects where relevant.
- Text content is rendered as text unless the destination explicitly allows sanitized markup.
- Generated actions are previewed or confirmed before they touch files, network, desktop privileges, or local agents.
- Safe fallbacks are visible to the user when output is invalid instead of silently applying a partial design.

## Dangerous output cases

Review at least one realistic failure or abuse case:

| Output case | Expected safe outcome |
| --- | --- |
| JSON contains extra executable fields such as `command`, `script`, or `postinstall` | Unknown action fields are rejected or ignored before rendering or execution |
| Generated HTML includes `<script>`, event handlers, external fonts, or remote media | Sanitizer removes active content and export inspection verifies the result |
| Generated CSS tries `url(file://...)`, private network URLs, or credential-like query strings | URL policy blocks local/private targets and secrets are not logged |
| Generated file path contains traversal, absolute paths, shell metacharacters, or hidden config targets | Path is normalized, confined to the workspace scope, and never shell-interpolated |
| Model output is huge, malformed, or missing required sections | User sees a recoverable validation error and no partial side effect is committed |
| Prompt or design content is copied into telemetry, diagnostics, or crash reports | Payload uses redacted IDs, coarse error codes, and documented retention/opt-in behavior |

## Evidence to include in PRs

Security-sensitive PRs that use model output should include:

- The exact parser, schema, sanitizer, or renderer guard that validates generated output.
- At least one malformed-output test or fixture.
- Any blocked URL/path/script cases that were verified.
- A statement about whether generated output can trigger file writes, agent calls, package installs, network fetches, or desktop privileges.
- A fallback UX note describing what users see when generated output cannot be safely applied.
- A telemetry/diagnostics note confirming raw prompts, design file contents, and generated artifacts are not collected by default.

## Reviewer checklist

```md
## AI output security review

- [ ] AI/model/agent output is treated as untrusted input.
- [ ] Renderer handoff schema or parser is explicit and checked before side effects.
- [ ] Unknown action fields, scripts, unsafe URLs, unsafe paths, and oversized output were considered.
- [ ] Generated actions require preview, confirmation, or a documented safe gate before touching files, network, agents, or desktop privileges.
- [ ] Invalid output fails with visible recovery guidance and does not commit partial unsafe state.
- [ ] Telemetry and diagnostics do not collect raw prompts, design files, generated artifacts, local paths, or secrets by default.
```
