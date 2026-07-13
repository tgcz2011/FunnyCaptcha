import { Router, type Router as RouterType } from 'express';
import { getVerifier } from '../registry.js';
import { saveChallenge } from '../store.js';
import { issueToken } from '@funnycaptcha/core';

const TTL = 5 * 60 * 1000;

export const challengeRouter: RouterType = Router();

challengeRouter.post('/:type', async (req, res) => {
  const type = req.params.type;
  const v = getVerifier(type);
  if (!v) return res.status(404).json({ error: 'unknown captcha type' });
  const { payload, internal } = v.issue();
  const token = await issueToken(type, TTL);
  const expiresAt = Date.now() + TTL;
  saveChallenge(token, { type, internal, token, expiresAt });
  res.json({ token, payload, expiresAt });
});
