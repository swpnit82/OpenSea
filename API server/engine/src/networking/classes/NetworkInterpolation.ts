import { ID, Snapshot } from '../types/SnapshotDataTypes'

/**
 * Component class for Snapshot interpolation.\
 * Snap shot is based on this {@link https://github.com/geckosio/snapshot-interpolation | library by yandeu}.
 * @author HydraFire <github.com/HydraFire>
 */

export class NetworkInterpolation {
  /** An instance of this class, like a singleton. */
  public static instance = new NetworkInterpolation()

  /** Vault to store snapshots. */
  public vault: Snapshot[] = []
  /** Size of the vault. */
  vaultSize = 200
  /** Time offset between client and server. */
  timeOffset = 25
  /** The number of checks that will pass before the interpolation delay decreases. */
  checkCount = 0
  checkDelay = 0
  /** Last time interpolation was performed. */
  serverTimePrev = 0
  /** Interpolation buffer for snapshots. */
  _interpolationBuffer = 128
  /** The current server time based on the current snapshot interpolation. */
  public serverTime = 0

  /** Get and set Interpolation buffer. */
  public get interpolationBuffer(): any {
    return {
      /** Get the Interpolation Buffer time in milliseconds. */
      get: () => this._interpolationBuffer,
      /** Set the Interpolation Buffer time in milliseconds. */
      set: (milliseconds: number) => {
        this._interpolationBuffer = milliseconds
      }
    }
  }
  /**
   * Get a Snapshot by its ID.
   * @param id ID of the snapshot.
   * @returns Snapshot of given ID.
   */
  getById(id: ID): Snapshot {
    return this.vault.filter((snapshot) => snapshot.id === id)?.[0]
  }

  /** Get the latest snapshot */
  get(): Snapshot | undefined
  /** Get the two snapshots around a specific time */
  get(time: number): { older: Snapshot; newer: Snapshot } | undefined
  /** Get the closest snapshot to e specific time */
  get(time: number, closest: boolean): Snapshot | undefined

  get(time?: number, closest?: boolean) {
    // zero index is the newest snapshot
    const sorted = this.vault.sort((a, b) => b.time - a.time)

    if (typeof time === 'undefined') return sorted[0]

    for (let i = 0; i < sorted.length; i++) {
      const snap = sorted[i]
      if (snap.time <= time) {
        const snaps = { older: sorted[i], newer: sorted[i - 1] }
        if (closest) {
          const older = Math.abs(time - snaps.older.time)
          if (snaps.newer === undefined) return sorted[0]
          const newer = Math.abs(time - snaps.newer.time)
          if (newer <= older) return snaps.older
          else return snaps.newer
        }
        return snaps
      }
    }
  }

  /**
   * Add a snapshot to the vault.
   * @param snapshot Snapshot to be added in vault.
   */
  add(snapshot: Snapshot): void {
    if (this.vault.length > this.vaultSize - 1) {
      // remove the oldest snapshot
      this.vault.sort((a, b) => a.time - b.time).shift()
    }
    this.vault.push(snapshot)
  }

  /**
   * Get the current capacity (size) of the vault.
   * @returns Current capacity (size) of the vault.
   */
  public get size(): number {
    return this.vault.length
  }

  /**
   * Set the max capacity (size) of the vault.
   * @param size New Max capacity of vault.
   */
  setMaxSize(size: number): void {
    this.vaultSize = size
  }

  /**
   * Get the max capacity (size) of the vault.
   * @returns Max capacity o the vault.
   */
  getMaxSize(): number {
    return this.vaultSize
  }
}
