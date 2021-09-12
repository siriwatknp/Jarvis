interface WaitForOptions {
  interval?: number;
  retryCount?: number;
  shouldThrowError?: boolean;
}

export async function waitFor<T>(
  callback: (retry: number) => Promise<T>,
  options?: WaitForOptions
) {
  const {
    interval = 3000,
    retryCount = 5,
    shouldThrowError = false,
  } = options || {};
  let retry = 0;

  function waitForInterval(interval: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(undefined);
      }, interval);
    });
  }

  async function loop(): Promise<T | null> {
    try {
      await waitForInterval(interval);
      return await callback(retry);
    } catch (error) {
      // console.log("error", error);
      retry += 1;
      if (retry >= retryCount) {
        if (shouldThrowError) {
          throw error;
        }
        return null;
      } else {
        return await loop();
      }
    }
  }

  return await loop();
}
