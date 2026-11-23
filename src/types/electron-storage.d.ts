// Type definitions for electron-storage module
declare module 'electron-storage' {
  export function get(key: string): Promise<Record<string, unknown>>
  export function set(key: string, data: Record<string, unknown>): Promise<void>
}
