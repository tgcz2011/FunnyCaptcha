export interface Verifier {
  issue(): { payload: unknown; internal: unknown };
  verify(internal: unknown, proof: string): Promise<boolean>;
}

const verifiers = new Map<string, Verifier>();

export function registerVerifier(type: string, v: Verifier) {
  verifiers.set(type, v);
}

export function getVerifier(type: string): Verifier | undefined {
  return verifiers.get(type);
}

export function listVerifierTypes(): string[] {
  return Array.from(verifiers.keys());
}
