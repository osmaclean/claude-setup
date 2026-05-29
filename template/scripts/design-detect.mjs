#!/usr/bin/env node
// Design slop detector — CLI port of `.claude/rules/design-slop-detector.md`.
//
// Runs the deterministic rules from the rule file against the project (or a
// glob), reports findings with fingerprint, exits 0/1 depending on severity
// gate. Lets us catch the same things @design-qa catches without spawning an
// agent — useful in CI, in pre-commit, or for a quick scan during dev.
//
// Coverage: 12 of the 15 rules implemented via regex on file content. The
// remaining 3 (`focus-without-visible`, `ring-outline-overlap`,
// `redundant-md-hidden-block`) need AST analysis; they're flagged TODO and
// skipped here. The agent still catches them via Grep + judgment.
//
// Usage:
//   node scripts/design-detect.mjs              # scan ./app ./components
//   node scripts/design-detect.mjs src/         # scan a path
//   node scripts/design-detect.mjs --json       # machine-readable
//   node scripts/design-detect.mjs --gate=high  # exit 1 if any >= ALTO

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { createHash } from 'node:crypto'

const DEFAULT_PATHS = ['app', 'components', 'lib']
const EXTS = new Set(['.ts', '.tsx', '.mjs', '.jsx', '.js'])
const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  '.claude',
])

const args = process.argv.slice(2)
const jsonMode = args.includes('--json')
const gateArg = args.find((a) => a.startsWith('--gate='))
const gate = gateArg ? gateArg.split('=')[1].toLowerCase() : 'high'
const paths = args.filter((a) => !a.startsWith('--'))
const scanRoots = paths.length > 0 ? paths : DEFAULT_PATHS

const SEVERITY = { critical: 4, high: 3, medium: 2, low: 1 }
const GATE_THRESHOLD = SEVERITY[gate] ?? SEVERITY.high

// Each rule: { id, severity, pattern (regex), test(content) optional,
// allowFile(path) — true to skip the whole file as documented exception,
// hint }.
//
// Patterns are case-sensitive unless flagged. We deliberately don't try to
// parse the JSX — that's what the agent's LLM pass is for. The regexes
// optimize for low false-negative on the AI-tell anti-patterns.
const RULES = [
  {
    id: 'gradient-text',
    severity: 'high',
    pattern:
      /\bbg-gradient-to-[a-z]+[\s\S]{0,80}?(text-transparent|bg-clip-text)\b/,
    hint: 'Cor sólida do token (text-foreground / text-accent).',
  },
  {
    id: 'ai-color-palette',
    severity: 'medium',
    pattern:
      /\bfrom-(purple|pink|fuchsia|violet|indigo)-\d+[\s\S]{0,40}?\bto-(purple|pink|fuchsia|violet|indigo|blue)-\d+/,
    hint: 'Usar tokens da marca (--accent e variações).',
  },
  {
    id: 'glassmorphism-misplaced',
    severity: 'medium',
    // backdrop-blur in a file whose path doesn't hint at modal/drawer/nav.
    // No word boundary: filenames like `MobileBottomNav.tsx` should match the
    // `nav` substring — `\b` between word chars doesn't fire.
    pattern: /\bbackdrop-blur(?!-(none|0))-?\w*/,
    allowFile: (p) =>
      /(modal|drawer|nav|sheet|popover|overlay|dialog|toast)/i.test(p),
    hint: 'Remover backdrop-blur fora de modal/drawer/nav, ou trocar por background sólido com opacity.',
  },
  {
    id: 'hardcoded-color',
    severity: 'high',
    // tailwind palette literal in JSX className
    pattern:
      /\b(text|bg|border|ring|fill|stroke|from|to|via)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|zinc|neutral|stone|gray)-(\d+)\b/,
    hint: 'Trocar pelo token semântico do projeto (text-foreground, bg-surface, border-border, text-accent...).',
  },
  {
    id: 'hex-color-literal',
    severity: 'high',
    // Require the `#` prefix and a valid hex length (3, 6, or 8 digits).
    // Bare `2026` in a date literal is not a hex match. Manifest theme
    // color is allowed via allowFile.
    pattern: /#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/,
    test: (content, line) =>
      /(className|style|color|background|border|ring|fill|stroke)/.test(line),
    allowFile: (p) => /app[\\/]manifest\.(ts|tsx|js|mjs)$/.test(p),
    onlyExt: new Set(['.ts', '.tsx', '.jsx']),
    hint: 'Mover para CSS de tokens, expor como var, ou usar token semântico existente.',
  },
  {
    id: 'inline-style-color',
    severity: 'medium',
    pattern:
      /style=\{\{[^}]*?\b(color|backgroundColor|borderColor|fill|stroke)\s*:/,
    hint: 'Usar classe Tailwind ou variável CSS via style={{ "--name": value }}.',
  },
  {
    id: 'arbitrary-typo-scale',
    severity: 'low',
    pattern: /text-\[(\d+|0?\.\d+)(px|rem|em)\]/,
    hint: 'Usar text-xs/sm/base/... ou documentar a microtype em DESIGN.md.',
  },
  {
    id: 'transition-all-lazy',
    severity: 'low',
    pattern: /\btransition-all\b/,
    hint: 'Trocar por transition-colors / transition-transform / transition-opacity.',
  },
  {
    id: 'important-abuse',
    severity: 'medium',
    pattern: /["'\s]!\w+(-\w+)*\b/g,
    aggregate: true, // count occurrences per file
    threshold: 3, // 3+ in same file = finding (regra escalada para ALTO se ≥5)
    hint: 'Se padrão recorrente, criar variant no Button/SettingsRow; se one-off, documentar workaround.',
  },
  {
    id: 'shadow-stacking',
    severity: 'low',
    pattern: /\bshadow-(2xl|inner|drop-shadow)\b/g,
    aggregate: true,
    threshold: 2,
    hint: 'Usar 1-2 níveis canônicos do sistema (shadow rest, shadow-md hover).',
  },
  {
    id: 'border-decorative-arbitrary',
    severity: 'low',
    pattern: /\bborder-(l|r|t|b)-(4|6|8|10|12)\b/,
    hint: 'Indicação visual via cor de fundo (bg-warning-soft) ou ícone — não stripe.',
  },
  {
    id: 'emoji-as-icon',
    severity: 'low',
    // unicode emoji in JSX/className context (not inside i18n message strings)
    pattern:
      /(?:className=["'`][^"'`]*?|<[A-Za-z]+[^>]*?>\s*)([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}])/u,
    allowFile: (p) => /messages\/.+\.json$/.test(p),
    hint: 'Trocar por ícone Lucide (Star, Flame, etc).',
  },
  // AST-required (TODO): focus-without-visible, ring-outline-overlap,
  // redundant-md-hidden-block. Agent still catches them via judgment.
]

function walk(root, out = []) {
  let stats
  try {
    stats = statSync(root)
  } catch {
    return out
  }
  if (stats.isFile()) {
    if (EXTS.has(extname(root))) out.push(root)
    return out
  }
  if (!stats.isDirectory()) return out
  for (const name of readdirSync(root)) {
    if (SKIP_DIRS.has(name)) continue
    walk(join(root, name), out)
  }
  return out
}

function fingerprint(ruleId, file, line) {
  return createHash('sha1')
    .update(`${ruleId}:${file}:${line}`)
    .digest('hex')
    .slice(0, 12)
}

function lineOf(content, index) {
  return content.slice(0, index).split('\n').length
}

function detectFile(file) {
  const findings = []
  let content
  try {
    content = readFileSync(file, 'utf8')
  } catch {
    return findings
  }
  const ext = extname(file)

  for (const rule of RULES) {
    if (rule.onlyExt && !rule.onlyExt.has(ext)) continue
    if (rule.allowFile && rule.allowFile(file)) continue

    if (rule.aggregate) {
      const matches = content.match(rule.pattern) ?? []
      if (matches.length >= (rule.threshold ?? 1)) {
        const severity =
          rule.id === 'important-abuse' && matches.length >= 5
            ? 'high'
            : rule.severity
        findings.push({
          rule: rule.id,
          severity,
          file: relative(process.cwd(), file).replace(/\\/g, '/'),
          line: null,
          count: matches.length,
          fingerprint: fingerprint(rule.id, file, 'aggregate'),
          hint: rule.hint,
        })
      }
      continue
    }

    const pattern = rule.pattern.global
      ? rule.pattern
      : new RegExp(rule.pattern.source, rule.pattern.flags + 'g')
    let m
    while ((m = pattern.exec(content)) !== null) {
      const line = lineOf(content, m.index)
      const lineContent =
        content.split('\n')[line - 1]?.trim().slice(0, 120) ?? ''
      if (rule.test && !rule.test(content, lineContent)) continue
      findings.push({
        rule: rule.id,
        severity: rule.severity,
        file: relative(process.cwd(), file).replace(/\\/g, '/'),
        line,
        match: m[0].slice(0, 60),
        fingerprint: fingerprint(rule.id, file, line),
        hint: rule.hint,
      })
    }
  }
  return findings
}

const files = scanRoots.flatMap((p) => walk(p))
const findings = files.flatMap(detectFile)

if (jsonMode) {
  process.stdout.write(
    JSON.stringify(
      { scanned: files.length, findings, gate, threshold: gate },
      null,
      2,
    ) + '\n',
  )
} else {
  const bySev = findings.reduce(
    (acc, f) => ((acc[f.severity] = (acc[f.severity] ?? 0) + 1), acc),
    {},
  )
  console.log(
    `design-detect: scanned ${files.length} files, ${findings.length} findings ` +
      `(CRÍTICO ${bySev.critical ?? 0} · ALTO ${bySev.high ?? 0} · MÉDIO ${bySev.medium ?? 0} · BAIXO ${bySev.low ?? 0})`,
  )
  console.log(`gate: severity >= ${gate.toUpperCase()} fails`)
  console.log()
  const order = ['critical', 'high', 'medium', 'low']
  for (const sev of order) {
    const list = findings.filter((f) => f.severity === sev)
    if (list.length === 0) continue
    console.log(`── ${sev.toUpperCase()} (${list.length}) ──`)
    for (const f of list) {
      const loc = f.line ? `${f.file}:${f.line}` : `${f.file} (×${f.count})`
      const detail = f.match ? `  match: ${f.match}` : ''
      console.log(
        `  [${f.fingerprint}] ${f.rule.padEnd(28)} ${loc}\n    hint: ${f.hint}${detail ? '\n  ' + detail : ''}`,
      )
    }
    console.log()
  }
}

const fail = findings.some((f) => SEVERITY[f.severity] >= GATE_THRESHOLD)
process.exit(fail ? 1 : 0)
