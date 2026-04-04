"use client";

type QueueItem = {
  fn: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
};

class RequestQueue {
  private queue: QueueItem[] = [];
  private processing = false;
  private interval: number;

  constructor(intervalMs = 200) {
    this.interval = intervalMs;
  }

  setInterval(ms: number) {
    this.interval = ms;
  }

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      try {
        const result = await item.fn();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
      if (this.queue.length > 0) {
        await new Promise((r) => setTimeout(r, this.interval));
      }
    }

    this.processing = false;
  }
}

export const kisQueue = new RequestQueue(200);
