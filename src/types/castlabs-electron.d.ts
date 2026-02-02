// Type definitions for Castlabs Electron (electron-releases) Widevine events
// These events are specific to the Castlabs fork of Electron that includes Widevine CDM support

// Note: Module augmentation for electron's App interface to add Widevine-specific events
declare namespace Electron {
  interface App {
    /**
     * Emitted when Widevine CDM is ready to be used
     * @param version - The current Widevine version
     * @param lastVersion - The previous Widevine version (null if first install)
     */
    on(
      event: 'widevine-ready',
      listener: (version: string, lastVersion: string | null) => void,
    ): this

    /**
     * Emitted when a Widevine update is available but requires app restart
     * @param currentVersion - The currently installed Widevine version
     * @param pendingVersion - The version that will be installed after restart
     */
    on(
      event: 'widevine-update-pending',
      listener: (currentVersion: string, pendingVersion: string) => void,
    ): this

    /**
     * Emitted when Widevine installation encounters an error
     * @param error - The error that occurred during installation
     */
    on(event: 'widevine-error', listener: (error: Error) => void): this
  }
}
