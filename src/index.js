'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * readme-score — Score a README.md on completeness (0-100).
 * 14 checks across 7 categories. Zero runtime dependencies.
 */

/**
 * Scoring rubric — 14 checks totalling 100 points.
 * Each check has: id, category, points, description, test(md: string) => boolean
 */
const CHECKS = [
  // ── Title & Description (15 pts) ──────────────────────────────────────────
  {
    id: 'has_title',
    category: 'Title & Description',
    points: 5,
    description: 'Has an H1 title (# Title)',
    test: (md) => /^#\s+\S+/m.test(md),
  },
  {
    id: 'has_description',
    category: 'Title & Description',
    points: 10,
    description: 'Has a prose description paragraph (≥30 characters)',
    test: (md) => {
      const lines = md.split('\n');
      for (const line of lines) {
        const t = line.trim();
        if (!t) continue;
        if (/^#{1,6}\s/.test(t)) continue;         // headings
        if (/^[*\-+>]/.test(t)) continue;           // lists / blockquotes
        if (/^\d+\.\s/.test(t)) continue;           // ordered lists
        if (/^`{3}/.test(t)) continue;              // code fences
        if (/^\|/.test(t)) continue;                // tables
        if (/^\[!\[|^!\[/.test(t)) continue;        // badges / images
        if (t.length >= 30) return true;
      }
      return false;
    },
  },

  // ── Badges (10 pts) ───────────────────────────────────────────────────────
  {
    id: 'has_badge',
    category: 'Badges',
    points: 10,
    description: 'Has at least one badge (build, npm, license, etc.)',
    test: (md) =>
      /\[!\[/.test(md) ||
      /!\[.*?\]\(https?:\/\/img\.shields\.io/i.test(md) ||
      /!\[.*?\]\(https?:\/\/badge\.fury\.io/i.test(md),
  },

  // ── Installation (15 pts) ─────────────────────────────────────────────────
  {
    id: 'has_install_section',
    category: 'Installation',
    points: 8,
    description: 'Has an installation section heading',
    test: (md) =>
      /^#{1,3}\s*(install(ation)?|getting\s+started|setup|quick\s+start)/im.test(md),
  },
  {
    id: 'has_install_command',
    category: 'Installation',
    points: 7,
    description: 'Shows an install command (npm install, yarn add, or npx)',
    test: (md) => /npm\s+install|yarn\s+add|npx\s+/i.test(md),
  },

  // ── Usage & Examples (20 pts) ─────────────────────────────────────────────
  {
    id: 'has_usage_section',
    category: 'Usage & Examples',
    points: 8,
    description: 'Has a usage or examples section heading',
    test: (md) =>
      /^#{1,3}\s*(usage|example[s]?|how\s+to\s+use|quick\s+start)/im.test(md),
  },
  {
    id: 'has_code_block',
    category: 'Usage & Examples',
    points: 12,
    description: 'Has at least one fenced code block (```)',
    test: (md) => /```/.test(md),
  },

  // ── API Documentation (15 pts) ────────────────────────────────────────────
  {
    id: 'has_api_section',
    category: 'API Documentation',
    points: 15,
    description: 'Has an API, reference, or CLI reference section',
    test: (md) =>
      /^#{1,3}\s*(api(\s+reference)?|reference|cli(\s+reference)?|options|parameters|configuration)/im.test(
        md
      ),
  },

  // ── Contributing (10 pts) ─────────────────────────────────────────────────
  {
    id: 'has_contributing_section',
    category: 'Contributing',
    points: 5,
    description: 'Has a contributing section heading',
    test: (md) =>
      /^#{1,3}\s*(contribut(ing|ions?|e)|how\s+to\s+contribut)/im.test(md),
  },
  {
    id: 'has_contributing_link',
    category: 'Contributing',
    points: 5,
    description: 'References a CONTRIBUTING.md file',
    test: (md) => /CONTRIBUTING\.md/i.test(md),
  },

  // ── License (10 pts) ──────────────────────────────────────────────────────
  {
    id: 'has_license_section',
    category: 'License',
    points: 5,
    description: 'Has a license section heading',
    test: (md) => /^#{1,3}\s*licen[sc](e|ing)/im.test(md),
  },
  {
    id: 'has_license_type',
    category: 'License',
    points: 5,
    description: 'Names a specific license (MIT, Apache, ISC, GPL, etc.)',
    test: (md) =>
      /\b(MIT|Apache[-\s]?2?\.?0?|ISC|BSD[-\s]?[23]?-?Clause|GPL[-\s]?[23]?|LGPL|MPL|CC0|Unlicense)\b/i.test(
        md
      ),
  },

  // ── Extras (5 pts) ────────────────────────────────────────────────────────
  {
    id: 'has_features_section',
    category: 'Extras',
    points: 3,
    description: 'Has a features or highlights section',
    test: (md) =>
      /^#{1,3}\s*(features?|highlights?|what'?s?\s+included|capabilities)/im.test(md),
  },
  {
    id: 'has_changelog',
    category: 'Extras',
    points: 2,
    description: 'References a changelog or version history',
    test: (md) =>
      /^#{1,3}\s*(changelog|change\s+log|version\s+history|release\s+notes|history)/im.test(
        md
      ) || /CHANGELOG\.md/i.test(md),
  },
];

/**
 * Score markdown content against the README rubric.
 *
 * @param {string} content - Raw README markdown string
 * @returns {{ total: number, max: number, grade: string, categories: object, suggestions: string[], checks: object[] }}
 */
function score(content) {
  if (typeof content !== 'string') {
    throw new TypeError(`content must be a string, got ${typeof content}`);
  }

  const checks = CHECKS.map((check) => {
    let passed = false;
    try {
      passed = check.test(content);
    } catch (_) {
      passed = false;
    }
    return {
      id: check.id,
      category: check.category,
      description: check.description,
      points_available: check.points,
      points_earned: passed ? check.points : 0,
      passed,
    };
  });

  const total = checks.reduce((sum, c) => sum + c.points_earned, 0);
  const max = CHECKS.reduce((sum, c) => sum + c.points, 0);

  // Group by category
  const categories = {};
  for (const c of checks) {
    if (!categories[c.category]) {
      categories[c.category] = {
        points_earned: 0,
        points_available: 0,
        checks: [],
      };
    }
    categories[c.category].points_earned += c.points_earned;
    categories[c.category].points_available += c.points_available;
    categories[c.category].checks.push(c);
  }

  const suggestions = checks
    .filter((c) => !c.passed)
    .map((c) => `Add ${c.description.toLowerCase()} (+${c.points_available} pts)`);

  return {
    total,
    max,
    grade: grade(total),
    categories,
    suggestions,
    checks,
  };
}

/**
 * Score a README file on disk.
 *
 * @param {string} filePath - Path to the README file
 * @returns {ReturnType<typeof score>}
 */
function scoreFile(filePath) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found: ${resolved}`);
  }
  const content = fs.readFileSync(resolved, 'utf8');
  return score(content);
}

/**
 * Convert a numeric score to a letter grade.
 *
 * @param {number} total - Score 0-100
 * @returns {'A+' | 'A' | 'B' | 'C' | 'D' | 'F'}
 */
function grade(total) {
  if (total >= 90) return 'A+';
  if (total >= 80) return 'A';
  if (total >= 70) return 'B';
  if (total >= 60) return 'C';
  if (total >= 50) return 'D';
  return 'F';
}

module.exports = { score, scoreFile, grade, CHECKS };
