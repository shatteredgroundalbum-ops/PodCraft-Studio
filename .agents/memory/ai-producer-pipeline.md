---
name: AI Producer Pipeline
description: Architecture of the 8-stage AI Producer system — service locations, stage IDs, approval gate pattern
---

## Stage service locations
All stage services live at `artifacts/podcraft-central/src/services/ai/stages/`:
- `planningService.ts` — Stage 1: topic ideas, generateBlueprint → EpisodeBlueprint
- `preProductionService.ts` — Stage 2: generateResearchPackage, generateOutline, generateInterviewQuestions
- `postProductionService.ts` — Stage 4: generateEditRecommendations, detectFillerWords, generateCleanupPlan
- `mixingService.ts` — Stage 5: generateMixRecommendations, evaluateLoudness
- `packagingService.ts` — Stage 7: generateCompletePackage → EpisodePackage (metadata, showNotes, chapters, socialCopy)
- `distributionService.ts` — Stage 8: generateDistributionPackage → DistributionPackage

Production (Stage 3) uses existing `recordingCoachService.ts`
Mastering (Stage 6) uses existing `masteringAssistantService.ts`

## Quality scorecard
`artifacts/podcraft-central/src/services/ai/qualityScorecardService.ts`
9 categories: audioQuality, noiseLevel, loudnessCompliance, scriptStructure, pacing, introQuality, outroQuality, metadataCompleteness, distributionReadiness
Input type: `ScorecardInput` (exported from qualityScorecardService)

## Approval gate
`artifacts/podcraft-central/src/components/ApprovalGate.tsx`
Used in Distribution stage before generating distribution package. Must be used before any destructive/publishing action.
`ApprovalRequest.impact` values: 'low' | 'medium' | 'high' | 'destructive'

## Page
`artifacts/podcraft-central/src/pages/AIProducer.tsx` — route `/ai-producer`
All stage panels are inline components (not exported). State is flat useState hooks.

## Types
All pipeline types in `artifacts/podcraft-central/src/services/ai/types.ts` starting at line ~118.
New types: ProductionStage, EpisodeBlueprint, ResearchPackage, EpisodeOutline, EditRecommendation, MixRecommendation, EpisodePackage, DistributionPackage, QualityScorecard, ApprovalRequest, ProducerEpisodeContext

**Why:** Approval gate pattern ensures AI Producer cannot publish/export/overwrite without explicit user sign-off.
**How to apply:** Any future action that modifies audio, exports files, or publishes content must first set an `ApprovalRequest` in state and render `<ApprovalGate>`. The actual action runs only in `onApprove`.
