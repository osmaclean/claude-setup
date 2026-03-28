const { execSync } = require('child_process')

let data = ''
process.stdin.on('data', (chunk) => { data += chunk })
process.stdin.on('end', () => {
  try {
    const parsed = JSON.parse(data)
    const filePath = parsed.tool_input?.file_path || parsed.tool_input?.filePath || ''
    if (!filePath || !/\.(ts|tsx|js|jsx)$/.test(filePath)) process.exit(0)

    const result = execSync(`npx eslint --no-error-on-unmatched-pattern ${JSON.stringify(filePath)} 2>&1`, {
      encoding: 'utf8',
      timeout: 15000,
    })

    if (result.trim()) {
      process.stderr.write(`Lint issues:\n${result.trim()}`)
    }
  } catch (err) {
    if (err.stdout && err.stdout.trim()) {
      process.stderr.write(`Lint issues:\n${err.stdout.trim()}`)
    }
  }
  process.exit(0)
})
