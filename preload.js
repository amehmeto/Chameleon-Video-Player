/* eslint-disable no-console */
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

  // Invoke handlers (async) with error handling
  invoke: async (channel, data) => {
    try {
      return await ipcRenderer.invoke(channel, data)
    } catch (error) {
      console.error(`IPC invoke error on channel "${channel}":`, error)
      throw error
    }
  },

  // App control (replaces remote.app)
  relaunch: async () => {
    try {
      return await ipcRenderer.invoke('app:relaunch')
    } catch (error) {
      console.error('Failed to relaunch app:', error)
      throw error
    }
  },
  quit: async () => {
    try {
      return await ipcRenderer.invoke('app:quit')
    } catch (error) {
      console.error('Failed to quit app:', error)
      throw error
    }
  },

  // Global getters (replaces remote.getGlobal)
  getPlaylist: async () => {
    try {
      return await ipcRenderer.invoke('get:playlist')
    } catch (error) {
      console.error('Failed to get playlist:', error)
      return null
    }
  },
  getSteam: async () => {
    try {
      return await ipcRenderer.invoke('get:steam')
    } catch (error) {
      console.error('Failed to get steam status:', error)
      return null
    }
  },
  getTrials: async () => {
    try {
      return await ipcRenderer.invoke('get:trials')
    } catch (error) {
      console.error('Failed to get trials:', error)
      return 0
    }
  },

  // Platform info
  platform: process.platform,

  // WebFrame zoom control (for controller.js)
  setZoomLimits: () => {
    webFrame.setVisualZoomLevelLimits(1, 1)
  },
})
