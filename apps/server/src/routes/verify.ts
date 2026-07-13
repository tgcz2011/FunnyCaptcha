import { Router, type Router as RouterType } from 'express';
import { getVerifier } from '../registry.js';
import { consumeChallenge } from '../store.js';
import { verifyToken } from '@funnycaptcha/core';

export const verifyRouter: RouterType = Router();

verifyRouter.post('/:type', async (req, res) => {
  const type = req.params.type;
  const { token, proof } = (req.body ?? {}) as { token?: string; proof?: string };
  if (!token || !proof) return res.status(400).json({ error: 'token and proof required' });

  const tk = await verifyToken(token);
  if (!tk.valid || tk.type !== type) {
    return res.status(400).json({ error: 'invalid token', success: false });
  }

  const stored = consumeChallenge(token);
  if (!stored) {
    return res.status(400).json({ error: 'challenge expired or consumed', success: false });
  }

  const v = getVerifier(type);
  if (!v) return res.status(404).json({ error: 'unknown captcha type', success: false });

  const ok = await v.verify(stored.internal, proof);
  res.json({ success: ok });
});
