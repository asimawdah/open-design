# Security review checklist

Use this checklist when changing model-provider configuration, local-agent execution, proxy/network behavior, artifact exports, AI-generated output, desktop packaging, telemetry/diagnostics, or dependency policy. It is designed for pull request review and release readiness, not as a replacement for threat modeling.

## Review summary

Every security-sensitive pull request should state:

- Which trust boundary changed.
- Which secrets, tokens, files, or network targets can be touched.
- Which automated checks were run.
- Which manual checks are still required before release.

## BYOK and model-provider configuration

- Keep API keys, access tokens, refresh tokens, and provider credentials out of logs, screenshots, exported artifacts, crash reports, fixtures, and generated examples.
- Prefer redacted placeholders such as `<provider-api-key>` in documentation and examples.
- Validate provider base URLs before use; reject empty, malformed, internal, link-local, loopback, and metadata-service targets unless the workflow is explicitly local-only and documented.
- Store provider configuration in the narrowest available scope and document whether it is project-local, user-local, or environment-derived.
- Include a failure path that tells users what to fix without echoing the sensitive value.

## Local-agent execution

- Treat external agent CLI paths, arguments, environment variables, and workspace paths as untrusted input.
- Avoid shell interpolation; pass arguments as arrays where possible.
- Document which files an agent can read or write before adding a new integration.
- Keep dry-run or `--print` style modes for installers and configuration writers.
- Make destructive operations explicit, reversible where practical, and visible in logs without exposing secrets.

## Network and proxy boundaries

- Re-check SSRF protections when adding a new proxy target, media fetcher, webhook, or provider adapter.
- Block private, loopback, link-local, multicast, carrier-grade NAT, and cloud metadata ranges unless there is a documented local-only exception.
- Resolve redirects through the same allow/block policy as the original URL.
- Apply timeouts, body-size limits, and content-type expectations to remote fetches.
- Prefer structured error codes for blocked requests so users can distinguish policy blocks from transient network failures.

## Artifact, export, and preview safety

- Review HTML, PDF, PPTX, MP4, image, and ZIP export paths for accidental secret inclusion.
- Keep sandboxed previews isolated from privileged desktop or daemon capabilities.
- Treat imported design assets and plugin assets as untrusted content until validated.
- Document any export format that can embed external links, scripts, fonts, or remote media.
- Add fixtures for risky export cases when a bug fix changes sanitizer, preview, or packaging behavior.

## AI output and renderer handoff

- Treat model output, agent output, renderer handoff, and generated actions as security-sensitive input until schema validation, sanitization, and side-effect gates succeed.
- Validate generated JSON before rendering or persisting it; reject or ignore unknown action fields according to a documented policy.
- Keep generated scripts, event handlers, remote media, local file URLs, workspace paths, and command-like fields out of previews and exports unless an explicit sanitizer and review gate allows them.
- Require preview, confirmation, or dry-run gates before generated output can write files, call local agents, install dependencies, fetch network resources, or use desktop privileges.
- Use [`ai-output-security-review.md`](./ai-output-security-review.md) for detailed AI output security review evidence, abuse cases, and reviewer checklist items.

## Telemetry, privacy, and diagnostics

- Treat analytics events, diagnostics bundles, crash reports, support exports, and debug logs as security-sensitive output surfaces.
- Keep prompts, design file contents, local paths, provider keys, access tokens, workspace names, and generated artifacts out of telemetry unless there is an explicit opt-in and retention note.
- Prefer stable event names, coarse status codes, redacted identifiers, and aggregate counts over raw user content.
- Document retention, export, and deletion expectations when a change adds a new persisted diagnostic or analytics field.
- Add fixtures or snapshot checks for new telemetry payloads so sensitive values cannot drift into logs or events later.

## Dependency and release hygiene

- Keep dependency versions pinned according to the repository dependency-spec guard.
- Run package-manager audit or equivalent review before releases that change runtime dependencies.
- Verify desktop packaging, updater, and notarization changes with a release-smoke path before publishing.
- Keep generated files, vendored assets, and allowlisted JavaScript documented in the relevant guard comments.
- Record security-impacting release notes when behavior changes for secrets, proxying, local execution, telemetry, diagnostics, AI output handoff, or exported artifacts.

## Risk and validation matrix

Use this matrix to choose the minimum review path for a security-sensitive change:

| Change area | Main risk | Required validation | Release gate |
| --- | --- | --- | --- |
| BYOK provider setup | Secret exposure or unsafe provider URL | Redaction review, provider URL validation, failure-path review | No secrets in logs, examples, fixtures, or exports |
| Local agent integration | Unsafe command execution or broad file access | Argument-array execution review, workspace-scope review, dry-run behavior | Destructive actions are explicit and documented |
| Proxy/media/webhook fetch | SSRF, redirects to internal targets, resource exhaustion | Redirect policy review, blocked-network tests, timeout/body-limit checks | Internal and metadata targets stay blocked |
| Preview/export pipeline | Script, remote media, font, or private data leakage | Sanitizer review, fixture review, exported-artifact inspection | Exported files contain only intentional content |
| AI output renderer handoff | Generated scripts, unsafe paths, command-like fields, or partial unsafe state | Schema validation, sanitizer fixture, malformed-output fallback review | Invalid or unsafe output fails visibly before rendering, file writes, agent calls, or exports |
| Telemetry/diagnostics change | Accidental collection of prompts, paths, secrets, or generated artifacts | Payload snapshot review, redaction review, opt-in/retention review | Telemetry and diagnostics contain only documented, redacted fields |
| Dependency/release change | Supply-chain or packaging regression | Pin review, audit review, release-smoke path | Security-impacting release notes are recorded |

## Abuse-case review prompts

Before approving a security-sensitive change, reviewers should try to describe at least one realistic misuse path and the expected safe outcome:

| Prompt | Example case | Expected safe outcome |
| --- | --- | --- |
| What happens if a user pastes a secret into this field? | Provider key, webhook token, local config value | Secret is stored only where intended and never echoed, logged, exported, or included in telemetry |
| What happens if a URL redirects after validation? | Media fetch, proxy preview, provider base URL | Redirect target is revalidated and blocked if it becomes private, loopback, link-local, or metadata-hosted |
| What happens if an agent path or workspace path is attacker-controlled? | Local agent setup, project import, generated command | Command runs without shell interpolation and stays inside the documented workspace scope |
| What happens if an export contains untrusted assets? | HTML preview, ZIP export, font/image/media references | Sanitizer, allowlist, and export inspection keep scripts, remote media, and private files out |
| What happens if AI output includes command-like fields or unsafe renderer content? | Generated JSON includes `script`, `command`, unsafe path, or external asset reference | Schema validation rejects unsafe fields and user sees recovery guidance before side effects run |
| What happens if telemetry captures a workspace error? | Crash report, analytics event, support bundle, debug log | Event payload uses redacted IDs and coarse status codes without prompts, secrets, local paths, or generated artifacts |
| What happens if validation fails during release? | Audit failure, packaging smoke failure, dependency change | Release is blocked or explicitly downgraded with a documented owner and follow-up action |

## Review decision log

Use this compact log in complex PRs so reviewers can distinguish accepted risks from accidental omissions:

```md
## Security decision log

| Decision | Reason | Evidence | Owner | Follow-up |
| --- | --- | --- | --- | --- |
| <allowed/blocked/deferred> | <why this is safe enough> | <test, guard, audit, or manual check> | <person/team> | <issue, release gate, or none> |
```

Do not use the decision log to bypass required validation. Use it to make remaining risk explicit when a change cannot be fully verified in automation.

## Required evidence

Security-sensitive pull requests should include concrete evidence instead of a generic "tested" note:

- The exact command or workflow name used, such as `pnpm guard`, package-manager audit, or release-smoke check.
- The reviewed trust boundary and whether it touches secrets, local files, external URLs, generated artifacts, telemetry/diagnostics, AI output/renderer handoff, or desktop privileges.
- Any blocked input cases that were verified, especially loopback, link-local, private ranges, redirects, metadata IPs, malformed URLs, oversized responses, unsafe paths, generated scripts, unknown action fields, and partial/malformed model output.
- Any telemetry, diagnostic, log, crash-report, or support-export payload that changed, with redaction and retention notes.
- Any abuse-case prompt that was reviewed, including the expected safe outcome.
- Any manual release checks that remain, with the owner or release phase that should complete them.

## Evidence examples

Use [`security-review-examples.md`](./security-review-examples.md) for copyable examples covering BYOK provider configuration, local-agent execution, proxy/media/webhook fetches, preview/export safety, AI output renderer handoff, telemetry/diagnostics, and dependency/release changes.

The examples are intentionally specific: each one includes a trust-boundary statement, sensitive assets, exact validation evidence, blocked input cases, an abuse-case outcome, and remaining release checks. Use them to avoid vague PR descriptions such as "tested locally" for security-sensitive changes.

## Reusable PR template

Use [`security-review-pr-template.md`](./security-review-pr-template.md) when a change needs repeatable evidence capture. The template turns this checklist into a pull request description structure with scope, validation evidence, abuse-case review, decision-log, and release-readiness sections.

Keep the template aligned with this checklist when adding new security review areas so reviewers do not need to reconcile two separate review contracts.

## Gate maintenance

Keep the three review surfaces synchronized whenever this checklist changes:

- `.github/pull_request_template.md` should keep the lightweight security review prompts that every PR author sees.
- `docs/security-review-pr-template.md` should keep the expanded evidence template for high-risk PRs.
- `docs/security-review-examples.md` should keep copyable examples for the most common high-risk review paths.
- `docs/ai-output-security-review.md` should keep detailed AI output review coverage for model/agent output and renderer handoff changes.
- `scripts/security-review-checklist.test.ts` and `scripts/ai-output-security-review.test.ts` should guard both docs and the GitHub PR template so reviewers notice accidental removal of review gates before merge.

When a new security area is added, update the checklist, the reusable template, the GitHub PR template prompt, the evidence examples, the AI output guide when relevant, and the guard test in the same PR. This prevents a checklist-only change from silently drifting away from the pull request workflow.

## Pull request checklist

Copy this into security-sensitive pull requests when relevant:

```md
## Security review

- [ ] Trust boundary changed and described.
- [ ] Secrets are not logged, exported, committed, echoed in errors, or included in telemetry.
- [ ] URL/proxy inputs are validated against internal and metadata targets.
- [ ] Local-agent command execution avoids shell interpolation.
- [ ] Artifact/export paths were checked for unintended sensitive content.
- [ ] AI output and renderer handoff were checked for schema validation, unsafe fields, generated scripts, unsafe paths, side effects, and visible recovery behavior.
- [ ] Telemetry, diagnostics, logs, and support exports were checked for redaction and retention.
- [ ] Abuse-case prompt reviewed and safe outcome documented.
- [ ] Security decision log added when risk is accepted or deferred.
- [ ] Automated checks or tests were run and listed.
- [ ] Remaining manual release checks are documented.
```
