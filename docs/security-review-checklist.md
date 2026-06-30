# Security review checklist

Use this checklist when changing model-provider configuration, local-agent execution, proxy/network behavior, artifact exports, desktop packaging, or dependency policy. It is designed for pull request review and release readiness, not as a replacement for threat modeling.

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

## Dependency and release hygiene

- Keep dependency versions pinned according to the repository dependency-spec guard.
- Run package-manager audit or equivalent review before releases that change runtime dependencies.
- Verify desktop packaging, updater, and notarization changes with a release-smoke path before publishing.
- Keep generated files, vendored assets, and allowlisted JavaScript documented in the relevant guard comments.
- Record security-impacting release notes when behavior changes for secrets, proxying, local execution, or exported artifacts.

## Risk and validation matrix

Use this matrix to choose the minimum review path for a security-sensitive change:

| Change area | Main risk | Required validation | Release gate |
| --- | --- | --- | --- |
| BYOK provider setup | Secret exposure or unsafe provider URL | Redaction review, provider URL validation, failure-path review | No secrets in logs, examples, fixtures, or exports |
| Local agent integration | Unsafe command execution or broad file access | Argument-array execution review, workspace-scope review, dry-run behavior | Destructive actions are explicit and documented |
| Proxy/media/webhook fetch | SSRF, redirects to internal targets, resource exhaustion | Redirect policy review, blocked-network tests, timeout/body-limit checks | Internal and metadata targets stay blocked |
| Preview/export pipeline | Script, remote media, font, or private data leakage | Sanitizer review, fixture review, exported-artifact inspection | Exported files contain only intentional content |
| Dependency/release change | Supply-chain or packaging regression | Pin review, audit review, release-smoke path | Security-impacting release notes are recorded |

## Abuse-case review prompts

Before approving a security-sensitive change, reviewers should try to describe at least one realistic misuse path and the expected safe outcome:

| Prompt | Example case | Expected safe outcome |
| --- | --- | --- |
| What happens if a user pastes a secret into this field? | Provider key, webhook token, local config value | Secret is stored only where intended and never echoed, logged, exported, or included in telemetry |
| What happens if a URL redirects after validation? | Media fetch, proxy preview, provider base URL | Redirect target is revalidated and blocked if it becomes private, loopback, link-local, or metadata-hosted |
| What happens if an agent path or workspace path is attacker-controlled? | Local agent setup, project import, generated command | Command runs without shell interpolation and stays inside the documented workspace scope |
| What happens if an export contains untrusted assets? | HTML preview, ZIP export, font/image/media references | Sanitizer, allowlist, and export inspection keep scripts, remote media, and private files out |
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
- The reviewed trust boundary and whether it touches secrets, local files, external URLs, generated artifacts, or desktop privileges.
- Any blocked input cases that were verified, especially loopback, link-local, private ranges, redirects, metadata IPs, malformed URLs, and oversized responses.
- Any abuse-case prompt that was reviewed, including the expected safe outcome.
- Any manual release checks that remain, with the owner or release phase that should complete them.

## Pull request checklist

Copy this into security-sensitive pull requests when relevant:

```md
## Security review

- [ ] Trust boundary changed and described.
- [ ] Secrets are not logged, exported, committed, or echoed in errors.
- [ ] URL/proxy inputs are validated against internal and metadata targets.
- [ ] Local-agent command execution avoids shell interpolation.
- [ ] Artifact/export paths were checked for unintended sensitive content.
- [ ] Abuse-case prompt reviewed and safe outcome documented.
- [ ] Security decision log added when risk is accepted or deferred.
- [ ] Automated checks or tests were run and listed.
- [ ] Remaining manual release checks are documented.
```
