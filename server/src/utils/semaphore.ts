export class Semaphore {
  private current = 0;
  private waiting: Array<() => void> = [];

  constructor(private readonly max: number) {}

  get available(): boolean {
    return this.current < this.max;
  }

  acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.waiting.push(() => {
        this.current++;
        resolve();
      });
    });
  }

  release(): void {
    this.current--;
    const next = this.waiting.shift();
    if (next) {
      next();
    }
  }
}
