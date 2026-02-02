#!/usr/bin/env node
/**
 * Fix Electron framework symlinks for Castlabs builds on macOS
 * Castlabs Electron releases from GitHub sometimes have broken framework symlinks
 * This script recreates them after npm install
 */

const fs = require('fs')
const path = require('path')

const electronPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'electron',
  'dist',
  'Electron.app',
  'Contents',
  'Frameworks',
)

if (process.platform !== 'darwin') {
  console.log('Framework symlink fix only needed on macOS, skipping...')
  process.exit(0)
}

if (!fs.existsSync(electronPath)) {
  console.log('Electron frameworks not found, skipping symlink fix...')
  process.exit(0)
}

const frameworks = [
  { name: 'Electron Framework', binary: 'Electron Framework' },
  { name: 'Squirrel', binary: 'Squirrel' },
  { name: 'Mantle', binary: 'Mantle' },
  { name: 'ReactiveObjC', binary: 'ReactiveObjC' },
]

console.log('Fixing Electron framework symlinks for Castlabs build...')

for (const fw of frameworks) {
  const fwPath = path.join(electronPath, `${fw.name}.framework`)
  const versionsPath = path.join(fwPath, 'Versions')
  const versionAPath = path.join(versionsPath, 'A')

  if (!fs.existsSync(versionAPath)) continue

  // Create Versions/Current -> A symlink
  const currentLink = path.join(versionsPath, 'Current')
  if (!fs.existsSync(currentLink)) {
    try {
      fs.symlinkSync('A', currentLink)
      console.log(`  Created ${fw.name}.framework/Versions/Current -> A`)
    } catch (e) {
      // Symlink may already exist
    }
  }

  // Create binary symlink at framework root
  const binaryLink = path.join(fwPath, fw.binary)
  const binaryTarget = `Versions/A/${fw.binary}`
  if (
    !fs.existsSync(binaryLink) &&
    fs.existsSync(path.join(versionAPath, fw.binary))
  ) {
    try {
      fs.symlinkSync(binaryTarget, binaryLink)
      console.log(
        `  Created ${fw.name}.framework/${fw.binary} -> ${binaryTarget}`,
      )
    } catch (e) {
      // Symlink may already exist
    }
  }

  // Create Resources symlink at framework root
  const resourcesLink = path.join(fwPath, 'Resources')
  if (
    !fs.existsSync(resourcesLink) &&
    fs.existsSync(path.join(versionAPath, 'Resources'))
  ) {
    try {
      fs.symlinkSync('Versions/A/Resources', resourcesLink)
      console.log(
        `  Created ${fw.name}.framework/Resources -> Versions/A/Resources`,
      )
    } catch (e) {
      // Symlink may already exist
    }
  }

  // Create Libraries symlink if exists (for Electron Framework)
  const librariesLink = path.join(fwPath, 'Libraries')
  if (
    !fs.existsSync(librariesLink) &&
    fs.existsSync(path.join(versionAPath, 'Libraries'))
  ) {
    try {
      fs.symlinkSync('Versions/A/Libraries', librariesLink)
      console.log(
        `  Created ${fw.name}.framework/Libraries -> Versions/A/Libraries`,
      )
    } catch (e) {
      // Symlink may already exist
    }
  }

  // Create Helpers symlink if exists (for Electron Framework)
  const helpersLink = path.join(fwPath, 'Helpers')
  if (
    !fs.existsSync(helpersLink) &&
    fs.existsSync(path.join(versionAPath, 'Helpers'))
  ) {
    try {
      fs.symlinkSync('Versions/A/Helpers', helpersLink)
      console.log(
        `  Created ${fw.name}.framework/Helpers -> Versions/A/Helpers`,
      )
    } catch (e) {
      // Symlink may already exist
    }
  }
}

console.log('Framework symlinks fixed successfully!')
