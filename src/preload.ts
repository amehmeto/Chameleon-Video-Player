/* eslint-disable no-console */
import {
  contextBridge,
  ipcRenderer,
  webFrame,
  IpcRendererEvent,
} from 'electron'

// Whitelist of valid IPC channels for security
const validSendChannels: string[] = [
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

const validReceiveChannels: string[] = [
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
  send: (channel: string, data?: unknown): void => {
    if (validSendChannels.includes(channel)) ipcRenderer.send(channel, data)
  },

  on: (
    channel: string,
    callback: (...args: unknown[]) => void,
  ): (() => void) | undefined => {
    if (validReceiveChannels.includes(channel)) {
      // Wrap callback to strip event object for security
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        callback(...args)
      ipcRenderer.on(channel, subscription)
      // Return unsubscribe function
      return () => ipcRenderer.removeListener(channel, subscription)
    }
    return undefined
  },

  // Invoke handlers (async) with error handling
  invoke: async (channel: string, data?: unknown): Promise<unknown> => {
    try {
      return await ipcRenderer.invoke(channel, data)
    } catch (error) {
      console.error(`IPC invoke error on channel "${channel}":`, error)
      throw error
    }
  },

  // App control (replaces remote.app)
  relaunch: async (): Promise<void> => {
    try {
      await ipcRenderer.invoke('app:relaunch')
    } catch (error) {
      console.error('Failed to relaunch app:', error)
      throw error
    }
  },
  quit: async (): Promise<void> => {
    try {
      await ipcRenderer.invoke('app:quit')
    } catch (error) {
      console.error('Failed to quit app:', error)
      throw error
    }
  },

  // Global getters (replaces remote.getGlobal)
  getPlaylist: async (): Promise<string | string[] | null> => {
    try {
      return (await ipcRenderer.invoke('get:playlist')) as
        | string
        | string[]
        | null
    } catch (error) {
      console.error('Failed to get playlist:', error)
      return null
    }
  },
  getSteam: async (): Promise<boolean | null> => {
    try {
      return (await ipcRenderer.invoke('get:steam')) as boolean | null
    } catch (error) {
      console.error('Failed to get steam status:', error)
      return null
    }
  },
  getTrials: async (): Promise<number> => {
    try {
      return (await ipcRenderer.invoke('get:trials')) as number
    } catch (error) {
      console.error('Failed to get trials:', error)
      return 0
    }
  },

  // Platform info
  platform: process.platform,

  // WebFrame zoom control (for controller.js)
  setZoomLimits: (): void => {
    webFrame.setVisualZoomLevelLimits(1, 1)
  },
})
