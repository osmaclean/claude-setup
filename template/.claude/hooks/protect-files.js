let data = ''
process.stdin.on('data', (chunk) => { data += chunk })
process.stdin.on('end', () => {
  try {
    const parsed = JSON.parse(data)
    const filePath = parsed.tool_input?.file_path || parsed.tool_input?.filePath || ''
    if (!filePath) process.exit(0)

    const normalized = filePath.replace(/\\/g, '/')

    const blocked = [
      '.env',
      '.env.local',
      '.env.production',
      '.env.development',
      'package-lock.json',
      '.git/',
    ]

    const match = blocked.find((pattern) =>
      pattern.endsWith('/')
        ? normalized.includes(pattern)
        : normalized.endsWith(pattern) || normalized.includes('/' + pattern)
    )

    if (match) {
      process.stderr.write(`Bloqueado: ${filePath} é arquivo protegido (${match})`)
      process.exit(2)
    }
  } catch {}
  process.exit(0)
})
