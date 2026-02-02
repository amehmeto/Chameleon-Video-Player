// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// Uses preload API for secure IPC communication (Electron 12+)

var savedOpacity = 0.25
var playlist = null
var fileMode = true
var opacityView = 1

// Initialize the renderer
async function init() {
  playlist = await window.api.getPlaylist()

  if (typeof playlist === 'string') fileMode = false

  if (fileMode) {
    document.getElementById('browserContainer').style.display = 'none'
    playvid(0)

    document.getElementById('vidContainer').style.opacity = savedOpacity
    opacityView = savedOpacity
  } else {
    document.getElementById('vidContainer').style.display = 'none'
    document.getElementById('webV').setAttribute('src', playlist)
  }
}

function playvid(i, listener) {
  var vid = document.getElementById('video')

  if (typeof playlist[i] !== 'undefined') vid.src = playlist[i]
  else {
    window.api.relaunch()
    return
  }

  vid.load()
  vid.play()
  i++

  vid.addEventListener('ended', function () {
    playvid(i)
  })
}

// IPC event listeners
window.api.on('relaunch', function () {
  window.api.relaunch()
})

window.api.on('toggleViz', function () {
  if (
    !document.getElementById('browserContainer').style.opacity ||
    document.getElementById('browserContainer').style.opacity == 1
  ) {
    document.getElementById('browserContainer').style.opacity = savedOpacity
    opacityView = savedOpacity
  } else {
    opacityView = 1
    document.getElementById('browserContainer').style.opacity = 1
  }
})

window.api.on('mute', function () {
  var vid = document.getElementById('video')
  vid.muted = !vid.muted
})

//-----------------------------------------------------------------
function setOpacityView() {
  document.getElementById('vidContainer').style.opacity = opacityView
  document.getElementById('browserContainer').style.opacity = opacityView
  savedOpacity = opacityView
}

window.api.on('opac', function (val) {
  if ((opacityView == 1 && val < 1) || (val == 1 && opacityView < 1)) {
    if (!fileMode) {
      window.api.send('autotoggle')
      opacityView = val
      return
    }
  }

  opacityView = val
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
  if (document.getElementById('vidContainer').style.opacity == 0)
    setOpacityView()
  else {
    document.getElementById('vidContainer').style.opacity = 0
    document.getElementById('browserContainer').style.opacity = 0
  }
})

window.api.on('opacityfull', function () {
  if (
    !document.getElementById('browserContainer').style.opacity ||
    document.getElementById('browserContainer').style.opacity == 1
  )
    return

  if (document.getElementById('vidContainer').style.opacity == 1)
    setOpacityView()
  else {
    document.getElementById('vidContainer').style.opacity = 1
    document.getElementById('browserContainer').style.opacity = 0.999
  }
})

window.api.on('playpause', function () {
  var vid = document.getElementById('video')
  if (vid.paused) vid.play()
  else vid.pause()
})

window.api.on('skip', function () {
  var vid = document.getElementById('video')
  vid.currentTime = vid.currentTime + 999999999999999999999999
})

window.api.on('timeplus', function () {
  var vid = document.getElementById('video')
  vid.currentTime = vid.currentTime + 30
})

window.api.on('timeminus', function () {
  var vid = document.getElementById('video')
  vid.currentTime = vid.currentTime - 15
})

window.api.on('timefastback', function () {
  var vid = document.getElementById('video')
  vid.currentTime = vid.currentTime - 240
})

window.api.on('timefastforward', function () {
  var vid = document.getElementById('video')
  vid.currentTime = vid.currentTime + 240
})

// Start initialization when DOM is ready
if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', init)
else init()
