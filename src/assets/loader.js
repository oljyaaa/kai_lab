class HttpError extends Error {
  constructor(response) {
    super(`HTTP ${response.status} for ${response.url}`);
    this.name = "HttpError";
    this.status = response.status;
  }
}

const abortError = () =>
  new DOMException("The operation was aborted.", "AbortError");
const delay = (ms, signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(abortError());
      },
      { once: true },
    );
  });

export async function fetchJson(url, { signal } = {}) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new HttpError(response);
  return response.json();
}

export async function withRetry(
  operation,
  { attempts = 3, baseMs = 120, signal } = {},
) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (signal?.aborted) throw abortError();
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (
        error.name === "AbortError" ||
        (error instanceof HttpError &&
          error.status >= 400 &&
          error.status < 500) ||
        attempt === attempts - 1
      )
        throw error;
      const jitter = Math.round(Math.random() * baseMs);
      await delay(baseMs * 2 ** attempt + jitter, signal);
    }
  }
  throw lastError;
}

export async function loadImage(url, { signal } = {}) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new HttpError(response);
  const blob = await response.blob();
  if (signal?.aborted) throw abortError();
  const image = new Image();
  const objectUrl = URL.createObjectURL(blob);
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error(`Не вдалося декодувати ${url}`));
      image.src = objectUrl;
    });
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function loadAudio(context, url, { signal } = {}) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new HttpError(response);
  const data = await response.arrayBuffer();
  if (signal?.aborted) throw abortError();
  return context.decodeAudioData(data);
}

export const loadJson = (url, { signal } = {}) => fetchJson(url, { signal });

export async function loadAll(
  manifest,
  { context, signal, onProgress = () => {} } = {},
) {
  const entries = manifest.assets || manifest;
  let completed = 0;
  onProgress({ completed, total: entries.length, id: null });
  const loaded = await Promise.all(
    entries.map(async (asset) => {
      const loader =
        asset.type === "image"
          ? () => loadImage(asset.url, { signal })
          : asset.type === "audio"
            ? () => loadAudio(context, asset.url, { signal })
            : () => loadJson(asset.url, { signal });
      const value = await withRetry(loader, { signal });
      completed += 1;
      onProgress({ completed, total: entries.length, id: asset.id });
      return [asset.id, value];
    }),
  );
  return Object.fromEntries(loaded);
}

export { HttpError };
