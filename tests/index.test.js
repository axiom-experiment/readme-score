'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { score, scoreFile, grade, CHECKS } = require('../src/index');

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PERFECT_README = `
# my-package

A lightweight utility for doing awesome things with Node.js and JavaScript.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com)
[![npm version](https://img.shields.io/npm/v/my-package)](https://npmjs.com)

## Features

- Zero dependencies
- Cross-platform
- Fully tested

## Installation

\`\`\`bash
npm install my-package
\`\`\`

## Usage

\`\`\`js
const pkg = require('my-package');
pkg.doThing({ option: true });
\`\`\`

## API Reference

### \`doThing(options)\`

Does the thing. Returns a Promise.

**Parameters:**
- \`options.option\` (boolean) — Enable the feature.

## CLI Reference

### Options

| Flag | Description |
|------|-------------|
| --verbose | Enable verbose output |

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## License

MIT License. Copyright (c) 2026 AXIOM Agent.
`.trim();

const EMPTY_README = '';

const MINIMAL_README = `
# Just a Title

Some short text.
`.trim();

// ── CHECKS constant ───────────────────────────────────────────────────────────

describe('CHECKS', () => {
  it('is exported as an array', () => {
    assert.ok(Array.isArray(CHECKS), 'CHECKS should be an array');
  });

  it('has exactly 14 checks', () => {
    assert.strictEqual(CHECKS.length, 14);
  });

  it('sums to exactly 100 points', () => {
    const total = CHECKS.reduce((sum, c) => sum + c.points, 0);
    assert.strictEqual(total, 100);
  });
});

// ── grade() ───────────────────────────────────────────────────────────────────

describe('grade()', () => {
  it('returns A+ for score of 100', () => {
    assert.strictEqual(grade(100), 'A+');
  });

  it('returns A+ for score of 90', () => {
    assert.strictEqual(grade(90), 'A+');
  });

  it('returns A for score of 80', () => {
    assert.strictEqual(grade(80), 'A');
  });

  it('returns A for score of 89', () => {
    assert.strictEqual(grade(89), 'A');
  });

  it('returns B for score of 70', () => {
    assert.strictEqual(grade(70), 'B');
  });

  it('returns B for score of 79', () => {
    assert.strictEqual(grade(79), 'B');
  });

  it('returns C for score of 60', () => {
    assert.strictEqual(grade(60), 'C');
  });

  it('returns C for score of 69', () => {
    assert.strictEqual(grade(69), 'C');
  });

  it('returns D for score of 50', () => {
    assert.strictEqual(grade(50), 'D');
  });

  it('returns D for score of 59', () => {
    assert.strictEqual(grade(59), 'D');
  });

  it('returns F for score of 49', () => {
    assert.strictEqual(grade(49), 'F');
  });

  it('returns F for score of 0', () => {
    assert.strictEqual(grade(0), 'F');
  });
});

// ── score() — result structure ────────────────────────────────────────────────

describe('score() result structure', () => {
  it('returns an object with required top-level keys', () => {
    const result = score(PERFECT_README);
    assert.ok('total' in result, 'missing: total');
    assert.ok('max' in result, 'missing: max');
    assert.ok('grade' in result, 'missing: grade');
    assert.ok('categories' in result, 'missing: categories');
    assert.ok('suggestions' in result, 'missing: suggestions');
    assert.ok('checks' in result, 'missing: checks');
  });

  it('max is always 100', () => {
    assert.strictEqual(score(PERFECT_README).max, 100);
    assert.strictEqual(score(EMPTY_README).max, 100);
  });

  it('total is 0 for empty string', () => {
    assert.strictEqual(score(EMPTY_README).total, 0);
  });

  it('total is 100 for perfect README', () => {
    assert.strictEqual(score(PERFECT_README).total, 100);
  });

  it('checks array length equals CHECKS.length', () => {
    const result = score(PERFECT_README);
    assert.strictEqual(result.checks.length, CHECKS.length);
  });

  it('grade matches expected value for perfect README', () => {
    assert.strictEqual(score(PERFECT_README).grade, 'A+');
  });

  it('grade is F for empty README', () => {
    assert.strictEqual(score(EMPTY_README).grade, 'F');
  });
});

// ── score() — individual checks ───────────────────────────────────────────────

describe('score() individual checks', () => {

  describe('has_title', () => {
    it('passes when README has an H1 heading', () => {
      const result = score('# My Package\n\nSome description here.');
      const check = result.checks.find((c) => c.id === 'has_title');
      assert.strictEqual(check.passed, true);
      assert.strictEqual(check.points_earned, 5);
    });

    it('fails when README has no H1 (only H2)', () => {
      const result = score('## Installation\n\nnpm install foo');
      const check = result.checks.find((c) => c.id === 'has_title');
      assert.strictEqual(check.passed, false);
      assert.strictEqual(check.points_earned, 0);
    });

    it('fails for empty string', () => {
      const check = score('').checks.find((c) => c.id === 'has_title');
      assert.strictEqual(check.passed, false);
    });
  });

  describe('has_description', () => {
    it('passes with a prose paragraph of ≥30 chars', () => {
      const md = '# Title\n\nA lightweight utility for handling amazing things in Node.js.';
      const check = score(md).checks.find((c) => c.id === 'has_description');
      assert.strictEqual(check.passed, true);
    });

    it('fails when only short text exists', () => {
      const md = '# Title\n\nShort text.';
      const check = score(md).checks.find((c) => c.id === 'has_description');
      assert.strictEqual(check.passed, false);
    });

    it('fails when only headings and list items exist', () => {
      const md = '# Title\n\n## Features\n\n- Item one\n- Item two';
      const check = score(md).checks.find((c) => c.id === 'has_description');
      assert.strictEqual(check.passed, false);
    });

    it('fails when only badges appear before headings', () => {
      const md = '# Title\n\n[![Build](https://img.shields.io/badge/build-passing)](https://example.com)\n\n## Usage';
      const check = score(md).checks.find((c) => c.id === 'has_description');
      assert.strictEqual(check.passed, false);
    });
  });

  describe('has_badge', () => {
    it('passes with standard [![ badge syntax', () => {
      const md = '# Title\n\n[![Build](https://img.shields.io/badge/build-passing)](https://example.com)';
      const check = score(md).checks.find((c) => c.id === 'has_badge');
      assert.strictEqual(check.passed, true);
    });

    it('passes with shields.io image badge (no link wrap)', () => {
      const md = '# Title\n\n![Status](https://img.shields.io/badge/status-active-green)';
      const check = score(md).checks.find((c) => c.id === 'has_badge');
      assert.strictEqual(check.passed, true);
    });

    it('passes with badge.fury.io badge', () => {
      const md = '# Title\n\n![Version](https://badge.fury.io/js/my-package.svg)';
      const check = score(md).checks.find((c) => c.id === 'has_badge');
      assert.strictEqual(check.passed, true);
    });

    it('fails when no badge is present', () => {
      const md = '# Title\n\nA description without any badges.';
      const check = score(md).checks.find((c) => c.id === 'has_badge');
      assert.strictEqual(check.passed, false);
    });
  });

  describe('has_install_section', () => {
    it('passes with ## Installation heading', () => {
      const md = '# Pkg\n\n## Installation\n\nnpm install pkg';
      const check = score(md).checks.find((c) => c.id === 'has_install_section');
      assert.strictEqual(check.passed, true);
    });

    it('passes with ## Getting Started heading', () => {
      const md = '# Pkg\n\n## Getting Started\n\nnpm install pkg';
      const check = score(md).checks.find((c) => c.id === 'has_install_section');
      assert.strictEqual(check.passed, true);
    });

    it('passes with ## Setup heading', () => {
      const md = '# Pkg\n\n## Setup\n\nnpm install pkg';
      const check = score(md).checks.find((c) => c.id === 'has_install_section');
      assert.strictEqual(check.passed, true);
    });

    it('fails with no install section', () => {
      const md = '# Pkg\n\nA description.\n\n## Usage\n\nHere is how.';
      const check = score(md).checks.find((c) => c.id === 'has_install_section');
      assert.strictEqual(check.passed, false);
    });
  });

  describe('has_install_command', () => {
    it('passes with npm install command', () => {
      const md = '## Installation\n\n```bash\nnpm install my-pkg\n```';
      const check = score(md).checks.find((c) => c.id === 'has_install_command');
      assert.strictEqual(check.passed, true);
    });

    it('passes with yarn add command', () => {
      const md = '## Installation\n\n```bash\nyarn add my-pkg\n```';
      const check = score(md).checks.find((c) => c.id === 'has_install_command');
      assert.strictEqual(check.passed, true);
    });

    it('passes with npx command', () => {
      const md = 'Run it with `npx my-pkg`';
      const check = score(md).checks.find((c) => c.id === 'has_install_command');
      assert.strictEqual(check.passed, true);
    });

    it('fails without install command', () => {
      const md = '# Title\n\nA description without install instructions.';
      const check = score(md).checks.find((c) => c.id === 'has_install_command');
      assert.strictEqual(check.passed, false);
    });
  });

  describe('has_usage_section', () => {
    it('passes with ## Usage heading', () => {
      const md = '## Usage\n\nHere is how to use this.';
      const check = score(md).checks.find((c) => c.id === 'has_usage_section');
      assert.strictEqual(check.passed, true);
    });

    it('passes with ## Examples heading', () => {
      const md = '## Examples\n\nSome examples.';
      const check = score(md).checks.find((c) => c.id === 'has_usage_section');
      assert.strictEqual(check.passed, true);
    });

    it('passes with ## Example heading (singular)', () => {
      const md = '## Example\n\nOne example.';
      const check = score(md).checks.find((c) => c.id === 'has_usage_section');
      assert.strictEqual(check.passed, true);
    });

    it('fails without usage heading', () => {
      const md = '# Title\n\nJust a description.';
      const check = score(md).checks.find((c) => c.id === 'has_usage_section');
      assert.strictEqual(check.passed, false);
    });
  });

  describe('has_code_block', () => {
    it('passes with a fenced code block', () => {
      const md = '## Usage\n\n```js\nconst x = 1;\n```';
      const check = score(md).checks.find((c) => c.id === 'has_code_block');
      assert.strictEqual(check.passed, true);
    });

    it('fails without any code block', () => {
      const md = '# Title\n\nA description without code examples.';
      const check = score(md).checks.find((c) => c.id === 'has_code_block');
      assert.strictEqual(check.passed, false);
    });
  });

  describe('has_api_section', () => {
    it('passes with ## API heading', () => {
      const md = '## API\n\n### fn()\n\nDoes a thing.';
      const check = score(md).checks.find((c) => c.id === 'has_api_section');
      assert.strictEqual(check.passed, true);
    });

    it('passes with ## API Reference heading', () => {
      const md = '## API Reference\n\nFull API here.';
      const check = score(md).checks.find((c) => c.id === 'has_api_section');
      assert.strictEqual(check.passed, true);
    });

    it('passes with ## CLI Reference heading', () => {
      const md = '## CLI Reference\n\n--flag   Does a thing';
      const check = score(md).checks.find((c) => c.id === 'has_api_section');
      assert.strictEqual(check.passed, true);
    });

    it('passes with ## Options heading', () => {
      const md = '## Options\n\n| Flag | Description |';
      const check = score(md).checks.find((c) => c.id === 'has_api_section');
      assert.strictEqual(check.passed, true);
    });

    it('fails without API section', () => {
      const md = '# Title\n\n## Usage\n\nSome usage info.';
      const check = score(md).checks.find((c) => c.id === 'has_api_section');
      assert.strictEqual(check.passed, false);
    });
  });

  describe('has_contributing_section', () => {
    it('passes with ## Contributing heading', () => {
      const md = '## Contributing\n\nPRs are welcome!';
      const check = score(md).checks.find((c) => c.id === 'has_contributing_section');
      assert.strictEqual(check.passed, true);
    });

    it('passes with ## Contributions heading', () => {
      const md = '## Contributions\n\nWe welcome them.';
      const check = score(md).checks.find((c) => c.id === 'has_contributing_section');
      assert.strictEqual(check.passed, true);
    });

    it('fails without contributing heading', () => {
      const md = '# Title\n\n## License\n\nMIT';
      const check = score(md).checks.find((c) => c.id === 'has_contributing_section');
      assert.strictEqual(check.passed, false);
    });
  });

  describe('has_contributing_link', () => {
    it('passes when CONTRIBUTING.md is mentioned', () => {
      const md = 'See [CONTRIBUTING.md](CONTRIBUTING.md) before submitting.';
      const check = score(md).checks.find((c) => c.id === 'has_contributing_link');
      assert.strictEqual(check.passed, true);
    });

    it('passes with uppercase CONTRIBUTING.MD', () => {
      const md = 'Read CONTRIBUTING.MD first.';
      const check = score(md).checks.find((c) => c.id === 'has_contributing_link');
      assert.strictEqual(check.passed, true);
    });

    it('fails without any CONTRIBUTING.md reference', () => {
      const md = '## Contributing\n\nPRs are welcome via GitHub.';
      const check = score(md).checks.find((c) => c.id === 'has_contributing_link');
      assert.strictEqual(check.passed, false);
    });
  });

  describe('has_license_section', () => {
    it('passes with ## License heading', () => {
      const md = '## License\n\nMIT';
      const check = score(md).checks.find((c) => c.id === 'has_license_section');
      assert.strictEqual(check.passed, true);
    });

    it('passes with ## Licence heading (British spelling)', () => {
      const md = '## Licence\n\nMIT';
      const check = score(md).checks.find((c) => c.id === 'has_license_section');
      assert.strictEqual(check.passed, true);
    });

    it('fails without license heading', () => {
      const md = '# Title\n\nThis project uses the MIT license.';
      const check = score(md).checks.find((c) => c.id === 'has_license_section');
      assert.strictEqual(check.passed, false);
    });
  });

  describe('has_license_type', () => {
    it('passes with MIT mentioned', () => {
      const md = '## License\n\nMIT License.';
      const check = score(md).checks.find((c) => c.id === 'has_license_type');
      assert.strictEqual(check.passed, true);
    });

    it('passes with Apache 2.0 mentioned', () => {
      const md = '## License\n\nApache 2.0';
      const check = score(md).checks.find((c) => c.id === 'has_license_type');
      assert.strictEqual(check.passed, true);
    });

    it('passes with ISC mentioned', () => {
      const md = '## License\n\nISC License.';
      const check = score(md).checks.find((c) => c.id === 'has_license_type');
      assert.strictEqual(check.passed, true);
    });

    it('passes with GPL mentioned', () => {
      const md = '## License\n\nGPL-3.0';
      const check = score(md).checks.find((c) => c.id === 'has_license_type');
      assert.strictEqual(check.passed, true);
    });

    it('fails without a specific license type', () => {
      const md = '## License\n\nSee the LICENSE file for details.';
      const check = score(md).checks.find((c) => c.id === 'has_license_type');
      assert.strictEqual(check.passed, false);
    });
  });

  describe('has_features_section', () => {
    it('passes with ## Features heading', () => {
      const md = '## Features\n\n- Fast\n- Zero deps';
      const check = score(md).checks.find((c) => c.id === 'has_features_section');
      assert.strictEqual(check.passed, true);
    });

    it('passes with ## Feature heading (singular)', () => {
      const md = '## Feature\n\n- One feature';
      const check = score(md).checks.find((c) => c.id === 'has_features_section');
      assert.strictEqual(check.passed, true);
    });

    it('passes with ## Highlights heading', () => {
      const md = '## Highlights\n\n- Amazing things';
      const check = score(md).checks.find((c) => c.id === 'has_features_section');
      assert.strictEqual(check.passed, true);
    });

    it('fails without features heading', () => {
      const md = '# Title\n\n## Installation\n\nnpm install';
      const check = score(md).checks.find((c) => c.id === 'has_features_section');
      assert.strictEqual(check.passed, false);
    });
  });

  describe('has_changelog', () => {
    it('passes with ## Changelog heading', () => {
      const md = '## Changelog\n\n### v1.0.0\n\n- Initial release';
      const check = score(md).checks.find((c) => c.id === 'has_changelog');
      assert.strictEqual(check.passed, true);
    });

    it('passes with CHANGELOG.md mentioned', () => {
      const md = 'See [CHANGELOG.md](CHANGELOG.md) for version history.';
      const check = score(md).checks.find((c) => c.id === 'has_changelog');
      assert.strictEqual(check.passed, true);
    });

    it('passes with ## Change Log heading (two words)', () => {
      const md = '## Change Log\n\n- v1.0.0: Initial release';
      const check = score(md).checks.find((c) => c.id === 'has_changelog');
      assert.strictEqual(check.passed, true);
    });

    it('fails without any changelog reference', () => {
      const md = '# Title\n\n## License\n\nMIT';
      const check = score(md).checks.find((c) => c.id === 'has_changelog');
      assert.strictEqual(check.passed, false);
    });
  });
});

// ── score() — categories object ───────────────────────────────────────────────

describe('score() categories grouping', () => {
  it('groups checks under the correct category keys', () => {
    const result = score(PERFECT_README);
    const expectedCategories = [
      'Title & Description',
      'Badges',
      'Installation',
      'Usage & Examples',
      'API Documentation',
      'Contributing',
      'License',
      'Extras',
    ];
    for (const cat of expectedCategories) {
      assert.ok(cat in result.categories, `Missing category: ${cat}`);
    }
  });

  it('each category has points_earned, points_available, and checks array', () => {
    const result = score(PERFECT_README);
    for (const [, data] of Object.entries(result.categories)) {
      assert.ok(typeof data.points_earned === 'number');
      assert.ok(typeof data.points_available === 'number');
      assert.ok(Array.isArray(data.checks));
    }
  });

  it('category points_available sums to 100 across all categories', () => {
    const result = score(EMPTY_README);
    const total = Object.values(result.categories).reduce(
      (sum, c) => sum + c.points_available,
      0
    );
    assert.strictEqual(total, 100);
  });
});

// ── score() — suggestions ─────────────────────────────────────────────────────

describe('score() suggestions', () => {
  it('returns empty array for a perfect README', () => {
    const result = score(PERFECT_README);
    assert.strictEqual(result.suggestions.length, 0);
  });

  it('returns 14 suggestions for empty README', () => {
    const result = score(EMPTY_README);
    assert.strictEqual(result.suggestions.length, 14);
  });

  it('suggestions reference the points available', () => {
    const result = score(EMPTY_README);
    for (const s of result.suggestions) {
      assert.ok(/\+\d+ pts/.test(s), `Suggestion missing points: ${s}`);
    }
  });
});

// ── score() — error handling ──────────────────────────────────────────────────

describe('score() error handling', () => {
  it('throws TypeError for null input', () => {
    assert.throws(() => score(null), TypeError);
  });

  it('throws TypeError for number input', () => {
    assert.throws(() => score(42), TypeError);
  });

  it('throws TypeError for object input', () => {
    assert.throws(() => score({}), TypeError);
  });

  it('handles very long string without throwing', () => {
    const longMd = '# Title\n\n' + 'A '.repeat(10000) + '\n\n## License\n\nMIT';
    assert.doesNotThrow(() => score(longMd));
  });
});

// ── scoreFile() ───────────────────────────────────────────────────────────────

describe('scoreFile()', () => {
  it('throws for a non-existent file', () => {
    assert.throws(() => scoreFile('/nonexistent/path/README.md'), /File not found/);
  });

  it('scores a real temp file correctly', () => {
    const tmpFile = path.join(os.tmpdir(), `readme-score-test-${Date.now()}.md`);
    fs.writeFileSync(tmpFile, '# Test\n\nA short description that is long enough.\n\n## License\n\nMIT');
    try {
      const result = scoreFile(tmpFile);
      assert.ok(result.total > 0);
      assert.strictEqual(result.max, 100);
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  it('returns identical result to score() for same content', () => {
    const tmpFile = path.join(os.tmpdir(), `readme-score-test-${Date.now()}.md`);
    fs.writeFileSync(tmpFile, PERFECT_README);
    try {
      const fromFile = scoreFile(tmpFile);
      const fromString = score(PERFECT_README);
      assert.strictEqual(fromFile.total, fromString.total);
      assert.strictEqual(fromFile.grade, fromString.grade);
      assert.strictEqual(fromFile.suggestions.length, fromString.suggestions.length);
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  it('resolves relative paths correctly', () => {
    const tmpFile = path.join(os.tmpdir(), `readme-score-test-${Date.now()}.md`);
    fs.writeFileSync(tmpFile, PERFECT_README);
    try {
      const result = scoreFile(tmpFile);
      assert.strictEqual(result.total, 100);
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });
});
