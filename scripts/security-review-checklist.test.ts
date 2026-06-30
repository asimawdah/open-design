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
];

test("security review checklist keeps required coverage", async () => {
  const source = await readFile(checklistPath, "utf8");

  for (const section of requiredSections) {
    assert.match(source, new RegExp(`^${escapeRegExp(section)}$`, "m"), `missing section: ${section}`);
  }

  for (const term of requiredSecurityTerms) {
    assert.match(source, new RegExp(escapeRegExp(term), "i"), `missing security coverage term: ${term}`);
  }
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
