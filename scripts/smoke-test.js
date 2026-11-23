#!/usr/bin/env node
/**
 * Smoke test: launch the built app, let it run for a few seconds, and fail
 * if it crashes or logs an uncaught error (main or renderer process).
 */

const { spawn } = require('child_process')
const path = require('path')

const RUN_MS = Number(process.env.SMOKE_RUN_MS || 15000)
const ERROR_PATTERN =
  /Uncaught|UnhandledPromiseRejection|TypeError|ReferenceError|SyntaxError|Cannot find module/

const electron = require('electron')
const child = spawn(
  electron,
  [path.join(__dirname, '..', 'dist', 'main.js'), '--enable-logging'],
  { env: { ...process.env, ELECTRON_ENABLE_LOGGING: '1' } },
)

let output = ''
const collect = (chunk) => {
  output += chunk
  process.stdout.write(chunk)
}
child.stdout.on('data', collect)
child.stderr.on('data', collect)

let finished = false
const fail = (reason) => {
  finished = true
  console.error(`\nSmoke test failed: ${reason}`)
  child.kill('SIGKILL')
  process.exit(1)
}

child.on('exit', (code, signal) => {
  if (!finished) fail(`app exited early (code ${code}, signal ${signal})`)
})

setTimeout(() => {
  if (finished) return
  const match = output.match(ERROR_PATTERN)
  if (match) fail(`error in logs: ${match[0]}`)
  finished = true
  child.kill('SIGKILL')
  console.log(`\nSmoke test passed: app ran ${RUN_MS} ms without errors`)
  process.exit(0)
}, RUN_MS)
