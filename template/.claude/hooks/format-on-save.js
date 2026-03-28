const { execSync } = require('child_process')

let data = ''
process.stdin.on('data', (chunk) => { data += chunk })
process.stdin.on('end', () => {
  try {
    const parsed = JSON.parse(data)
    const filePath = parsed.tool_input?.file_path || parsed.tool_input?.filePath || ''
    if (filePath && /\.(ts|tsx|js|jsx|json|css)$/.test(filePath)) {
      execSync(`npx prettier --write ${JSON.stringify(filePath)}`, { stdio: 'ignore' })
    }
  } catch {}
})
