import express, { type Express } from 'express';
import { challengeRouter } from './routes/challenge.js';
import { verifyRouter } from './routes/verify.js';
import { registerVerifier, listVerifierTypes } from './registry.js';
import { issueMathChallenge, verifyMathProof, type MathChallenge } from '@funnycaptcha/math';
import { issueTextChallenge, verifyTextProof, type TextChallenge } from '@funnycaptcha/text-distort';

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  registerVerifier('math', {
    issue: () => {
      const { challenge, payload } = issueMathChallenge();
      return { payload, internal: challenge as MathChallenge };
    },
    verify: (internal, proof) => verifyMathProof(internal as MathChallenge, proof),
  });

  registerVerifier('text-distort', {
    issue: () => {
      const { challenge, payload } = issueTextChallenge();
      return { payload, internal: challenge as TextChallenge };
    },
    verify: (internal, proof) => verifyTextProof(internal as TextChallenge, proof),
  });

  app.use('/api/challenge', challengeRouter);
  app.use('/api/verify', verifyRouter);
  app.get('/api/types', (_req, res) => res.json({ types: listVerifierTypes() }));
  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const app = createApp();
  const port = process.env.PORT ?? 3001;
  app.listen(port, () => console.log(`FunnyChapter server on http://localhost:${port}`));
}
