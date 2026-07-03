# Security review PR template

Use this template for pull requests that change trust boundaries, provider configuration, local-agent execution, proxy/network fetches, generated artifacts, AI output/renderer handoff, telemetry/diagnostics, desktop packaging, or dependency/release policy.

Copy the relevant sections into the PR description. Remove sections only when they clearly do not apply.

## Security review

### Scope

- Change area: BYOK provider, local agent, proxy/media/webhook, preview/export, AI output handoff, telemetry/diagnostics, dependency/release, or other.
- Trust boundary changed: describe what boundary changed and why.
- Sensitive assets touched: describe credentials, local files, external URLs, generated artifacts, AI/model/agent output, telemetry payloads, diagnostics bundles, desktop privileges, or none.
- User-visible behavior: describe what users will notice.

### Validation evidence

- Automated checks: list the exact command or workflow name, for example `pnpm guard`.
- Manual checks: describe what was checked manually and by whom.
- Blocked input cases: list loopback, link-local, private ranges, redirects, metadata IPs, malformed URLs, oversized responses, unsafe generated paths, unsafe markup fields, unknown action fields, or not applicable.
- Artifacts inspected: list logs, screenshots, HTML, PDF, ZIP, generated assets, renderer payloads, telemetry events, diagnostics bundles, crash reports, support exports, or not applicable.
- AI output handoff: list parser/schema validation, sanitizer checks, generated action gates, malformed-output fallback UX, or not applicable.
- Telemetry and diagnostics: list event fields, redacted identifiers, opt-in/retention notes, or not applicable.

### Abuse case reviewed

| Abuse case | Expected safe outcome | Evidence |
| --- | --- | --- |
| Realistic misuse path reviewed | Safe behavior confirmed | Test, guard, log excerpt, payload snapshot, or manual check |

### Security decision log

Use this table when risk is accepted, blocked, or deferred.

| Decision | Reason | Evidence | Owner | Follow-up |
| --- | --- | --- | --- | --- |
| allowed, blocked, or deferred | why this is safe enough | test, guard, audit, or manual check | person or team | issue, release gate, or none |

### Escalation and ownership

- Security owner: person responsible for the final safe outcome.
- Merge gate: automated guard only, maintainer review, release approval, or blocked.
- Escalation trigger: accepted risk, deferred validation, weakened guard, changed trust boundary, sensitive configuration persistence, AI output side-effect expansion, telemetry payload expansion, or not applicable.
- Follow-up link: issue, release gate, owner note, or none.

### Release readiness

- [ ] Credentials are not logged, exported, committed, echoed in errors, or included in telemetry.
- [ ] URL/proxy inputs are validated against internal and metadata targets.
- [ ] Local-agent command execution avoids shell interpolation.
- [ ] Artifact/export paths were checked for unintended sensitive content.
- [ ] AI/model/agent output is validated before rendering, exporting, file writes, network fetches, local-agent calls, or desktop side effects.
- [ ] Invalid generated output has visible recovery guidance and does not commit partial unsafe state.
- [ ] Telemetry, diagnostics, crash reports, and support exports use redacted fields with documented retention or opt-in behavior.
- [ ] Dependency changes keep pinned versions and documented release-impact notes.
- [ ] Security owner and escalation path are documented when risk is accepted or deferred.
- [ ] Remaining manual release checks have an owner and release phase.
