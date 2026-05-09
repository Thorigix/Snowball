# Dev3pack Feature Opportunities

This is the prioritized list of features that can pull Dev3pack judges in without overclaiming production readiness.

## Already Added

- Proof tab Dev3pack Prize Fit matrix.
- Proof tab judge checklist.
- Backend preflight endpoint: `GET /api/demo/preflight`.
- Live/fallback/demo-only status cards.
- LI.FI quote preview vs live quote attempt UI.
- ElevenLabs missing-credentials fallback labeling.
- Submission docs and 5-minute judge quickstart.

## Best Next Features

### 1. One-Click Judge Mode

Add a top-level "Judge Mode" button that opens the exact 90-second path: preflight, wallet, deposit, receipt, AI, seller release, proof.

Impact: reduces demo friction and keeps judges from wandering.

Risk: low; mostly routing and state highlighting.

### 2. Copyable Grant Packet

Add a docs page or in-app Proof button that exposes the pitch, problem, solution, tech stack, live claims, and next milestones as copyable sections.

Impact: helps judges and grant reviewers understand the project quickly.

Risk: low; static content.

### 3. Screenshot Checklist Page

Create a `submission/screenshots.md` checklist with exact screens to capture and captions.

Impact: improves Devfolio/GitHub submission polish.

Risk: none.

### 4. LI.FI Live Quote With EVM Address Input

Add an optional EVM `fromAddress` field so the LI.FI endpoint can attempt a real quote without hiding missing parameters.

Impact: stronger partner proof.

Risk: medium; quote params and token/chain IDs need careful validation.

### 5. ElevenLabs Demo Credentials Gate

Add an env status panel that clearly says whether the voice agent is live, fallback, or unavailable.

Impact: avoids judge confusion.

Risk: low.

### 6. Anchor Test Summary Page

Add a generated or static proof page listing the devnet lifecycle command and sample signatures from `handoff/a6-devnet-demo-flow.md`.

Impact: stronger technical credibility.

Risk: low.

### 7. On-Chain Dispute/Refund MVP

Implement minimal Anchor instructions for dispute flag and refund.

Impact: high if time allows.

Risk: high; can break the working demo close to submission.

## Recommendation

Do not build high-risk Anchor changes before the current demo is recorded. Prioritize Judge Mode, screenshot checklist, and copyable grant packet first.
