import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const checklistPath = new URL("../docs/security-review-checklist.md", import.meta.url);
const templatePath = new URL("../docs/security-review-pr-template.md", import.meta.url);

const requiredSections = [
  "# Security review checklist",
  "## Review summary",
  "## BYOK and model-provider configuration",
  "## Local-agent execution",
  "## Network and proxy boundaries",
  "## Artifact, export, and preview safety",
  "## Dependency and release hygiene",
  "## Risk and validation matrix",
  "## Abuse-case review prompts",
  "## Review decision log",
  "## Required evidence",
  "## Reusable PR template",
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
  "attacker-controlled",
  "accepted risks",
];

const requiredMatrixAreas = [
  "BYOK provider setup",
  "Local agent integration",
  "Proxy/media/webhook fetch",
  "Preview/export pipeline",
  "Dependency/release change",
];

const requiredAbusePrompts = [
  "What happens if a user pastes a secret into this field?",
  "What happens if a URL redirects after validation?",
  "What happens if an agent path or workspace path is attacker-controlled?",
  "What happens if an export contains untrusted assets?",
  "What happens if validation fails during release?",
];

const requiredChecklistItems = [
  "Trust boundary changed and described.",
  "Secrets are not logged, exported, committed, or echoed in errors.",
  "URL/proxy inputs are validated against internal and metadata targets.",
  "Local-agent command execution avoids shell interpolation.",
  "Artifact/export paths were checked for unintended sensitive content.",
  "Abuse-case prompt reviewed and safe outcome documented.",
  "Security decision log added when risk is accepted or deferred.",
  "Automated checks or tests were run and listed.",
  "Remaining manual release checks are documented.",
];

const requiredTemplateSections = [
  "# Security review PR template",
  "## Security review",
  "### Scope",
  "### Validation evidence",
  "### Abuse case reviewed",
  "### Security decision log",
  "### Release readiness",
];

const requiredTemplateFields = [
  "Change area:",
  "Trust boundary changed:",
  "Sensitive assets touched:",
  "User-visible behavior:",
  "Automated checks:",
  "Manual checks:",
  "Blocked input cases:",
  "Artifacts inspected:",
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
  assert.match(source, /Any abuse-case prompt that was reviewed, including the expected safe outcome\./i, "required evidence must include reviewed abuse cases");
});

test("security review checklist keeps abuse-case prompts for realistic misuse", async () => {
  const source = await readChecklist();

  assert.match(source, /\| Prompt \| Example case \| Expected safe outcome \|/, "abuse-case table must keep review columns");
  for (const prompt of requiredAbusePrompts) {
    assert.match(source, new RegExp(`\\| ${escapeRegExp(prompt)} \\|`, "i"), `missing abuse-case prompt: ${prompt}`);
  }

  assert.match(source, /Secret is stored only where intended and never echoed, logged, exported, or included in telemetry/i, "secret prompt must keep safe outcome");
  assert.match(source, /Redirect target is revalidated and blocked/i, "redirect prompt must keep safe outcome");
  assert.match(source, /Command runs without shell interpolation/i, "agent prompt must keep safe outcome");
});

test("security decision log keeps accepted-risk documentation", async () => {
  const source = await readChecklist();

  assert.match(source, /## Security decision log/, "decision log template must keep a copyable heading");
  assert.match(source, /\| Decision \| Reason \| Evidence \| Owner \| Follow-up \|/, "decision log must keep required columns");
  assert.match(source, /<allowed\/blocked\/deferred>/, "decision log must document allowed, blocked, and deferred outcomes");
  assert.match(source, /Do not use the decision log to bypass required validation\./, "decision log must not become a validation bypass");
});

test("pull request checklist keeps copyable review gates", async () => {
  const source = await readChecklist();

  for (const item of requiredChecklistItems) {
    assert.match(source, new RegExp(`- \\[ \\] ${escapeRegExp(item)}`), `missing PR checklist item: ${item}`);
  }
});

test("security review checklist links to reusable PR template", async () => {
  const source = await readChecklist();

  assert.match(source, /\[security-review-pr-template\.md\]\(\.\/security-review-pr-template\.md\)/, "checklist must link to the reusable PR template");
  assert.match(source, /scope, validation evidence, abuse-case review, decision-log, and release-readiness sections/i, "checklist must describe template coverage");
});

test("security review PR template keeps required evidence fields", async () => {
  const source = await readTemplate();

  for (const section of requiredTemplateSections) {
    assert.match(source, new RegExp(`^${escapeRegExp(section)}$`, "m"), `missing template section: ${section}`);
  }

  for (const field of requiredTemplateFields) {
    assert.match(source, new RegExp(escapeRegExp(field), "i"), `missing template field: ${field}`);
  }

  assert.match(source, /\| Abuse case \| Expected safe outcome \| Evidence \|/, "template must keep abuse-case evidence table");
  assert.match(source, /\| Decision \| Reason \| Evidence \| Owner \| Follow-up \|/, "template must keep decision-log table");
  assert.match(source, /Remaining manual release checks have an owner and release phase\./, "template must keep release ownership gate");
});

async function readChecklist(): Promise<string> {
  return readFile(checklistPath, "utf8");
}

async function readTemplate(): Promise<string> {
  return readFile(templatePath, "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
