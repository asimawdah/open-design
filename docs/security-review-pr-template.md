# Security review PR template

Use this template for pull requests that change trust boundaries, provider configuration, local-agent execution, proxy/network fetches, generated artifacts, desktop packaging, or dependency/release policy.

Copy the relevant sections into the PR description. Remove sections only when they clearly do not apply.

## Security review

### Scope

- Change area: BYOK provider, local agent, proxy/media/webhook, preview/export, dependency/release, or other.
- Trust boundary changed: describe what boundary changed and why.
- Sensitive assets touched: describe credentials, local files, external URLs, generated artifacts, desktop privileges, or none.
- User-visible behavior: describe what users will notice.

### Validation evidence

- Automated checks: list the exact command or workflow name, for example `pnpm guard`.
- Manual checks: describe what was checked manually and by whom.
- Blocked input cases: list loopback, link-local, private ranges, redirects, metadata IPs, malformed URLs, oversized responses, or not applicable.
- Artifacts inspected: list logs, screenshots, HTML, PDF, ZIP, generated assets, or not applicable.

### Abuse case reviewed

| Abuse case | Expected safe outcome | Evidence |
| --- | --- | --- |
| Realistic misuse path reviewed | Safe behavior confirmed | Test, guard, log excerpt, or manual check |

### Security decision log

Use this table when risk is accepted, blocked, or deferred.

| Decision | Reason | Evidence | Owner | Follow-up |
| --- | --- | --- | --- | --- |
| allowed, blocked, or deferred | why this is safe enough | test, guard, audit, or manual check | person or team | issue, release gate, or none |

### Release readiness

- [ ] Credentials are not logged, exported, committed, echoed in errors, or included in telemetry.
- [ ] URL/proxy inputs are validated against internal and metadata targets.
- [ ] Local-agent command execution avoids shell interpolation.
- [ ] Artifact/export paths were checked for unintended sensitive content.
- [ ] Dependency changes keep pinned versions and documented release-impact notes.
- [ ] Remaining manual release checks have an owner and release phase.
