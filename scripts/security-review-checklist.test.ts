import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const checklistPath = new URL("../docs/security-review-checklist.md", import.meta.url);
const templatePath = new URL("../docs/security-review-pr-template.md", import.meta.url);
const examplesPath = new URL("../docs/security-review-examples.md", import.meta.url);
const aiOutputGuidePath = new URL("../docs/ai-output-security-review.md", import.meta.url);
const githubPrTemplatePath = new URL("../.github/pull_request_template.md", import.meta.url);

const checklistSections = [
  "# Security review checklist",
  "## BYOK and model-provider configuration",
  "## Local-agent execution",
  "## Network and proxy boundaries",
  "## Artifact, export, and preview safety",
  "## AI output and renderer handoff",
  "## Telemetry, privacy, and diagnostics",
  "## Dependency and release hygiene",
  "## Risk and validation matrix",
  "## Abuse-case review prompts",
  "## Required evidence",
  "## Evidence examples",
  "## Reusable PR template",
  "## Gate maintenance",
  "## Pull request checklist",
];

const matrixAreas = [
  "BYOK provider setup",
  "Local agent integration",
  "Proxy/media/webhook fetch",
  "Preview/export pipeline",
  "AI output renderer handoff",
  "Telemetry/diagnostics change",
  "Dependency/release change",
];

const reusableTemplateFields = [
  "Change area:",
  "Trust boundary changed:",
  "Sensitive assets touched:",
  "User-visible behavior:",
  "Automated checks:",
  "Manual checks:",
  "Blocked input cases:",
  "Artifacts inspected:",
  "AI output handoff:",
  "Telemetry and diagnostics:",
];

const exampleSections = [
  "# Security review evidence examples",
  "## BYOK provider configuration",
  "## Local-agent execution",
  "## Proxy, media, and webhook fetches",
  "## Preview and export pipeline",
  "## AI output and renderer handoff",
  "## Telemetry, privacy, and diagnostics",
  "## Dependency and release changes",
  "## Quick reviewer triage",
];

const githubTemplateFields = [
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

test("security checklist keeps required review areas", async () => {
  const source = await read(checklistPath);

  for (const section of checklistSections) {
    assert.match(source, new RegExp(`^${escapeRegExp(section)}$`, "m"), `missing section: ${section}`);
  }

  for (const area of matrixAreas) {
    assert.match(source, new RegExp(`\\| ${escapeRegExp(area)} \\|`, "i"), `missing matrix area: ${area}`);
  }

  assert.match(source, /secrets/i, "checklist must keep secret handling coverage");
  assert.match(source, /metadata-service targets/i, "checklist must keep internal target coverage");
  assert.match(source, /sandboxed previews/i, "checklist must keep preview isolation coverage");
  assert.match(source, /telemetry payloads|telemetry\/diagnostics/i, "checklist must keep diagnostics coverage");
  assert.match(source, /accepted risks|accepted or deferred/i, "checklist must keep decision-log coverage");
  assert.match(source, /AI output security review/i, "checklist must link AI output review guidance");
});

test("security review template keeps reusable evidence fields", async () => {
  const source = await read(templatePath);

  for (const field of reusableTemplateFields) {
    assert.match(source, new RegExp(escapeRegExp(field), "i"), `missing template field: ${field}`);
  }

  assert.match(source, /telemetry payloads, diagnostics bundles/i, "template must include diagnostics assets in scope");
  assert.match(source, /\| Abuse case \| Expected safe outcome \| Evidence \|/, "template must keep abuse-case evidence table");
  assert.match(source, /\| Decision \| Reason \| Evidence \| Owner \| Follow-up \|/, "template must keep decision-log table");
  assert.match(source, /Remaining manual release checks have an owner and release phase\./, "template must keep release ownership gate");
});

test("security review examples keep copyable high-risk evidence", async () => {
  const source = await read(examplesPath);

  for (const section of exampleSections) {
    assert.match(source, new RegExp(`^${escapeRegExp(section)}$`, "m"), `missing example section: ${section}`);
  }

  assert.match(source, /Trust boundary changed:/i, "examples must keep trust-boundary field");
  assert.match(source, /Sensitive assets touched:/i, "examples must keep sensitive-assets field");
  assert.match(source, /Automated checks:/i, "examples must keep automated-checks field");
  assert.match(source, /Blocked input cases:/i, "examples must keep blocked-input field");
  assert.match(source, /Remaining manual release checks:/i, "examples must keep release-check field");
  assert.match(source, /AI output, renderer handoff, generated actions, and invalid-output fallback/i, "examples must keep AI handoff triage guidance");
});

test("AI output review guide keeps renderer handoff gates", async () => {
  const source = await read(aiOutputGuidePath);

  for (const section of ["# AI output security review", "## Review triggers", "## Contract boundary", "## Dangerous output cases", "## Evidence to include in PRs", "## Reviewer checklist"]) {
    assert.match(source, new RegExp(`^${escapeRegExp(section)}$`, "m"), `missing AI output section: ${section}`);
  }

  assert.match(source, /Renderer handoff schema or parser is explicit and checked before side effects\./i, "guide must require renderer contract checks");
  assert.match(source, /Invalid output fails with visible recovery guidance/i, "guide must require safe fallback UX");
  assert.match(source, /Telemetry and diagnostics do not collect raw prompts/i, "guide must require diagnostics redaction coverage");
});

test("GitHub pull request template keeps lightweight security gates", async () => {
  const source = await read(githubPrTemplatePath);

  for (const field of githubTemplateFields) {
    assert.match(source, new RegExp(escapeRegExp(field), "i"), `missing GitHub PR template field: ${field}`);
  }

  assert.match(source, /Complete this section when "Security-sensitive flow" is checked/i, "GitHub template must require security review when checked");
  assert.match(source, /Write "Not applicable" with a short reason/i, "GitHub template must require an explicit non-applicable reason");
});

async function read(path: URL): Promise<string> {
  return readFile(path, "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
