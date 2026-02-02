// Controller for menu and mode windows
// Uses preload API for secure IPC communication (Electron 12+)

var playlist = null
var steam = null
var trials = null
var isBackground = true
var savedSlider = 25

// Initialize globals asynchronously
async function initGlobals() {
  playlist = await window.api.getPlaylist()
  steam = await window.api.getSteam()
  trials = await window.api.getTrials()
}

function _bakc() {
  window.api.send('goBack')
}

function _toggleHIDE() {
  window.api.send('autotoggle')
}

function toggleIT(bool) {
  if (typeof playlist !== 'string') return

  if (typeof bool !== 'undefined') savedSlider = 95

  var slide = document.getElementById('myRange')
  var togglebutt = document.getElementById('toggleTxt')
  var togglebutttwo = document.getElementById('secondToggleTxt')
  isBackground = !isBackground

  if (slide) {
    if (isBackground) {
      savedSlider = slide.value
      slide.value = 100
    } else slide.value = savedSlider
  }

  if (togglebutt) {
    if (!isBackground) {
      togglebutt.innerText = 'Send To Foreground'
      togglebutttwo.innerText = '(Focus)'
    } else {
      togglebutt.innerText = 'Send To Background'
      togglebutttwo.innerText = '(UnFocus)'
    }
  }

  if (document.getElementById('browserOverlay'))
    document.getElementById('browserOverlay').style.display = 'none'

  window.api.send('toggle')
}

document.addEventListener('DOMContentLoaded', async function () {
  // Initialize globals first - must complete before registering IPC listeners
  await initGlobals()

  // Register IPC listeners after globals are initialized to prevent race conditions
  window.api.on('toggleView', function () {
    toggleIT()
  })

  window.api.on('shortcut', function (arg) {
    var slide = document.getElementById('myRange')

    if (arg === 0) {
      if (slide) {
        if (parseFloat(slide.value) === 100 && typeof playlist === 'string')
          return

        if (parseFloat(slide.value) + 5 >= 100) {
          if (typeof playlist !== 'string') slide.value = 100
          else toggleIT()
        } else slide.value = parseFloat(slide.value) + 5
      }
    } else if (arg === 1) {
      if (slide) {
        if (parseFloat(slide.value) === 100 && typeof playlist === 'string') {
          toggleIT(true)
          return
        }

        if (parseFloat(slide.value) - 5 < 0) slide.value = 0
        else slide.value = parseFloat(slide.value) - 5
      }
    } else if (arg === 2) {
      var ele = document.getElementById('playpauser')

      if (ele.src.includes('ic_play_arrow_black_24px'))
        ele.src = ele.src.replace(/ic_.+/i, 'ic_pause_black_24px.svg')
      else ele.src = ele.src.replace(/ic_.+/i, 'ic_play_arrow_black_24px.svg')
    }
  })

  window.api.on('toggleViz', function (_arg) {
    if (document.getElementById('browserOverlay'))
      document.getElementById('browserOverlay').style.display = 'none'
  })

  var input = document.getElementById('url')

  if (input) {
    input.addEventListener('keyup', function (event) {
      if (event.keyCode === 13) window.api.send('openURL', input.value)
    })
  }

  if (steam) {
    if (document.getElementById('snInput')) {
      document.getElementById('snInput').style.display = 'none'
      document.getElementById('purch').style.display = 'none'
      document.getElementById('break').style.display = 'none'
      document.getElementById('steamFrame').style.display = 'flex'
    }
  }

  // Platform-specific UI updates
  var isWindows = window.api.platform.startsWith('win')

  if (isWindows) {
    if (document.getElementById('imag'))
      document.getElementById('imag').src = 'assets/img/win.jpg'
  }

  if (document.getElementById('plat11')) {
    if (isWindows) document.getElementById('plat11').innerText = 'control (^)'
    else document.getElementById('plat11').innerText = 'command (\u2318) '
  }

  if (document.getElementById('scrubbing')) {
    var platSymbol = isWindows ? '^' : '\u2318'

    document.getElementById('plat1').innerText = platSymbol
    document.getElementById('plat2').innerText = platSymbol
    document.getElementById('plat3').innerText = platSymbol
    document.getElementById('plat4').innerText = platSymbol
    document.getElementById('plat5').innerText = platSymbol
    document.getElementById('plat6').innerText = platSymbol
    document.getElementById('plat7').innerText = platSymbol
    document.getElementById('plat8').innerText = platSymbol
    document.getElementById('plat9').innerText = platSymbol
    document.getElementById('plat10').innerText = platSymbol

    if (typeof playlist === 'string') {
      document.getElementById('scrubbing').style.display = 'none'
      document.getElementById('ctrls').style.display = 'none'
      document.getElementById('togshort').style.display = 'block'

      var slide = document.getElementById('myRange')
      if (slide) slide.value = 100
    } else document.getElementById('hide').style.display = 'none'
  }

  if (document.getElementById('numTrials')) {
    document.getElementById('numTrials').innerHTML = trials

    if (trials === 1) document.getElementById('ess').innerHTML = ''
    else document.getElementById('ess').innerHTML = 's'
  }

  if (document.getElementById('slidecontainer')) window.api.send('showMenu')
})

var _enterLicense = function () {
  var email = document.getElementById('email').value
  var sn =
    document.getElementById('sn1').value +
    document.getElementById('sn2').value +
    document.getElementById('sn3').value

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

// eslint-disable-next-line no-unused-vars
var controller = function (param, val) {
  window.api.send(param, val)

  if (param === 'playpause') {
    var ele = document.getElementById('playpauser')

    if (ele.src.includes('ic_play_arrow_black_24px'))
      ele.src = ele.src.replace(/ic_.+/i, 'ic_pause_black_24px.svg')
    else ele.src = ele.src.replace(/ic_.+/i, 'ic_play_arrow_black_24px.svg')
  }
}

// Set zoom limits via preload API
window.api.setZoomLimits()
