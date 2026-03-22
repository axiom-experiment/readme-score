# readme-score

[![npm version](https://img.shields.io/npm/v/readme-score)](https://www.npmjs.com/package/readme-score)
[![Build Status](https://img.shields.io/badge/tests-88%20passing-brightgreen)](https://github.com/axiom-agent/readme-score)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

Score your README.md on completeness (0–100) and get actionable suggestions to improve it. Zero runtime dependencies. Works as a CLI, in CI pipelines, and as a programmatic Node.js API.

## Features

- **14 checks** across 7 categories (Title, Badges, Installation, Usage, API docs, Contributing, License, Extras)
- **100-point scoring system** — know exactly where your README falls short
- **Letter grades** — A+ to F, instantly readable
- **Actionable suggestions** — each failed check tells you exactly what to add and how many points it's worth
- **CI mode** — `--min <score>` flag fails the build if README quality drops below your threshold
- **JSON output** — pipe results into other tools
- **Zero dependencies** — nothing to install beyond readme-score itself

## Installation

```bash
npm install -g readme-score
```

Or run without installing:

```bash
npx readme-score
```

## Usage

Score the README.md in your current directory:

```bash
readme-score
```

Score a specific file:

```bash
readme-score ./docs/README.md
```

Fail the build if score drops below 70 (CI mode):

```bash
readme-score --min 70
```

Output results as JSON:

```bash
readme-score --json
```

Silent check (exit code only, no output):

```bash
readme-score --min 80 --quiet
```

### Example Output

```
readme-score v1.0.0
────────────────────────────────────────────────────────────
  File:  /projects/my-pkg/README.md
  Score: 75/100  Grade: B
  Good README. Some sections need attention.

  Category Breakdown:
  ███████████████████░  Title & Description   15/15 pts
    ✔  Has an H1 title (# Title)
    ✔  Has a prose description paragraph (≥30 characters)
  ███████████████████░  Badges               10/10 pts
    ✔  Has at least one badge (build, npm, license, etc.)
  ...
  ░░░░░░░░░░░░░░░░░░░░  API Documentation     0/15 pts
    ✘  Has an API, reference, or CLI reference section

  Suggestions (1):
  →  Add has an api, reference, or cli reference section (+15 pts)
```

## API Reference

### `score(content)`

Score a markdown string.

```js
const { score } = require('readme-score');

const markdown = require('fs').readFileSync('./README.md', 'utf8');
const result = score(markdown);

console.log(result.total);      // 85
console.log(result.grade);      // 'A'
console.log(result.suggestions); // ['Add a changelog or version history (+2 pts)']
```

**Parameters:**
- `content` `{string}` — Raw markdown content

**Returns:** `ScoreResult` object:
```ts
{
  total: number;           // 0-100
  max: number;             // always 100
  grade: string;           // 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
  categories: {
    [name: string]: {
      points_earned: number;
      points_available: number;
      checks: CheckResult[];
    }
  };
  suggestions: string[];   // Actionable improvement hints
  checks: CheckResult[];   // All 14 individual check results
}
```

---

### `scoreFile(filePath)`

Score a README file on disk.

```js
const { scoreFile } = require('readme-score');

const result = scoreFile('./README.md');
console.log(`${result.total}/100 (${result.grade})`);
```

**Parameters:**
- `filePath` `{string}` — Absolute or relative path to the file

**Throws:** `Error` if the file is not found.

---

### `grade(total)`

Convert a numeric score to a letter grade.

```js
const { grade } = require('readme-score');

grade(95); // 'A+'
grade(82); // 'A'
grade(71); // 'B'
grade(65); // 'C'
grade(55); // 'D'
grade(30); // 'F'
```

---

### `CHECKS`

The full array of 14 check definitions. Useful for building custom tooling on top of readme-score.

```js
const { CHECKS } = require('readme-score');

CHECKS.forEach(c => {
  console.log(`${c.id}: ${c.points} pts — ${c.description}`);
});
```

---

## CLI Reference

```
Usage:
  readme-score [path] [options]

Arguments:
  path          Path to README file (default: ./README.md)

Options:
  --json        Output results as JSON
  --quiet       Suppress all output; use exit code only
  --min <n>     Exit with code 1 if score is below n (CI mode)
  --version     Show version number
  --help        Show help

Exit codes:
  0  Score meets or exceeds --min threshold (or no threshold set)
  1  Score below --min, or file not found
```

### CI Integration

Add to your GitHub Actions workflow:

```yaml
- name: Check README quality
  run: npx readme-score --min 70
```

Or in `package.json` scripts:

```json
{
  "scripts": {
    "lint:readme": "readme-score --min 70"
  }
}
```

## Scoring Rubric

| Category | Points | Checks |
|----------|--------|--------|
| Title & Description | 15 | H1 heading (5), prose description ≥30 chars (10) |
| Badges | 10 | At least one badge (10) |
| Installation | 15 | Install section heading (8), install command shown (7) |
| Usage & Examples | 20 | Usage section (8), fenced code block (12) |
| API Documentation | 15 | API/Reference/CLI/Options section (15) |
| Contributing | 10 | Contributing heading (5), CONTRIBUTING.md link (5) |
| License | 10 | License heading (5), specific license named (5) |
| Extras | 5 | Features/Highlights section (3), Changelog reference (2) |
| **Total** | **100** | **14 checks** |

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-check`)
3. Add your check to `src/index.js` with a `test()` function
4. Write tests in `tests/index.test.js` — all checks need pass/fail coverage
5. Submit a PR

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## License

MIT License. Copyright (c) 2026 AXIOM Agent.

---

> ♥ If readme-score helped you ship better documentation, consider [sponsoring on GitHub](https://github.com/sponsors/axiom-agent).
