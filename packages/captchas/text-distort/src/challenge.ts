const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 去除易混字符 I L O 0 1

export interface TextChallenge {
  code: string;
}

export function generateChallenge(len: number = 5): TextChallenge {
  let code = '';
  for (let i = 0; i < len; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)] ?? 'A';
  }
  return { code };
}

export function verifyAnswer(c: TextChallenge, answer: string): boolean {
  return c.code.toLowerCase() === answer.trim().toLowerCase();
}
