interface StoredChallenge {
  type: string;
  internal: unknown;
  token: string;
  expiresAt: number;
}

const store = new Map<string, StoredChallenge>();

export function saveChallenge(token: string, c: StoredChallenge) {
  store.set(token, c);
  // 自动清理
  setTimeout(() => store.delete(token), Math.max(0, c.expiresAt - Date.now()));
}

export function getChallenge(token: string): StoredChallenge | undefined {
  const c = store.get(token);
  if (!c || Date.now() > c.expiresAt) {
    if (c) store.delete(token);
    return undefined;
  }
  return c;
}

export function consumeChallenge(token: string): StoredChallenge | undefined {
  const c = getChallenge(token);
  if (c) store.delete(token);
  return c;
}

export function _resetForTest() {
  store.clear();
}
