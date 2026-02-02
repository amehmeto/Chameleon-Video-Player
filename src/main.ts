import {
  app,
  shell,
  ipcMain,
  globalShortcut,
  dialog,
  BrowserWindow,
  screen as screenElectron,
  IpcMainEvent,
} from 'electron'
import * as path from 'path'
import * as storage from 'electron-storage'
import { menubar as Menubar, Menubar as MenubarType } from 'menubar'

// Castlabs components API for Widevine CDM

const electron = require('electron')
const { components } = electron as {
  components?: {
    whenReady: () => Promise<void>
    status: () => string
  }
}

interface ClickableRegionOptions {
  parent: BrowserWindow
  x?: number
  y?: number
  width?: number
  height?: number
}

let toggleCounter = 0
let dia = false

//-------------------
const DRM = false
const steam = false
const prompt = false
//-------------------

// Declare globals (use appMenubar to avoid conflict with DOM BarProp type)
declare global {
  var playlist: string | string[] | undefined

  var steam: boolean

  var trials: number

  var appMenubar: MenubarType | undefined

  var menubarShown: boolean
}

global.steam = DRM && steam

const INDEX_HTML = path.join('file://', __dirname, '..', 'index.html')
const PROMPT_HTML = path.join('file://', __dirname, '..', 'prompt.html')
const MODE_HTML = path.join('file://', __dirname, '..', 'mode.html')
const TRANSPARENT_HTML = path.join(
  'file://',
  __dirname,
  '..',
  'transparent.html',
)
const MENU = path.join('file://', __dirname, '..', 'menu.html')
const CHILD_PADDING = 0

ipcMain.on('quitprompt', function (_event: IpcMainEvent, _arg: unknown) {
  app.quit()
})

ipcMain.on('manual', function (_event: IpcMainEvent, _arg: unknown) {
  shell.openExternal('http://www.cinqmarsmedia.com/chameleon/manual.html')
})

ipcMain.on('cmm', function (_event: IpcMainEvent, _arg: unknown) {
  shell.openExternal('https://www.cinqmarsmedia.com/')
})

ipcMain.on('github', function (_event: IpcMainEvent, _arg: unknown) {
  shell.openExternal(
    'https://github.com/Cinq-Mars-Media/Chameleon-Video-Player',
  )
})

ipcMain.on('donate', function (_event: IpcMainEvent, _arg: unknown) {
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

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const addClickableRegion = (options: ClickableRegionOptions): void => {
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
    icon: path.join(__dirname, '..', 'assets/icons/png/icon_32x32@2x.png'),
  })

  childWindow.loadURL(TRANSPARENT_HTML)
  childWindow.setIgnoreMouseEvents(true)

  function initMenubar(): void {
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
    global.appMenubar = menubar
    globalShortcut.register('Shift+CommandOrControl+t', () => {
      if (
        global.appMenubar &&
        global.appMenubar.window &&
        global.appMenubar.window.webContents
      )
        global.appMenubar.window.webContents.send('toggleView')
    })
  }

  initMenubar()

  global.menubarShown = true
  global.appMenubar
    ?.on('after-show', () => {
      global.menubarShown = true
    })
    .on('after-hide', () => {
      global.menubarShown = false
    })
    .on('focus-lost', () => {
      global.menubarShown = false
      global.appMenubar?.hideWindow()
    })
}

let modeWin: BrowserWindow | null = null

function start(): void {
  ipcMain.on(
    'openStreamBrowser',
    function (_event: IpcMainEvent, url: unknown) {
      if (typeof url !== 'string') return
      global.playlist = url
      getdimensions()

      if (modeWin) modeWin.close()
    },
  )

  ipcMain.on('openURL', function (_event: IpcMainEvent, arg: unknown) {
    if (typeof arg !== 'string') return
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
    global.playlist = result
    getdimensions()

    if (modeWin) modeWin.close()
  })

  ipcMain.on('showMenu', function (_event: IpcMainEvent, _arg: unknown) {
    global.appMenubar?.showWindow()
  })

  ipcMain.on('startwfile', function (_event: IpcMainEvent, _arg: unknown) {
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
            getdimensions()

            if (modeWin) modeWin.close()
          }
          dia = false
        })
        // eslint-disable-next-line no-console
        .catch(console.log)
    }
  })

  ipcMain.on('quitprompt', function (_event: IpcMainEvent, _arg: unknown) {
    app.quit()
  })

  modeWin = new BrowserWindow({
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
  modeWin.on('close', function () {
    if (typeof global.playlist === 'undefined') app.quit()
  })
}

let promptWin: BrowserWindow | undefined

function promptDonate(): void {
  ipcMain.on('start', function (_event: IpcMainEvent, _arg: unknown) {
    start()
    if (promptWin) promptWin.close()
  })

  ipcMain.on('startNoPrompt', function (_event: IpcMainEvent, _arg: unknown) {
    storage
      .set('auth', {
        data: 'U2FsdGVV3JFudJsuhkjevNoHTzYUz9VwaAMWMvUPaIUsqcDmAKSNWR2eR643rYXSryqb',
      })
      .then(function () {
        start()
        if (promptWin) promptWin.close()
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

function ready(): void {
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
      .then((data: Record<string, unknown>) => {
        if (data.data) start()
        else promptDonate()
      })
      .catch(() => {
        storage
          .get('data')
          .then(() => {
            start()
          })
          .catch(() => {
            promptDonate()
          })
      })
  } else start()
}

function getdimensions(): void {
  if (process.platform === 'darwin') app.dock.hide()

  const mainScreen = screenElectron.getPrimaryDisplay()

  // hides the dock icon for our app which allows our windows to join other
  // apps' spaces. without this our windows open on the nearest "desktop" space

  // "floating" + 1 is higher than all regular windows, but still behind things
  // like spotlight or the screen saver

  createWindow(
    mainScreen.workArea.width,
    mainScreen.workArea.height,
    global.playlist,
  )
  if (typeof promptWin !== 'undefined') promptWin.close()
}

function createWindow(
  w: number,
  h: number,
  p: string | string[] | undefined,
): void {
  let parent: BrowserWindow | null = new BrowserWindow({
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
      global.appMenubar &&
      global.appMenubar.window &&
      global.appMenubar.window.webContents
    )
      global.appMenubar.window.webContents.send('toggleView')
  })

  ipcMain.on('toggle', function () {
    toggleCounter++

    if (toggleCounter % 2) parent?.setIgnoreMouseEvents(true)
    else parent?.setIgnoreMouseEvents(false)

    parent?.webContents.send('toggleViz', toggleCounter % 2)
  })

  ipcMain.on('goBack', function (_event: IpcMainEvent, _arg: unknown) {
    parent?.webContents.send('relaunch')
  })

  ipcMain.on('toggleMenu', function (_event: IpcMainEvent, _arg: unknown) {
    //TOGGLE MENU
  })

  ipcMain.on('opac', function (_event: IpcMainEvent, arg: unknown) {
    parent?.webContents.send('opac', arg)
  })

  ipcMain.on('opacityplus', function (_event: IpcMainEvent, _arg: unknown) {
    parent?.webContents.send('opacityplus')
  })

  ipcMain.on('opacityminus', function (_event: IpcMainEvent, _arg: unknown) {
    parent?.webContents.send('opacityminus')
  })

  ipcMain.on('playpause', function (_event: IpcMainEvent, _arg: unknown) {
    parent?.webContents.send('playpause')
  })

  ipcMain.on('timeplus', function (_event: IpcMainEvent, _arg: unknown) {
    parent?.webContents.send('timeplus')
  })

  ipcMain.on('timeminus', function (_event: IpcMainEvent, _arg: unknown) {
    parent?.webContents.send('timeminus')
  })

  ipcMain.on('timefastback', function (_event: IpcMainEvent, _arg: unknown) {
    parent?.webContents.send('timefastback')
  })

  ipcMain.on('timefastforward', function (_event: IpcMainEvent, _arg: unknown) {
    parent?.webContents.send('timefastforward')
  })

  ipcMain.on('quit', function (_event: IpcMainEvent, _arg: unknown) {
    app.quit()
  })

  //--------------------------------
  parent.webContents.once('did-finish-load', () => {
    // add a transparent clickable child window to capture the mouse events

    addClickableRegion({
      parent: parent!,
      x: CHILD_PADDING,
      y: CHILD_PADDING,
      width: w,
      height: h,
    })

    // KEYBOARD SHORTCUTS -------------------------------------
    globalShortcut.register('Shift+CommandOrControl+=', () => {
      parent?.webContents.send('opacityplus')
      if (
        global.appMenubar &&
        global.appMenubar.window &&
        global.appMenubar.window.webContents
      )
        global.appMenubar.window.webContents.send('shortcut', 0)
    })

    globalShortcut.register('Shift+CommandOrControl+-', () => {
      parent?.webContents.send('opacityminus')
      if (
        global.appMenubar &&
        global.appMenubar.window &&
        global.appMenubar.window.webContents
      )
        global.appMenubar.window.webContents.send('shortcut', 1)
    })

    globalShortcut.register('Shift+CommandOrControl+j', () => {
      global.menubarShown
        ? global.appMenubar?.hideWindow()
        : global.appMenubar?.showWindow()
    })

    globalShortcut.register('Shift+CommandOrControl+h', () => {
      parent?.webContents.send('opacitynone')
    })

    globalShortcut.register('Shift+CommandOrControl+f', () => {
      parent?.webContents.send('opacityfull')
    })

    globalShortcut.register('Shift+CommandOrControl+]', () => {
      parent?.webContents.send('timeplus')
    })

    globalShortcut.register('Shift+CommandOrControl+\\', () => {
      parent?.webContents.send('skip')
    })

    globalShortcut.register('Shift+CommandOrControl+[', () => {
      parent?.webContents.send('timeminus')
    })

    globalShortcut.register('Shift+CommandOrControl+p', () => {
      parent?.webContents.send('playpause')
      if (
        global.appMenubar &&
        global.appMenubar.window &&
        global.appMenubar.window.webContents
      )
        global.appMenubar.window.webContents.send('shortcut', 2)
    })

    globalShortcut.register('Shift+CommandOrControl+m', () => {
      parent?.webContents.send('mute')
    })

    //----------------------------------------------------------

    parent?.show()
    parent?.blur()
  })

  parent.loadURL(INDEX_HTML)
  //---------------------------------

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
  const mainScreen = screenElectron.getPrimaryDisplay()
  createWindow(mainScreen.workArea.width, mainScreen.workArea.height, undefined)
})

/* eslint-disable no-console */
// Castlabs Widevine events - types defined in ./types/castlabs-electron.d.ts
app.on('widevine-ready', (version: string, lastVersion: string | null) => {
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

app.on(
  'widevine-update-pending',
  (currentVersion: string, pendingVersion: string) => {
    console.log(
      'Widevine ' +
        currentVersion +
        ' is ready to be upgraded to ' +
        pendingVersion +
        '!',
    )
  },
)

app.on('widevine-error', (error: Error) => {
  console.log('Widevine installation encountered an error: ' + error)
})
/* eslint-enable no-console */
