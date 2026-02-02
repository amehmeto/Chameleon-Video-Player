const { contextBridge, ipcRenderer, webFrame } = require('electron')

// Whitelist of valid IPC channels for security
const validSendChannels = [
  'quitprompt',
  'manual',
  'cmm',
  'github',
  'donate',
  'openStreamBrowser',
  'openURL',
  'showMenu',
  'startwfile',
  'start',
  'startNoPrompt',
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
  'enterlicense',
]

const validReceiveChannels = [
  'relaunch',
  'toggleViz',
  'toggleView',
  'shortcut',
  'mute',
  'opac',
  'opacityplus',
  'opacityminus',
  'opacityhalf',
  'opacitynone',
  'opacityfull',
  'playpause',
  'skip',
  'timeplus',
  'timeminus',
  'timefastback',
  'timefastforward',
  'invalid',
  'thx',
  'triallimit',
]

contextBridge.exposeInMainWorld('api', {
  // IPC communication
  send: (channel, data) => {
    if (validSendChannels.includes(channel)) ipcRenderer.send(channel, data)
  },

  on: (channel, callback) => {
    if (validReceiveChannels.includes(channel)) {
      // Wrap callback to strip event object for security
      const subscription = (_event, ...args) => callback(...args)
      ipcRenderer.on(channel, subscription)
      // Return unsubscribe function
      return () => ipcRenderer.removeListener(channel, subscription)
    }
  },

  // Invoke handlers (async)
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),

  // App control (replaces remote.app)
  relaunch: () => ipcRenderer.invoke('app:relaunch'),
  quit: () => ipcRenderer.invoke('app:quit'),

  // Global getters (replaces remote.getGlobal)
  getPlaylist: () => ipcRenderer.invoke('get:playlist'),
  getSteam: () => ipcRenderer.invoke('get:steam'),
  getTrials: () => ipcRenderer.invoke('get:trials'),

  // Platform info
  platform: process.platform,

  // WebFrame zoom control (for controller.js)
  setZoomLimits: () => {
    webFrame.setVisualZoomLevelLimits(1, 1)
  },
})
