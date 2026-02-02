// Controller for menu and mode windows
// Uses preload API for secure IPC communication (Electron 12+)

import './types/global'

let playlist: string | string[] | null = null
let steam: boolean | null = null
let trials: number | null = null
let isBackground = true
let savedSlider = 25

// Initialize globals asynchronously
async function initGlobals(): Promise<void> {
  playlist = await window.api.getPlaylist()
  steam = await window.api.getSteam()
  trials = await window.api.getTrials()
}

// Expose functions to global scope for HTML onclick handlers
declare global {
  interface Window {
    bakc: () => void
    toggleHIDE: () => void
    toggleIT: (bool?: boolean) => void
    controller: (param: string, val?: unknown) => void
    _enterLicense: () => void
  }
}

window.bakc = function (): void {
  window.api.send('goBack')
}

window.toggleHIDE = function (): void {
  window.api.send('autotoggle')
}

window.toggleIT = function (bool?: boolean): void {
  if (typeof playlist !== 'string') return

  if (typeof bool !== 'undefined') savedSlider = 95

  const slide = document.getElementById('myRange') as HTMLInputElement | null
  const togglebutt = document.getElementById('toggleTxt')
  const togglebutttwo = document.getElementById('secondToggleTxt')
  isBackground = !isBackground

  if (slide) {
    if (isBackground) {
      savedSlider = parseInt(slide.value, 10)
      slide.value = '100'
    } else slide.value = String(savedSlider)
  }

  if (togglebutt) {
    if (!isBackground) {
      togglebutt.innerText = 'Send To Foreground'
      if (togglebutttwo) togglebutttwo.innerText = '(Focus)'
    } else {
      togglebutt.innerText = 'Send To Background'
      if (togglebutttwo) togglebutttwo.innerText = '(UnFocus)'
    }
  }

  const browserOverlay = document.getElementById('browserOverlay')
  if (browserOverlay) browserOverlay.style.display = 'none'

  window.api.send('toggle')
}

// Handle shortcut IPC events for opacity and playback control
function handleShortcut(arg: unknown): void {
  if (typeof arg !== 'number') return
  const numArg = arg
  const slide = document.getElementById('myRange') as HTMLInputElement | null

  if (numArg === 0) handleOpacityIncrease(slide)
  else if (numArg === 1) handleOpacityDecrease(slide)
  else if (numArg === 2) togglePlayPauseIcon()
}

function handleOpacityIncrease(slide: HTMLInputElement | null): void {
  if (!slide) return
  if (parseFloat(slide.value) === 100 && typeof playlist === 'string') return

  if (parseFloat(slide.value) + 5 >= 100) {
    if (typeof playlist !== 'string') slide.value = '100'
    else window.toggleIT()
  } else slide.value = String(parseFloat(slide.value) + 5)
}

function handleOpacityDecrease(slide: HTMLInputElement | null): void {
  if (!slide) return
  if (parseFloat(slide.value) === 100 && typeof playlist === 'string') {
    window.toggleIT(true)
    return
  }

  if (parseFloat(slide.value) - 5 < 0) slide.value = '0'
  else slide.value = String(parseFloat(slide.value) - 5)
}

function togglePlayPauseIcon(): void {
  const ele = document.getElementById('playpauser') as HTMLImageElement | null
  if (!ele) return

  if (ele.src.includes('ic_play_arrow_black_24px'))
    ele.src = ele.src.replace(/ic_.+/i, 'ic_pause_black_24px.svg')
  else ele.src = ele.src.replace(/ic_.+/i, 'ic_play_arrow_black_24px.svg')
}

// Register IPC event listeners
function registerIpcListeners(): void {
  window.api.on('toggleView', () => window.toggleIT())
  window.api.on('shortcut', handleShortcut)
  window.api.on('toggleViz', () => {
    const browserOverlay = document.getElementById('browserOverlay')
    if (browserOverlay) browserOverlay.style.display = 'none'
  })
}

// Setup URL input field
function setupUrlInput(): void {
  const input = document.getElementById('url') as HTMLInputElement | null
  if (input) {
    input.addEventListener('keyup', (event: KeyboardEvent) => {
      if (event.key === 'Enter') window.api.send('openURL', input.value)
    })
  }
}

// Configure Steam-specific UI elements
function setupSteamUI(): void {
  if (!steam) return

  const elementsToHide = ['snInput', 'purch', 'break']
  elementsToHide.forEach((id) => {
    const el = document.getElementById(id)
    if (el) el.style.display = 'none'
  })

  const steamFrame = document.getElementById('steamFrame')
  if (steamFrame) steamFrame.style.display = 'flex'
}

// Configure platform-specific UI (Windows vs macOS)
function setupPlatformUI(): void {
  const isWindows = window.api.platform.startsWith('win')

  if (isWindows) {
    const imag = document.getElementById('imag') as HTMLImageElement | null
    if (imag) imag.src = 'assets/img/win.jpg'
  }

  const plat11 = document.getElementById('plat11')
  if (plat11) plat11.innerText = isWindows ? 'control (^)' : 'command (\u2318) '

  setupPlatformSymbols(isWindows)
  setupScrubbingControls(isWindows)
}

function setupPlatformSymbols(isWindows: boolean): void {
  const platSymbol = isWindows ? '^' : '\u2318'
  const platElements = [
    'plat1',
    'plat2',
    'plat3',
    'plat4',
    'plat5',
    'plat6',
    'plat7',
    'plat8',
    'plat9',
    'plat10',
  ]

  platElements.forEach((id) => {
    const el = document.getElementById(id)
    if (el) el.innerText = platSymbol
  })
}

function setupScrubbingControls(isWindows: boolean): void {
  const scrubbing = document.getElementById('scrubbing')
  if (!scrubbing) return

  // Platform symbols already set by setupPlatformSymbols
  void isWindows

  if (typeof playlist === 'string') {
    scrubbing.style.display = 'none'
    const ctrls = document.getElementById('ctrls')
    const togshort = document.getElementById('togshort')

    if (ctrls) ctrls.style.display = 'none'
    if (togshort) togshort.style.display = 'block'

    const slide = document.getElementById('myRange') as HTMLInputElement | null
    if (slide) slide.value = '100'
  } else {
    const hide = document.getElementById('hide')
    if (hide) hide.style.display = 'none'
  }
}

// Configure trials display
function setupTrialsDisplay(): void {
  const numTrials = document.getElementById('numTrials')
  if (!numTrials || trials === null) return

  numTrials.innerHTML = String(trials)

  const ess = document.getElementById('ess')
  if (ess) ess.innerHTML = trials === 1 ? '' : 's'
}

document.addEventListener('DOMContentLoaded', async function () {
  await initGlobals()

  registerIpcListeners()
  setupUrlInput()
  setupSteamUI()
  setupPlatformUI()
  setupTrialsDisplay()

  const slidecontainer = document.getElementById('slidecontainer')
  if (slidecontainer) window.api.send('showMenu')
})

window._enterLicense = function (): void {
  const emailEl = document.getElementById('email') as HTMLInputElement | null
  const sn1 = document.getElementById('sn1') as HTMLInputElement | null
  const sn2 = document.getElementById('sn2') as HTMLInputElement | null
  const sn3 = document.getElementById('sn3') as HTMLInputElement | null

  if (!emailEl || !sn1 || !sn2 || !sn3) return

  const email = emailEl.value
  let sn = sn1.value + sn2.value + sn3.value
  sn = sn.toUpperCase()

  window.api.send('enterlicense', [email, sn])
}

// Alert listeners don't depend on globals, safe to register immediately
window.api.on('invalid', function () {
  alert(
    'Invalid License. Please Re-Check Confirmation Email. Ensure you did not enter your Steam Key, which is separate.',
  )
})

window.api.on('thx', function () {
  alert('Thanks for Purchasing!')
})

window.api.on('triallimit', function () {
  alert('Trial Limit Reached, Please Purchase')
})

window.controller = function (param: string, val?: unknown): void {
  window.api.send(param, val)

  if (param === 'playpause') {
    const ele = document.getElementById('playpauser') as HTMLImageElement | null

    if (ele) {
      if (ele.src.includes('ic_play_arrow_black_24px'))
        ele.src = ele.src.replace(/ic_.+/i, 'ic_pause_black_24px.svg')
      else ele.src = ele.src.replace(/ic_.+/i, 'ic_play_arrow_black_24px.svg')
    }
  }
}

// Set zoom limits via preload API
window.api.setZoomLimits()
