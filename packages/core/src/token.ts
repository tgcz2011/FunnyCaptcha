// 简易 HMAC-like token：base64url(payload).signature
// payload = {type, exp, nonce}
// 签名 = sha256(payload + secret)，secret 由调用方注入（前端 demo 用默认值，后端应覆盖）

const defaultSecret = 'funnycaptcha-demo-secret';

export interface TokenPayload {
  type: string;
  exp: number;
  nonce: string;
}

export interface TokenVerifyResult {
  valid: boolean;
  type?: string;
}

function b64urlEncode(s: string): string {
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
}

async function sha256Hex(s: string, secret: string): Promise<string> {
  const data = new TextEncoder().encode(s + secret);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function issueToken(
  type: string,
  ttlMs: number,
  secret: string = defaultSecret,
): Promise<string> {
  const payload: TokenPayload = {
    type,
    exp: Date.now() + ttlMs,
    nonce: crypto.randomUUID(),
  };
  const body = b64urlEncode(JSON.stringify(payload));
  const sig = await sha256Hex(body, secret);
  return `${body}.${sig}`;
}

export async function verifyToken(
  token: string,
  secret: string = defaultSecret,
): Promise<TokenVerifyResult> {
  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false };
  const [body, sig] = parts as [string, string];
  const expected = await sha256Hex(body, secret);
  if (expected !== sig) return { valid: false };
  try {
    const payload = JSON.parse(b64urlDecode(body)) as TokenPayload;
    if (Date.now() > payload.exp) return { valid: false };
    return { valid: true, type: payload.type };
  } catch {
    return { valid: false };
  }
}
