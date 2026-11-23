// Type definitions for the Electron API exposed via contextBridge

interface ElectronAPI {
  send: (channel: string, data?: unknown) => void
  on: (
    channel: string,
    callback: (...args: unknown[]) => void,
  ) => (() => void) | undefined
  invoke: (channel: string, data?: unknown) => Promise<unknown>
  relaunch: () => Promise<void>
  quit: () => Promise<void>
  getPlaylist: () => Promise<string | string[] | null>
  getSteam: () => Promise<boolean | null>
  getTrials: () => Promise<number>
  platform: NodeJS.Platform
  setZoomLimits: () => void
}

declare global {
  interface Window {
    api: ElectronAPI
  }

  // Global variables used in main process

  var playlist: string | string[] | undefined

  var steam: boolean

  var trials: number

  var appMenubar: import('menubar').Menubar | undefined

  var menubarShown: boolean
}

export {}
