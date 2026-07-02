import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const aiOutputGuidePath = new URL("../docs/ai-output-security-review.md", import.meta.url);
const checklistPath = new URL("../docs/security-review-checklist.md", import.meta.url);
const templatePath = new URL("../docs/security-review-pr-template.md", import.meta.url);
const examplesPath = new URL("../docs/security-review-examples.md", import.meta.url);

const requiredGuideSections = [
  "# AI output security review",
  "## Review triggers",
  "## Contract boundary",
  "## Dangerous output cases",
  "## Minimal regression fixture matrix",
  "## Evidence to include in PRs",
  "## Reviewer checklist",
];

const requiredOutputCases = [
  "JSON contains extra executable fields such as `command`, `script`, or `postinstall`",
  "Generated HTML includes `<script>`, event handlers, external fonts, or remote media",
  "Generated CSS tries `url(file://...)`, private network URLs, or credential-like query strings",
  "Generated file path contains traversal, absolute paths, shell metacharacters, or hidden config targets",
  "Model output is huge, malformed, or missing required sections",
  "Prompt or design content is copied into telemetry, diagnostics, or crash reports",
];

const requiredFixtureRows = [
  "Valid minimal renderer payload",
  "Unknown executable action field",
  "Unsafe remote or local URL",
  "Path traversal or absolute file path",
  "Oversized or malformed output",
  "Telemetry-shaped prompt/design leak",
];

const requiredFixtureAssertions = [
  "Accepted output renders or persists only documented fields",
  "`command`, `script`, `postinstall`, or equivalent fields cannot trigger actions",
  "Private IPs, `file://`, localhost, credential-bearing URLs, and redirects are blocked or stripped",
  "Writes stay inside the intended workspace/export directory after decoding and normalization",
  "No partial file write, preview mutation, telemetry upload, or agent action is committed",
  "Raw prompts, local paths, design files, generated artifacts, and secrets are redacted by default",
];

const requiredEvidenceTerms = [
  "AI/model/agent output is treated as untrusted input.",
  "Renderer handoff schema or parser is explicit and checked before side effects.",
  "Unknown action fields, scripts, unsafe URLs, unsafe paths, and oversized output were considered.",
  "Generated actions require preview, confirmation, or a documented safe gate before touching files, network, agents, or desktop privileges.",
  "Invalid output fails with visible recovery guidance and does not commit partial unsafe state.",
  "Telemetry and diagnostics do not collect raw prompts, design files, generated artifacts, local paths, or secrets by default.",
];

test("AI output guide keeps explicit review coverage", async () => {
  const source = await readGuide();

  for (const section of requiredGuideSections) {
    assert.match(source, new RegExp(`^${escapeRegExp(section)}$`, "m"), `missing section: ${section}`);
  }

  for (const outputCase of requiredOutputCases) {
    assert.match(source, new RegExp(escapeRegExp(outputCase), "i"), `missing AI output abuse case: ${outputCase}`);
  }

  for (const term of requiredEvidenceTerms) {
    assert.match(source, new RegExp(escapeRegExp(term), "i"), `missing reviewer checklist term: ${term}`);
  }
});

test("AI output guide keeps a minimum regression fixture matrix", async () => {
  const source = await readGuide();

  for (const fixture of requiredFixtureRows) {
    assert.match(source, new RegExp(escapeRegExp(fixture), "i"), `missing AI output fixture row: ${fixture}`);
  }

  for (const assertion of requiredFixtureAssertions) {
    assert.match(source, new RegExp(escapeRegExp(assertion), "i"), `missing AI output fixture assertion: ${assertion}`);
  }

  assert.match(source, /without provider access, network access, desktop permissions, or real user projects/i, "fixture guidance must remain offline and deterministic");
  assert.match(source, /document the temporary gap, the manual evidence used, and the owner of the missing automated fixture/i, "fixture gaps must require explicit follow-up evidence");
});

test("security review docs link AI output handoff review", async () => {
  const checklist = await readFile(checklistPath, "utf8");
  const template = await readFile(templatePath, "utf8");
  const examples = await readFile(examplesPath, "utf8");

  assert.match(checklist, /docs\/ai-output-security-review\.md|AI output security review/i, "checklist must link AI output review guidance");
  assert.match(checklist, /model output, agent output, renderer handoff, and generated actions/i, "checklist must include AI output as a security surface");
  assert.match(template, /AI output handoff:/i, "reusable PR template must ask for AI output evidence");
  assert.match(examples, /## AI output and renderer handoff/i, "examples must include AI output handoff evidence");
});

async function readGuide(): Promise<string> {
  return readFile(aiOutputGuidePath, "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
