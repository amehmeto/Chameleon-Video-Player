const electron = require('electron')
//console.log("ELECTRON VERSION = ", process.version);
//const { inAppPurchase } = require('electron').remote

// Castlabs components API for Widevine CDM
const { components } = electron

var shell = electron.shell
//var robot = require("robotjs");
//var CryptoJS = require("crypto-js");
var ipcMain = electron.ipcMain
var globalShortcut = electron.globalShortcut
const { dialog } = require('electron')
const storage = require('electron-storage')

var _defaults = {
  email: null,
  sn: null,
  opacity: 0.3,
  trials: 5,
  relaunch: false,
}
var toggleCounter = 0
const path = require('path')
var dia = false

//-------------------
var DRM = false
var steam = false
var prompt = false
//-------------------

global.steam = DRM && steam

//console.log("CHROME VERSION:", process.versions['chrome'])
//const remote = require('electron').remote

// Module to control application life.
const app = electron.app
// Castlabs Electron for Content Security (ECS) - Widevine DRM support
// CDM is auto-installed via components.whenReady() API
// For production: sign with EVS (pip install castlabs-evs)

// Flash support removed - discontinued in 2021

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

//const ipcMain=electron.ipcMain // ?
/*
const Tray=electron.Tray
const nativeImage=electron.nativeImage
*/
const Menubar = require('menubar').menubar

const INDEX_HTML = path.join('file://', __dirname, 'index.html')
const PROMPT_HTML = path.join('file://', __dirname, 'prompt.html')
const MODE_HTML = path.join('file://', __dirname, 'mode.html')

const TRANSPARENT_HTML = path.join('file://', __dirname, 'transparent.html')
const MENU = path.join('file://', __dirname, 'menu.html')
const CHILD_PADDING = 0

const _url = require('url')

ipcMain.on('quitprompt', function (_event, _arg) {
  app.quit()
})

ipcMain.on('manual', function (_event, _arg) {
  shell.openExternal('http://www.cinqmarsmedia.com/chameleon/manual.html')
})
ipcMain.on('cmm', function (_event, _arg) {
  shell.openExternal('https://www.cinqmarsmedia.com/')
})
ipcMain.on('github', function (_event, _arg) {
  shell.openExternal(
    'https://github.com/Cinq-Mars-Media/Chameleon-Video-Player',
  )
})
ipcMain.on('donate', function (_event, _arg) {
  shell.openExternal(
    'https://www.paypal.com/us/fundraiser/112574644767835624/charity/1944132',
  )
})

// IPC handlers for preload API (replaces remote module)
ipcMain.handle('app:relaunch', () => {
  app.relaunch()
  app.exit(0)
})

ipcMain.handle('app:quit', () => {
  app.quit()
})

ipcMain.handle('get:playlist', () => {
  return global.playlist
})

ipcMain.handle('get:steam', () => {
  return global.steam
})

ipcMain.handle('get:trials', () => {
  return global.trials
})

//menubar.setAlwaysOnTop(true, "floating", 1);

//const ipcMain=require('electron')

//var allScreens = screenElectron.getAllDisplays();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const addClickableRegion = (options) => {
  const { parent } = options
  const parentBounds = parent.getBounds()
  const {
    width = parentBounds.width,
    height = parentBounds.height,
    x = 0,
    y = 0,
  } = options

  // create a child window, setting the position based on the parent's bounds
  const childWindow = new BrowserWindow({
    parent,
    x: parentBounds.x + x,
    y: parentBounds.y + y,
    width: width || parentBounds.width,
    height: height || parentBounds.height,
    // disable pretty much everything
    transparent: true,
    frame: false,
    skipTaskbar: true,
    movable: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreen: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'assets/icons/png/icon_32x32@2x.png'),
  })
  /* ???????
    // this is a dirty workaround to set the cursor style when hovering over the button
    ipcMain.on(
      'ClickableRegion::set-child-css',
      (e, css) => childWindow.webContents.insertCSS(css)
    );
  
    // When the transpoarent child captures a mouse event, it is forwarded to the parent
    // and mapped to it's coordinates
    ipcMain.on(
      'ClickableRegion::mouse-event',
      (e, data) => {
        parent.webContents.sendInputEvent(Object.assign(
          data,
          {
            x: x + data.x,
            y: y + data.y
          }
        ));
      }
    );
  */
  childWindow.loadURL(TRANSPARENT_HTML)
  childWindow.setIgnoreMouseEvents(true)

  function initMenubar() {
    const menubar = Menubar({
      index: MENU,
      browserWindow: {
        height: 300,
        width: 256,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          preload: path.join(__dirname, 'preload.js'),
        },
        parent,
      },
      tooltip: 'Chameleon Player Options',
      preloadWindow: true,
    })
    global.menubar = menubar
    globalShortcut.register('Shift+CommandOrControl+t', () => {
      if (
        global.menubar &&
        global.menubar.window &&
        global.menubar.window.webContents
      )
        global.menubar.window.webContents.send('toggleView')
    })
  }
  initMenubar()

  global.menubarShown = true
  menubar
    .on('after-show', () => {
      global.menubarShown = true
    })
    .on('after-hide', () => {
      global.menubarShown = false
    })
    .on('focus-lost', () => {
      global.menubarShown = false
      global.menubar.hideWindow()
    })
}

function start() {
  ipcMain.on('openStreamBrowser', function (_event, url) {
    global.playlist = url
    getdimensions()

    modeWin.close()
  })

  ipcMain.on('openURL', function (_event, arg) {
    let result = arg

    if (result.match(/[a-z]|[A-Z]/i)) {
      if (!result.includes('http')) {
        if (result.includes('www')) result = 'http://' + result
        else {
          if (!result.includes('.')) result = 'http://www.' + result + '.com'
          else result = 'http://www.' + result
        }
      }
    }
    //console.log(result);
    global.playlist = result
    getdimensions()

    modeWin.close()
  })

  ipcMain.on('showMenu', function (_event, _arg) {
    menubar.showWindow()
  })

  ipcMain.on('startwfile', function (_event, _arg) {
    if (typeof parent !== 'undefined') parent.close()

    if (!dia) {
      dia = true
      dialog
        .showOpenDialog({
          properties: ['openFile', 'multiSelections'],
          filters: [
            {
              name: 'Movies',
              extensions: ['mkv', 'avi', 'mp4'],
            },
          ],
        })
        .then((filename) => {
          if (typeof filename === 'undefined') {
            //app.quit()
          } else {
            global.playlist = filename.filePaths
            /**/
            getdimensions()

            modeWin.close()
          }
          dia = false
        })
        // eslint-disable-next-line no-console
        .catch(console.log)
    }
  })

  ipcMain.on('quitprompt', function (_event, _arg) {
    app.quit()
  })
  //console.log(trials)

  const modeWin = new BrowserWindow({
    width: 1211,
    height: 730,
    frame: false,
    skipTaskbar: true,
    movable: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  modeWin.loadURL(MODE_HTML)

  modeWin.show()
  modeWin.on('close', function (_event) {
    if (typeof global.playlist === 'undefined') app.quit()
  })
}

function _checkSN(email, sn) {
  if (email === null || sn === null) return false

  if (email.length < 5 || sn.length !== 12) return false

  /*
  for (i=0;i<email.length;i++){
    hash=hash*email.charCodeAt(i);
  }
  */

  email = email.replace(/\./g, '')
  email = email.replace(/@/g, '')
  email = email.replace(/_/g, '')
  //email=email.replace('','');

  hash = Math.pow(parseInt(email, 36), 0.2)
  hash = Math.floor(hash * 100000000) / 100000000

  var p = String(hash).replace('e', '7')
  p = p.replace(/\+/g, '5')
  p = p.replace(/\./g, '2')
  p = p.substring(0, 14)

  testhash = parseInt(p).toString(34)

  testhash = testhash.replace(/0/g, 'J')
  testhash = testhash.replace(/1/g, 'W')
  testhash = testhash.toUpperCase()
  testhash = testhash.replace(/0/g, 'V')
  //console.log('pretesthash',testhash);
  testhash = testhash + '1YC0Q1PU8BXLWR47'
  if (testhash.length > 12) testhash = testhash.substring(0, 12)

  //console.log('testhash',testhash);
  //console.log('sn',sn);

  if (testhash === sn) return true

  return false
}

let promptWin

function promptDonate() {
  ipcMain.on('start', function (_event, _arg) {
    start()
    promptWin.close()
    //
  })

  ipcMain.on('startNoPrompt', function (_event, _arg) {
    storage
      .set('auth', {
        data: 'U2FsdGVV3JFudJsuhkjevNoHTzYUz9VwaAMWMvUPaIUsqcDmAKSNWR2eR643rYXSryqb',
      })
      .then(function () {
        start()
        promptWin.close()
      })
  })

  promptWin = new BrowserWindow({
    width: 600,
    height: 520,
    frame: false,
    skipTaskbar: true,
    movable: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  promptWin.loadURL(PROMPT_HTML)

  promptWin.show()
}

function ready() {
  /*
  storage.set('auth', {}).then(function () {
      
        })
  */

  globalShortcut.register('CmdOrCtrl+R', () => {})
  globalShortcut.register('Shift+CmdOrCtrl+R', () => {})

  globalShortcut.register('Shift+CmdOrCtrl+X', () => {
    app.quit()
  })

  globalShortcut.register('CmdOrCtrl+-', () => {})
  globalShortcut.register('CmdOrCtrl+=', () => {})

  if (prompt) {
    storage
      .get('auth')
      .then((data) => {
        if (data.data) {
          //  prompt()
          //console.log('BOOOM',data.data);
          start()
        } else {
          //start();
          promptDonate()
        }

        //storage.set('auth', temp);
      })
      .catch((_err) => {
        storage
          .get('data')
          .then((_data) => {
            start()
          })
          .catch((_err) => {
            promptDonate()
          })

        //promptDonate();
        //console.log('err', err)
      })
  } else start()
}

function _postdialog(_file) {
  //console.log('fires')
}

function getdimensions() {
  if (process.platform === 'darwin') app.dock.hide()

  /*
    tray.on('click', function(event) {
      toggleWindow()
  
      // Show devtools when command clicked
      if (window.isVisible() && process.defaultApp && event.metaKey) {
        window.openDevTools({mode: 'detach'})
      }
    })
  
      let menubar = new BrowserWindow({
      width: 300,
      height: 350,
      show: false,
      frame: false,
      resizable: false,
    })
  
    let icon = nativeImage.createFromDataURL(base64Icon)
    tray = new Tray(icon)
  
  */
  var screenElectron = electron.screen
  var mainScreen = screenElectron.getPrimaryDisplay()

  // hides the dock icon for our app which allows our windows to join other
  // apps' spaces. without this our windows open on the nearest "desktop" space

  // "floating" + 1 is higher than all regular windows, but still behind things
  // like spotlight or the screen saver

  createWindow(mainScreen.workArea.width, mainScreen.workArea.height, playlist)
  if (typeof promptWin !== 'undefined') promptWin.close()
}

/*
function testbutton(){
console.log('test button has fired') // what I want to happen

}
*/

function createWindow(w, h, p) {
  let parent = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    fullscreen: false,
    width: w,
    height: h,
    transparent: true,
    frame: false,
    skipTaskbar: true,
    movable: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreen: false,
  })

  parent.setSize(w, h)

  if (typeof p !== 'string') parent.setIgnoreMouseEvents(true)

  parent.setAlwaysOnTop(true, 'floating', 0)
  // allows the window to show over a fullscreen window
  parent.setVisibleOnAllWorkspaces(true)

  // Remove any existing listeners to prevent memory leaks if createWindow() is called multiple times
  const parentIpcChannels = [
    'autotoggle',
    'toggle',
    'goBack',
    'toggleMenu',
    'opac',
    'opacityplus',
    'opacityminus',
    'playpause',
    'timeplus',
    'timeminus',
    'timefastback',
    'timefastforward',
    'quit',
  ]
  parentIpcChannels.forEach((channel) => ipcMain.removeAllListeners(channel))

  ipcMain.on('autotoggle', function () {
    // eslint-disable-next-line no-console
    console.log('autotoggle')
    if (
      global.menubar &&
      global.menubar.window &&
      global.menubar.window.webContents
    )
      global.menubar.window.webContents.send('toggleView')
  })

  //setTimeout(()=>{}, 6000);
  ipcMain.on('toggle', function () {
    // here???
    toggleCounter++

    if (toggleCounter % 2) parent.setIgnoreMouseEvents(true)
    //if (!/^win/.test(process.platform)) { robot.mouseClick(); }
    else parent.setIgnoreMouseEvents(false)

    //parent.webContents.send("toggleView")
    parent.webContents.send('toggleViz', toggleCounter % 2)
  })

  ipcMain.on('goBack', function (_event, _arg) {
    /**/

    parent.webContents.send('relaunch')
  })

  ipcMain.on('toggleMenu', function (_event, _arg) {
    //TOGGLE MENU
  })

  ipcMain.on('opac', function (_event, arg) {
    parent.webContents.send('opac', arg)
  })

  ipcMain.on('opacityplus', function (_event, _arg) {
    parent.webContents.send('opacityplus')
  })

  ipcMain.on('opacityminus', function (_event, _arg) {
    parent.webContents.send('opacityminus')
  })

  ipcMain.on('playpause', function (_event, _arg) {
    parent.webContents.send('playpause')
  })

  ipcMain.on('timeplus', function (_event, _arg) {
    parent.webContents.send('timeplus')
  })

  ipcMain.on('timeminus', function (_event, _arg) {
    parent.webContents.send('timeminus')
  })

  ipcMain.on('timefastback', function (_event, _arg) {
    parent.webContents.send('timefastback')
  })

  ipcMain.on('timefastforward', function (_event, _arg) {
    parent.webContents.send('timefastforward')
  })

  ipcMain.on('quit', function (_event, _arg) {
    app.quit()
  })

  //--------------------------------
  /**/
  parent.webContents.once('did-finish-load', () => {
    // add a transparent clickable child window to capture the mouse events

    addClickableRegion({
      parent,
      x: CHILD_PADDING,
      y: CHILD_PADDING,
      width: w,
      height: h,
    })

    // KEYBOARD SHORTCUTS -------------------------------------
    globalShortcut.register('Shift+CommandOrControl+=', () => {
      parent.webContents.send('opacityplus')
      if (
        global.menubar &&
        global.menubar.window &&
        global.menubar.window.webContents
      )
        global.menubar.window.webContents.send('shortcut', 0)
    })

    globalShortcut.register('Shift+CommandOrControl+-', () => {
      parent.webContents.send('opacityminus')
      if (
        global.menubar &&
        global.menubar.window &&
        global.menubar.window.webContents
      )
        global.menubar.window.webContents.send('shortcut', 1)
    })

    globalShortcut.register('Shift+CommandOrControl+j', () => {
      global.menubarShown ? menubar.hideWindow() : menubar.showWindow()
    })

    /*
    globalShortcut.register('Shift+CommandOrControl+0', () => {
      parent.webContents.send("opacityhalf");
    })
    */
    /*
    globalShortcut.register('Shift+CommandOrControl+t', () => {
      parent.webContents.send("toggleView");
    })
*/
    globalShortcut.register('Shift+CommandOrControl+h', () => {
      parent.webContents.send('opacitynone')
      //global.menubar.window.webContents.send("shortcut",3);
    })
    globalShortcut.register('Shift+CommandOrControl+f', () => {
      parent.webContents.send('opacityfull')
      //global.menubar.window.webContents.send("shortcut",3);
    })

    globalShortcut.register('Shift+CommandOrControl+]', () => {
      parent.webContents.send('timeplus')
    })

    globalShortcut.register('Shift+CommandOrControl+\\', () => {
      parent.webContents.send('skip')
    })

    globalShortcut.register('Shift+CommandOrControl+[', () => {
      parent.webContents.send('timeminus')
    })

    globalShortcut.register('Shift+CommandOrControl+p', () => {
      parent.webContents.send('playpause')
      if (
        global.menubar &&
        global.menubar.window &&
        global.menubar.window.webContents
      )
        global.menubar.window.webContents.send('shortcut', 2)
    })

    globalShortcut.register('Shift+CommandOrControl+m', () => {
      parent.webContents.send('mute')
    })

    //----------------------------------------------------------

    // could do this in index.html
    //parent.webContents.insertCSS(`body { padding:${CHILD_PADDING}px !important; }`);
    //parent.playlist=playlist
    //parent.webContents.send('playlist', playlist);

    parent.show()
    parent.blur()
    /*
    if (!/^win/.test(process.platform)) {
      robot.mouseClick();
    }
*/
  })

  parent.loadURL(INDEX_HTML)
  //parent.openDevTools();
  //---------------------------------

  /*
    // and load the index.html of the app.
    parent.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    }))
  */
  // Open the DevTools.
  // parent.webContents.openDevTools()

  // Emitted when the window is closed.
  parent.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    parent = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Wait for Widevine CDM to be ready (Castlabs ECS requirement)
  if (components && components.whenReady) {
    try {
      await components.whenReady()
      // eslint-disable-next-line no-console
      console.log('Widevine CDM ready:', components.status())
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Widevine CDM initialization failed:', err)
      // Continue anyway - local file playback will still work
    }
  }
  ready()
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (typeof parent !== 'undefined') {
    if (parent === null)
      createWindow(mainScreen.workArea.width, mainScreen.workArea.height)
  }
})

/* eslint-disable no-console */
app.on('widevine-ready', (version, lastVersion) => {
  if (null !== lastVersion) {
    console.log(
      'Widevine ' +
        version +
        ', upgraded from ' +
        lastVersion +
        ', is ready to be used!',
    )
  } else console.log('Widevine ' + version + ' is ready to be used!')
})
app.on('widevine-update-pending', (currentVersion, pendingVersion) => {
  console.log(
    'Widevine ' +
      currentVersion +
      ' is ready to be upgraded to ' +
      pendingVersion +
      '!',
  )
})
app.on('widevine-error', (error) => {
  console.log('Widevine installation encountered an error: ' + error)
})
/* eslint-enable no-console */

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
