# Security review evidence examples

Use these examples when a pull request checks **Security-sensitive flow** and needs concrete evidence instead of a generic "tested" note. Copy the closest example into the PR description, then replace placeholders with the exact behavior and commands from the change.

## BYOK provider configuration

```md
### Security review

- Change area: BYOK provider setup
- Trust boundary changed: User-provided provider endpoint and API key are read from settings and sent to the model provider adapter.
- Sensitive assets touched: Provider API key, provider base URL, provider error messages.
- Automated checks: `pnpm guard`; provider URL validation unit tests.
- Manual checks: Verified error UI uses a redacted provider label and does not echo the key.
- Blocked input cases: empty URL, malformed URL, loopback, link-local, private ranges, metadata IPs, redirect to blocked target.
- Abuse case reviewed and expected safe outcome: A user pastes a real API key into the endpoint field; validation rejects the endpoint without logging or exporting the secret.
- Remaining manual release checks: Release smoke must confirm logs and packaged examples use `<provider-api-key>` placeholders only.
```

Minimum evidence to include:

- A redaction assertion or screenshot/log review note.
- A provider URL validation check that covers redirects and metadata-service targets.
- A failure-path check that reports what the user can fix without echoing the sensitive value.

## Local-agent execution

```md
### Security review

- Change area: Local agent integration
- Trust boundary changed: User-selected workspace path and detected agent binary path are passed to the daemon.
- Sensitive assets touched: Local file paths, environment variables, generated artifacts.
- Automated checks: `pnpm guard`; command-construction test for argument arrays.
- Manual checks: Dry-run output inspected for command preview and workspace scope.
- Blocked input cases: path with shell metacharacters, missing binary, workspace outside allowed project root, destructive action without confirmation.
- Abuse case reviewed and expected safe outcome: An attacker-controlled path contains `$(...)`; the agent runs through argument arrays without shell interpolation and stays inside the documented workspace.
- Remaining manual release checks: Desktop release smoke confirms no privileged path is added silently.
```

Minimum evidence to include:

- A test or code reference showing arguments are passed as arrays, not interpolated shell strings.
- A workspace-scope check for read/write boundaries.
- A dry-run or preview path for destructive setup changes.

## Proxy, media, and webhook fetches

```md
### Security review

- Change area: Proxy/media/webhook fetch
- Trust boundary changed: User-provided URL is fetched by the server-side proxy.
- Sensitive assets touched: External URL, response body, headers, generated preview artifacts.
- Automated checks: `pnpm guard`; blocked-network test suite.
- Manual checks: Error UI checked for structured policy-block messages.
- Blocked input cases: loopback, private ranges, link-local, metadata IPs, DNS rebinding, redirects to internal targets, malformed URLs, oversized responses.
- Abuse case reviewed and expected safe outcome: A public URL redirects to `169.254.169.254`; the redirect target is revalidated and blocked with a safe error code.
- Remaining manual release checks: Release smoke should confirm timeout and body-size limits in staging.
```

Minimum evidence to include:

- Blocked-network fixtures that include redirect targets, not only the original URL.
- Timeout and body-size behavior.
- A structured error path that does not expose private network details unnecessarily.

## Preview and export pipeline

```md
### Security review

- Change area: Preview/export pipeline
- Trust boundary changed: Imported design assets are converted into generated HTML and downloadable artifacts.
- Sensitive assets touched: Imported assets, generated HTML, ZIP/PDF export, fonts, remote media references.
- Automated checks: `pnpm guard`; sanitizer/export fixture tests.
- Manual checks: Generated HTML and ZIP contents inspected.
- Blocked input cases: inline script, remote media URL, external font, path traversal entry, hidden local file reference.
- Abuse case reviewed and expected safe outcome: An imported asset tries to add a script tag; the sanitizer removes it and the exported artifact contains only intentional content.
- Remaining manual release checks: Release smoke inspects one exported artifact from the packaged app.
```

Minimum evidence to include:

- A fixture for the risky export shape.
- A generated-artifact inspection note.
- An explicit statement about remote links, scripts, fonts, and private file references.

## AI output and renderer handoff

```md
### Security review

- Change area: AI output renderer handoff
- Trust boundary changed: Model or agent output is parsed into renderer payloads, generated actions, and project state.
- Sensitive assets touched: Prompt text, design content, generated HTML/CSS/SVG, renderer JSON, generated file paths, local action targets.
- Automated checks: `pnpm guard`; malformed-output schema fixture; sanitizer fixture for generated markup.
- Manual checks: Invalid output recovery state reviewed in the UI and no partial generated state was committed.
- Blocked input cases: unknown action field, unsafe generated path, external asset reference, local file URL, oversized output, missing required renderer section.
- Abuse case reviewed and expected safe outcome: Model output includes a command-like field or unsafe asset reference; schema validation rejects it before rendering, writing files, calling agents, or exporting artifacts.
- Remaining manual release checks: Release smoke should confirm invalid-output recovery copy and one safe generated handoff from the packaged app.
```

Minimum evidence to include:

- A schema, parser, or sanitizer check that runs before rendering or side effects.
- A malformed-output fixture covering unknown fields, unsafe paths, and oversized output.
- A user-visible fallback note for invalid or partial generated output.

## Telemetry, privacy, and diagnostics

```md
### Security review

- Change area: Telemetry/diagnostics change
- Trust boundary changed: Runtime errors and feature outcomes are summarized into analytics events and support diagnostics.
- Sensitive assets touched: Event names, error categories, local project path, prompt text, generated artifact IDs, crash-report metadata.
- Automated checks: `pnpm guard`; telemetry payload snapshot test.
- Manual checks: Sample event payload and diagnostics bundle inspected for redacted identifiers and coarse status codes.
- Blocked input cases: prompt containing a provider key, local path with username, generated HTML containing private text, crash message with token-like value.
- Abuse case reviewed and expected safe outcome: A crash report includes a workspace path and prompt excerpt; the emitted payload keeps only a redacted workspace hash, coarse error category, and documented opt-in flag.
- Remaining manual release checks: Release owner confirms retention copy and opt-in wording before publish.
```

Minimum evidence to include:

- A payload fixture or snapshot showing field names and redaction behavior.
- A statement that raw prompts, local paths, provider keys, generated artifacts, and workspace names are not collected by default.
- Retention, opt-in, or support-export guidance for any persisted diagnostic field.

## Dependency and release changes

```md
### Security review

- Change area: Dependency/release change
- Trust boundary changed: Runtime dependency or packaging behavior changed.
- Sensitive assets touched: Package manager lockfile, packaged app, updater/release notes.
- Automated checks: `pnpm guard`; package-manager audit or dependency review.
- Manual checks: Release-smoke path identified for packaging/updater behavior.
- Blocked input cases: not applicable; dependency provenance and release behavior reviewed instead.
- Abuse case reviewed and expected safe outcome: A dependency update changes transitive network or file behavior; review blocks release until the behavior is understood or pinned.
- Remaining manual release checks: Release owner must complete packaging smoke before publish.
```

Minimum evidence to include:

- Why the dependency is needed and whether bytes ship to users.
- Pin or override review.
- Security-impacting release notes when user-visible or packaging behavior changes.

## Quick reviewer triage

Use this compact checklist before approving:

- Evidence names exact commands or workflow runs.
- Blocked inputs are specific, not generic.
- Secrets and local files have a redaction or non-exposure statement.
- AI output, renderer handoff, generated actions, and invalid-output fallback are covered when model or agent output can affect previews, exports, files, network, or desktop privileges.
- Telemetry and diagnostics list only documented, redacted, intentionally retained fields.
- Manual release checks have an owner or release phase.
- Accepted, blocked, or deferred risks are captured in the decision log.
