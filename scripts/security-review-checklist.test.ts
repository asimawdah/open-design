import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const checklistPath = new URL("../docs/security-review-checklist.md", import.meta.url);

const requiredSections = [
  "# Security review checklist",
  "## Review summary",
  "## BYOK and model-provider configuration",
  "## Local-agent execution",
  "## Network and proxy boundaries",
  "## Artifact, export, and preview safety",
  "## Dependency and release hygiene",
  "## Risk and validation matrix",
  "## Required evidence",
  "## Pull request checklist",
];

const requiredSecurityTerms = [
  "secrets",
  "tokens",
  "provider base URLs",
  "SSRF protections",
  "metadata-service targets",
  "shell interpolation",
  "sandboxed previews",
  "dependency versions pinned",
  "release-smoke",
  "oversized responses",
];

const requiredMatrixAreas = [
  "BYOK provider setup",
  "Local agent integration",
  "Proxy/media/webhook fetch",
  "Preview/export pipeline",
  "Dependency/release change",
];

const requiredChecklistItems = [
  "Trust boundary changed and described.",
  "Secrets are not logged, exported, committed, or echoed in errors.",
  "URL/proxy inputs are validated against internal and metadata targets.",
  "Local-agent command execution avoids shell interpolation.",
  "Artifact/export paths were checked for unintended sensitive content.",
  "Automated checks or tests were run and listed.",
  "Remaining manual release checks are documented.",
];

test("security review checklist keeps required coverage", async () => {
  const source = await readChecklist();

  for (const section of requiredSections) {
    assert.match(source, new RegExp(`^${escapeRegExp(section)}$`, "m"), `missing section: ${section}`);
  }

  for (const term of requiredSecurityTerms) {
    assert.match(source, new RegExp(escapeRegExp(term), "i"), `missing security coverage term: ${term}`);
  }
});

test("security review checklist keeps actionable validation evidence", async () => {
  const source = await readChecklist();

  for (const area of requiredMatrixAreas) {
    assert.match(source, new RegExp(`\\| ${escapeRegExp(area)} \\|`, "i"), `missing matrix area: ${area}`);
  }

  assert.match(source, /\| Change area \| Main risk \| Required validation \| Release gate \|/, "matrix must keep review columns");
  assert.match(source, /exact command or workflow name/i, "required evidence must ask for exact verification commands");
  assert.match(source, /loopback, link-local, private ranges, redirects, metadata IPs, malformed URLs, and oversized responses/i, "required evidence must list blocked URL cases");
});

test("pull request checklist keeps copyable review gates", async () => {
  const source = await readChecklist();

  for (const item of requiredChecklistItems) {
    assert.match(source, new RegExp(`- \\[ \\] ${escapeRegExp(item)}`), `missing PR checklist item: ${item}`);
  }
});

async function readChecklist(): Promise<string> {
  return readFile(checklistPath, "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
