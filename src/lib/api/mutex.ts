/**
 * A minimal async mutex, used to collapse concurrent token refreshes into one.
 *
 * Small enough not to warrant a dependency, and it keeps `baseQuery` free of any
 * shared mutable module state beyond this instance.
 */
export class Mutex {
  private locked = false;
  private waiters: Array<() => void> = [];

  isLocked(): boolean {
    return this.locked;
  }

  /** Acquire the lock, resolving with the release function. */
  async acquire(): Promise<() => void> {
    while (this.locked) {
      await this.waitForUnlock();
    }
    this.locked = true;
    return () => this.release();
  }

  /** Resolves immediately when unlocked, otherwise on the next release. */
  waitForUnlock(): Promise<void> {
    if (!this.locked) return Promise.resolve();
    return new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });
  }

  private release(): void {
    this.locked = false;
    const waiters = this.waiters;
    this.waiters = [];
    waiters.forEach((resolve) => resolve());
  }
}
