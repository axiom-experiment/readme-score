#!/usr/bin/env node
'use strict';

const { scoreFile, grade, CHECKS } = require('../src/index');
const path = require('node:path');

const VERSION = require('../package.json').version;
const NAME = 'readme-score';

// ── Helpers ──────────────────────────────────────────────────────────────────

const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';
const RED    = '\x1b[31m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const WHITE  = '\x1b[37m';

function colorForScore(n) {
  if (n >= 80) return GREEN;
  if (n >= 60) return YELLOW;
  return RED;
}

function gradeMessage(g) {
  const messages = {
    'A+': 'Excellent! Your README is comprehensive and well-documented.',
    'A':  'Great job! Just a few tweaks to reach perfect.',
    'B':  'Good README. Some sections need attention.',
    'C':  'Decent start. Several important sections are missing.',
    'D':  'Needs significant improvement. Missing key sections.',
    'F':  'README needs major work. Many essential sections are missing.',
  };
  return messages[g] || '';
}

function bar(earned, available, width = 20) {
  const filled = Math.round((earned / available) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

// ── Argument parsing ──────────────────────────────────────────────────────────

const rawArgs = process.argv.slice(2);
const flags = new Set();
let minScore = null;
const positional = [];

for (let i = 0; i < rawArgs.length; i++) {
  const a = rawArgs[i];
  if (a === '--json')    { flags.add('json');    continue; }
  if (a === '--quiet')   { flags.add('quiet');   continue; }
  if (a === '--help' || a === '-h')    { flags.add('help');    continue; }
  if (a === '--version' || a === '-v') { flags.add('version'); continue; }
  if (a === '--min') {
    const n = parseInt(rawArgs[++i], 10);
    if (isNaN(n) || n < 0 || n > 100) {
      console.error(`${RED}Error:${RESET} --min requires a number between 0 and 100`);
      process.exit(1);
    }
    minScore = n;
    continue;
  }
  if (!a.startsWith('-')) {
    positional.push(a);
  }
}

// ── --version ────────────────────────────────────────────────────────────────

if (flags.has('version')) {
  console.log(`${NAME} v${VERSION}`);
  process.exit(0);
}

// ── --help ────────────────────────────────────────────────────────────────────

if (flags.has('help')) {
  console.log(`
${BOLD}${NAME} v${VERSION}${RESET} — Score your README.md on completeness (0-100)

${BOLD}Usage:${RESET}
  readme-score [path] [options]

${BOLD}Arguments:${RESET}
  path          Path to README file (default: ./README.md)

${BOLD}Options:${RESET}
  --json        Output results as JSON
  --quiet       Suppress output; use exit code only
  --min <n>     Exit with code 1 if score is below n (CI mode)
  --version     Show version number
  --help        Show this help

${BOLD}Examples:${RESET}
  readme-score
  readme-score ./docs/README.md
  readme-score --json
  readme-score --min 70
  readme-score --min 80 --quiet

${BOLD}Exit codes:${RESET}
  0  Score meets or exceeds --min threshold (or no threshold set)
  1  Score is below --min threshold, or file not found

${BOLD}Scoring rubric (100 pts total):${RESET}
${CHECKS.map((c) => `  ${c.points.toString().padStart(3)} pts  ${c.category.padEnd(22)} ${c.description}`).join('\n')}
`);
  process.exit(0);
}

// ── Main ──────────────────────────────────────────────────────────────────────

const targetFile = positional[0] || 'README.md';

let result;
try {
  result = scoreFile(targetFile);
} catch (err) {
  if (!flags.has('quiet')) {
    console.error(`${RED}Error:${RESET} ${err.message}`);
  }
  process.exit(1);
}

// ── --json output ─────────────────────────────────────────────────────────────

if (flags.has('json')) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(minScore !== null && result.total < minScore ? 1 : 0);
}

// ── --quiet ───────────────────────────────────────────────────────────────────

if (flags.has('quiet')) {
  process.exit(minScore !== null && result.total < minScore ? 1 : 0);
}

// ── Human-readable output ─────────────────────────────────────────────────────

const { total, max, categories, suggestions } = result;
const g = grade(total);
const scoreColor = colorForScore(total);
const absPath = path.resolve(targetFile);

console.log('');
console.log(`${BOLD}${CYAN}readme-score${RESET} ${DIM}v${VERSION}${RESET}`);
console.log(`${DIM}${'─'.repeat(60)}${RESET}`);
console.log(`  File:  ${DIM}${absPath}${RESET}`);
console.log(`  Score: ${BOLD}${scoreColor}${total}/${max}${RESET}  Grade: ${BOLD}${scoreColor}${g}${RESET}`);
console.log(`  ${DIM}${gradeMessage(g)}${RESET}`);
console.log('');

console.log(`${BOLD}  Category Breakdown:${RESET}`);

const maxCatLen = Math.max(...Object.keys(categories).map((k) => k.length));
for (const [cat, data] of Object.entries(categories)) {
  const pct = Math.round((data.points_earned / data.points_available) * 100);
  const catColor = pct === 100 ? GREEN : pct >= 50 ? YELLOW : RED;
  const b = bar(data.points_earned, data.points_available, 15);
  console.log(
    `  ${catColor}${b}${RESET}  ${cat.padEnd(maxCatLen + 2)}${DIM}${data.points_earned}/${data.points_available} pts${RESET}`
  );

  for (const check of data.checks) {
    const icon = check.passed ? `${GREEN}✔${RESET}` : `${RED}✘${RESET}`;
    const desc = check.passed
      ? `${DIM}${check.description}${RESET}`
      : `${WHITE}${check.description}${RESET}`;
    console.log(`       ${icon}  ${desc}`);
  }
  console.log('');
}

if (suggestions.length > 0) {
  console.log(`${BOLD}  Suggestions (${suggestions.length}):${RESET}`);
  for (const s of suggestions) {
    console.log(`  ${YELLOW}→${RESET}  ${s}`);
  }
  console.log('');
}

if (minScore !== null) {
  if (total >= minScore) {
    console.log(`  ${GREEN}✔${RESET}  Score ${total} meets minimum threshold of ${minScore}.`);
  } else {
    console.log(`  ${RED}✘${RESET}  Score ${total} is below minimum threshold of ${minScore}.`);
    console.log('');
    process.exit(1);
  }
}

console.log(`${DIM}${'─'.repeat(60)}${RESET}`);
console.log('');

process.exit(0);
