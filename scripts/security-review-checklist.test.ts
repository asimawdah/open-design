import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const checklistPath = new URL("../docs/security-review-checklist.md", import.meta.url);
const templatePath = new URL("../docs/security-review-pr-template.md", import.meta.url);
const githubPrTemplatePath = new URL("../.github/pull_request_template.md", import.meta.url);

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
  "## Escalation and ownership",
  "## Reusable PR template",
  "## Gate maintenance",
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
  "security owner",
  "escalation path",
  "deferred validation",
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
  "Security owner and escalation path documented.",
  "Automated checks or tests were run and listed.",
  "Remaining manual release checks are documented.",
  "Deferred validation links to a follow-up issue, release gate, or documented owner.",
];

const requiredTemplateSections = [
  "# Security review PR template",
  "## Security review",
  "### Scope",
  "### Validation evidence",
  "### Abuse case reviewed",
  "### Security decision log",
  "### Escalation and ownership",
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
  "Security owner:",
  "Merge gate:",
  "Escalation trigger:",
  "Follow-up link:",
];

const requiredGithubTemplateFields = [
  "**Security-sensitive flow**",
  "## Security review",
  "Trust boundary changed:",
  "Secrets/tokens/config values touched:",
  "External URLs, local files, generated artifacts, or desktop privileges touched:",
  "Blocked input cases verified:",
  "Abuse case reviewed and expected safe outcome:",
  "Security owner and escalation path:",
  "Deferred validation or follow-up link:",
  "Remaining manual release checks:",
  "docs/security-review-pr-template.md",
  "docs/security-review-checklist.md",
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

test("security escalation guidance keeps ownership and merge gates explicit", async () => {
  const source = await readChecklist();

  assert.match(source, /Assign a security owner for the change/i, "escalation guidance must require an owner");
  assert.match(source, /requires manual release approval/i, "escalation guidance must include manual release approval gates");
  assert.match(source, /Escalate to a maintainer before merge/i, "escalation guidance must require maintainer escalation");
  assert.match(source, /Link any deferred validation to a follow-up issue, release gate, or documented owner/i, "deferred validation must have a tracked owner or gate");
  assert.match(source, /draft or blocked state/i, "unresolved release safety checks must block readiness");
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
  assert.match(source, /scope, validation evidence, abuse-case review, decision-log, escalation ownership, and release-readiness sections/i, "checklist must describe template coverage");
});

test("security gate maintenance keeps all review surfaces synchronized", async () => {
  const source = await readChecklist();

  assert.match(source, /\.github\/pull_request_template\.md/, "gate maintenance must mention the GitHub PR template");
  assert.match(source, /docs\/security-review-pr-template\.md/, "gate maintenance must mention the reusable security PR template");
  assert.match(source, /scripts\/security-review-checklist\.test\.ts/, "gate maintenance must mention guard coverage");
  assert.match(source, /update the checklist, the reusable template, the GitHub PR template prompt, and the guard test in the same PR/i, "gate maintenance must prevent review-surface drift");
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
  assert.match(source, /Security owner and escalation path are documented when risk is accepted or deferred\./, "template must keep escalation ownership gate");
  assert.match(source, /Remaining manual release checks have an owner and release phase\./, "template must keep release ownership gate");
});

test("GitHub pull request template keeps lightweight security review gates", async () => {
  const source = await readGithubPrTemplate();

  for (const field of requiredGithubTemplateFields) {
    assert.match(source, new RegExp(escapeRegExp(field), "i"), `missing GitHub PR template field: ${field}`);
  }

  assert.match(source, /touches secrets, local files, external URLs, generated artifacts, desktop privileges, dependencies, release behavior, or model-provider configuration/i, "security-sensitive surface checkbox must stay explicit");
  assert.match(source, /Complete this section when "Security-sensitive flow" is checked/i, "GitHub template must require security review when checked");
  assert.match(source, /Write "Not applicable" with a short reason/i, "GitHub template must require an explicit non-applicable reason");
});

async function readChecklist(): Promise<string> {
  return readFile(checklistPath, "utf8");
}

async function readTemplate(): Promise<string> {
  return readFile(templatePath, "utf8");
}

async function readGithubPrTemplate(): Promise<string> {
  return readFile(githubPrTemplatePath, "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
