import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const checklistPath = new URL("../docs/security-review-checklist.md", import.meta.url);
const templatePath = new URL("../docs/security-review-pr-template.md", import.meta.url);
const examplesPath = new URL("../docs/security-review-examples.md", import.meta.url);
const githubPrTemplatePath = new URL("../.github/pull_request_template.md", import.meta.url);

const requiredSections = [
  "# Security review checklist",
  "## Review summary",
  "## BYOK and model-provider configuration",
  "## Local-agent execution",
  "## Network and proxy boundaries",
  "## Artifact, export, and preview safety",
  "## Telemetry, privacy, and diagnostics",
  "## Dependency and release hygiene",
  "## Risk and validation matrix",
  "## Abuse-case review prompts",
  "## Review decision log",
  "## Required evidence",
  "## Evidence examples",
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
  "telemetry payloads",
  "crash reports",
  "retention note",
  "oversized responses",
  "attacker-controlled",
  "accepted risks",
];

const requiredMatrixAreas = [
  "BYOK provider setup",
  "Local agent integration",
  "Proxy/media/webhook fetch",
  "Preview/export pipeline",
  "Telemetry/diagnostics change",
  "Dependency/release change",
];

const requiredAbusePrompts = [
  "What happens if a user pastes a secret into this field?",
  "What happens if a URL redirects after validation?",
  "What happens if an agent path or workspace path is attacker-controlled?",
  "What happens if an export contains untrusted assets?",
  "What happens if telemetry captures a workspace error?",
  "What happens if validation fails during release?",
];

const requiredChecklistItems = [
  "Trust boundary changed and described.",
  "Secrets are not logged, exported, committed, echoed in errors, or included in telemetry.",
  "URL/proxy inputs are validated against internal and metadata targets.",
  "Local-agent command execution avoids shell interpolation.",
  "Artifact/export paths were checked for unintended sensitive content.",
  "Telemetry, diagnostics, logs, and support exports were checked for redaction and retention.",
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
  "Telemetry and diagnostics:",
];

const requiredExampleSections = [
  "# Security review evidence examples",
  "## BYOK provider configuration",
  "## Local-agent execution",
  "## Proxy, media, and webhook fetches",
  "## Preview and export pipeline",
  "## Telemetry, privacy, and diagnostics",
  "## Dependency and release changes",
  "## Quick reviewer triage",
];

const requiredExampleFields = [
  "Trust boundary changed:",
  "Sensitive assets touched:",
  "Automated checks:",
  "Manual checks:",
  "Blocked input cases:",
  "Abuse case reviewed and expected safe outcome:",
  "Remaining manual release checks:",
];

const requiredExampleRiskCases = [
  "A user pastes a real API key into the endpoint field",
  "An attacker-controlled path contains `$(...)`",
  "A public URL redirects to `169.254.169.254`",
  "An imported asset tries to add a script tag",
  "A crash report includes a workspace path and prompt excerpt",
  "A dependency update changes transitive network or file behavior",
];

const requiredGithubTemplateFields = [
  "**Security-sensitive flow**",
  "## Security review",
  "Trust boundary changed:",
  "Secrets/tokens/config values touched:",
  "External URLs, local files, generated artifacts, telemetry/diagnostics, or desktop privileges touched:",
  "Blocked input cases verified:",
  "Abuse case reviewed and expected safe outcome:",
  "Telemetry/diagnostics redaction and retention checked:",
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
  assert.match(source, /Any telemetry, diagnostic, log, crash-report, or support-export payload that changed/i, "required evidence must include telemetry and diagnostics payload review");
  assert.match(source, /Any abuse-case prompt that was reviewed, including the expected safe outcome\./i, "required evidence must include reviewed abuse cases");
});

test("security review checklist keeps telemetry and diagnostics privacy gates", async () => {
  const source = await readChecklist();

  assert.match(source, /Treat analytics events, diagnostics bundles, crash reports, support exports, and debug logs as security-sensitive output surfaces\./i, "telemetry section must classify diagnostics output as sensitive");
  assert.match(source, /Keep prompts, design file contents, local paths, provider keys, access tokens, workspace names, and generated artifacts out of telemetry/i, "telemetry section must block raw sensitive content");
  assert.match(source, /Prefer stable event names, coarse status codes, redacted identifiers, and aggregate counts/i, "telemetry section must prefer safe payload shapes");
  assert.match(source, /Document retention, export, and deletion expectations/i, "telemetry section must keep retention guidance");
  assert.match(source, /Payload snapshot review, redaction review, opt-in\/retention review/i, "matrix must require telemetry validation evidence");
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
  assert.match(source, /Event payload uses redacted IDs and coarse status codes/i, "telemetry prompt must keep safe outcome");
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

test("security review checklist links to reusable PR template and examples", async () => {
  const source = await readChecklist();

  assert.match(source, /\[security-review-pr-template\.md\]\(\.\/security-review-pr-template\.md\)/, "checklist must link to the reusable PR template");
  assert.match(source, /\[security-review-examples\.md\]\(\.\/security-review-examples\.md\)/, "checklist must link to copyable evidence examples");
  assert.match(source, /scope, validation evidence, abuse-case review, decision-log, and release-readiness sections/i, "checklist must describe template coverage");
  assert.match(source, /avoid vague PR descriptions such as "tested locally"/i, "examples guidance must discourage vague evidence");
});

test("security gate maintenance keeps all review surfaces synchronized", async () => {
  const source = await readChecklist();

  assert.match(source, /\.github\/pull_request_template\.md/, "gate maintenance must mention the GitHub PR template");
  assert.match(source, /docs\/security-review-pr-template\.md/, "gate maintenance must mention the reusable security PR template");
  assert.match(source, /docs\/security-review-examples\.md/, "gate maintenance must mention evidence examples");
  assert.match(source, /scripts\/security-review-checklist\.test\.ts/, "gate maintenance must mention guard coverage");
  assert.match(source, /update the checklist, the reusable template, the GitHub PR template prompt, the evidence examples, and the guard test in the same PR/i, "gate maintenance must prevent review-surface drift");
});

test("security review PR template keeps required evidence fields", async () => {
  const source = await readTemplate();

  for (const section of requiredTemplateSections) {
    assert.match(source, new RegExp(`^${escapeRegExp(section)}$`, "m"), `missing template section: ${section}`);
  }

  for (const field of requiredTemplateFields) {
    assert.match(source, new RegExp(escapeRegExp(field), "i"), `missing template field: ${field}`);
  }

  assert.match(source, /telemetry payloads, diagnostics bundles/i, "template must include telemetry assets in scope");
  assert.match(source, /telemetry events, diagnostics bundles, crash reports, support exports/i, "template must include telemetry artifacts in evidence");
  assert.match(source, /\| Abuse case \| Expected safe outcome \| Evidence \|/, "template must keep abuse-case evidence table");
  assert.match(source, /\| Decision \| Reason \| Evidence \| Owner \| Follow-up \|/, "template must keep decision-log table");
  assert.match(source, /Remaining manual release checks have an owner and release phase\./, "template must keep release ownership gate");
});

test("security review examples keep copyable evidence for high-risk paths", async () => {
  const source = await readExamples();

  for (const section of requiredExampleSections) {
    assert.match(source, new RegExp(`^${escapeRegExp(section)}$`, "m"), `missing examples section: ${section}`);
  }

  for (const field of requiredExampleFields) {
    assert.match(source, new RegExp(escapeRegExp(field), "i"), `missing evidence field in examples: ${field}`);
  }

  for (const riskCase of requiredExampleRiskCases) {
    assert.match(source, new RegExp(escapeRegExp(riskCase), "i"), `missing realistic risk case: ${riskCase}`);
  }

  assert.match(source, /redirects to `169\.254\.169\.254`/, "examples must include metadata redirect evidence");
  assert.match(source, /argument arrays without shell interpolation/, "examples must include command execution evidence");
  assert.match(source, /Generated HTML and ZIP contents inspected/, "examples must include artifact inspection evidence");
  assert.match(source, /raw prompts, local paths, provider keys, generated artifacts, and workspace names are not collected by default/i, "examples must include telemetry non-collection evidence");
  assert.match(source, /Manual release checks have an owner or release phase/i, "reviewer triage must keep manual release ownership guidance");
});

test("GitHub pull request template keeps lightweight security review gates", async () => {
  const source = await readGithubPrTemplate();

  for (const field of requiredGithubTemplateFields) {
    assert.match(source, new RegExp(escapeRegExp(field), "i"), `missing GitHub PR template field: ${field}`);
  }

  assert.match(source, /touches secrets, local files, external URLs, generated artifacts, desktop privileges, dependencies, release behavior, telemetry\/diagnostics, or model-provider configuration/i, "security-sensitive surface checkbox must stay explicit");
  assert.match(source, /Complete this section when "Security-sensitive flow" is checked/i, "GitHub template must require security review when checked");
  assert.match(source, /Write "Not applicable" with a short reason/i, "GitHub template must require an explicit non-applicable reason");
});

async function readChecklist(): Promise<string> {
  return readFile(checklistPath, "utf8");
}

async function readTemplate(): Promise<string> {
  return readFile(templatePath, "utf8");
}

async function readExamples(): Promise<string> {
  return readFile(examplesPath, "utf8");
}

async function readGithubPrTemplate(): Promise<string> {
  return readFile(githubPrTemplatePath, "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
