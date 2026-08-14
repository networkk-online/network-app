// Lazy loaders for heavy real-time SDKs.
// These packages are megabytes each; keeping them out of the entry chunk makes
// first paint dramatically faster. Each loader caches its promise so the module
// is only fetched/evaluated once per session.

let agoraPromise: Promise<typeof import('agora-rtc-sdk-ng').default> | null = null;
export const loadAgora = () => {
  agoraPromise ??= import('agora-rtc-sdk-ng').then((m) => m.default);
  return agoraPromise;
};

let chimePromise: Promise<typeof import('amazon-chime-sdk-js')> | null = null;
export const loadChime = () => {
  chimePromise ??= import('amazon-chime-sdk-js');
  return chimePromise;
};

let dailyPromise: Promise<typeof import('@daily-co/daily-js').default> | null = null;
export const loadDaily = () => {
  dailyPromise ??= import('@daily-co/daily-js').then((m) => m.default);
  return dailyPromise;
};
