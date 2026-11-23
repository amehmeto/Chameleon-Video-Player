// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// Uses preload API for secure IPC communication (Electron 12+)

import './types/global'

let savedOpacity = 0.25
let playlist: string | string[] | null = null
let fileMode = true
let opacityView = 1

// Initialize the renderer
async function init(): Promise<void> {
  playlist = await window.api.getPlaylist()

  if (typeof playlist === 'string') fileMode = false

  if (fileMode) {
    const browserContainer = document.getElementById('browserContainer')
    const vidContainer = document.getElementById('vidContainer')

    if (browserContainer) browserContainer.style.display = 'none'
    playvid(0)

    if (vidContainer) {
      vidContainer.style.opacity = String(savedOpacity)
      opacityView = savedOpacity
    }
  } else {
    const vidContainer = document.getElementById('vidContainer')
    const webV = document.getElementById('webV')

    if (vidContainer) vidContainer.style.display = 'none'
    if (webV && typeof playlist === 'string') webV.setAttribute('src', playlist)
  }
}

function playvid(i: number): void {
  const vid = document.getElementById('video') as HTMLVideoElement | null

  if (!vid || !Array.isArray(playlist)) return

  if (typeof playlist[i] !== 'undefined') vid.src = playlist[i]
  else {
    window.api.relaunch()
    return
  }

  vid.load()
  vid.play()
  const nextIndex = i + 1

  vid.addEventListener('ended', function () {
    playvid(nextIndex)
  })
}

// IPC event listeners
window.api.on('relaunch', function () {
  window.api.relaunch()
})

window.api.on('toggleViz', function () {
  const browserContainer = document.getElementById('browserContainer')

  if (!browserContainer) return

  if (
    !browserContainer.style.opacity ||
    browserContainer.style.opacity === '1'
  ) {
    browserContainer.style.opacity = String(savedOpacity)
    opacityView = savedOpacity
  } else {
    opacityView = 1
    browserContainer.style.opacity = '1'
  }
})

window.api.on('mute', function () {
  const vid = document.getElementById('video') as HTMLVideoElement | null
  if (vid) vid.muted = !vid.muted
})

//-----------------------------------------------------------------
function setOpacityView(): void {
  const vidContainer = document.getElementById('vidContainer')
  const browserContainer = document.getElementById('browserContainer')

  if (vidContainer) vidContainer.style.opacity = String(opacityView)
  if (browserContainer) browserContainer.style.opacity = String(opacityView)
  savedOpacity = opacityView
}

window.api.on('opac', function (val: unknown) {
  const numVal = val as number
  const browserContainer = document.getElementById('browserContainer')

  if (!browserContainer) return

  if ((opacityView === 1 && numVal < 1) || (numVal === 1 && opacityView < 1)) {
    if (!fileMode) {
      window.api.send('autotoggle')
      opacityView = numVal
      return
    }
  }

  opacityView = numVal
  setOpacityView()
})

window.api.on('opacityplus', function () {
  opacityView += 0.05
  if (opacityView > 1) opacityView = 1

  setOpacityView()
})

window.api.on('opacityminus', function () {
  opacityView += -0.05
  if (opacityView < 0) opacityView = 0

  setOpacityView()
})

window.api.on('opacityhalf', function () {
  opacityView = 0.5
  setOpacityView()
})

window.api.on('opacitynone', function () {
  const vidContainer = document.getElementById('vidContainer')
  const browserContainer = document.getElementById('browserContainer')

  if (!vidContainer || !browserContainer) return

  if (vidContainer.style.opacity === '0') setOpacityView()
  else {
    vidContainer.style.opacity = '0'
    browserContainer.style.opacity = '0'
  }
})

window.api.on('opacityfull', function () {
  const vidContainer = document.getElementById('vidContainer')
  const browserContainer = document.getElementById('browserContainer')

  if (!browserContainer || !vidContainer) return

  if (!browserContainer.style.opacity || browserContainer.style.opacity === '1')
    return

  if (vidContainer.style.opacity === '1') setOpacityView()
  else {
    vidContainer.style.opacity = '1'
    browserContainer.style.opacity = '0.999'
  }
})

window.api.on('playpause', function () {
  const vid = document.getElementById('video') as HTMLVideoElement | null
  if (!vid) return

  if (vid.paused) vid.play()
  else vid.pause()
})

window.api.on('skip', function () {
  const vid = document.getElementById('video') as HTMLVideoElement | null
  if (vid) vid.currentTime = vid.currentTime + 999999999999999999999999
})

window.api.on('timeplus', function () {
  const vid = document.getElementById('video') as HTMLVideoElement | null
  if (vid) vid.currentTime = vid.currentTime + 30
})

window.api.on('timeminus', function () {
  const vid = document.getElementById('video') as HTMLVideoElement | null
  if (vid) vid.currentTime = vid.currentTime - 15
})

window.api.on('timefastback', function () {
  const vid = document.getElementById('video') as HTMLVideoElement | null
  if (vid) vid.currentTime = vid.currentTime - 240
})

window.api.on('timefastforward', function () {
  const vid = document.getElementById('video') as HTMLVideoElement | null
  if (vid) vid.currentTime = vid.currentTime + 240
})

// Start initialization when DOM is ready
if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', init)
else init()
