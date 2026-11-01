import { test } from 'node:test';
import assert from 'node:assert/strict';
import { videoStepResponse, videoStepView, type VideoStepInput } from './orientation-video';

const base: VideoStepInput = {
  youTube: false, selfHosted: true, loadFailed: false, required: true, hasTranscript: false, acknowledged: false,
};

test('a required video that cannot play still lets a newcomer continue once they acknowledge it', () => {
  const failed = videoStepView({ ...base, loadFailed: true });
  assert.deepEqual(
    [failed.unavailable, failed.unavailableMessage, failed.showsAcknowledgement, failed.acknowledgementLabel,
      failed.canContinue, failed.continueLabel],
    [true, 'This video could not be loaded.', true, "I'll continue without the video.", false, 'Confirm to continue'],
  );
  const acknowledged = videoStepView({ ...base, loadFailed: true, acknowledged: true });
  assert.deepEqual([acknowledged.canContinue, acknowledged.continueLabel], [true, 'Continue']);
});

test('each source shows the acknowledgement, message and button its state needs', () => {
  const cases: [Partial<VideoStepInput>, Partial<ReturnType<typeof videoStepView>>, string][] = [
    [{ selfHosted: false }, { unavailable: true, unavailableMessage: 'No video is available for this step yet.',
      unavailableHint: 'You can continue without it.', showsAcknowledgement: true, canContinue: false }, 'no source at all'],
    [{ selfHosted: false, hasTranscript: true }, {
      unavailableHint: 'You can read the transcript below and continue.',
      acknowledgementLabel: "I'll continue without the video and have read its transcript." }, 'missing, with a transcript'],
    [{}, { unavailable: false, unavailableMessage: null, showsAcknowledgement: true,
      acknowledgementLabel: 'I watched the video.', canContinue: false, continueLabel: 'Watch to continue' },
      'a playable self-hosted video is acknowledged too, not only by playing to the end'],
    [{ hasTranscript: true }, { acknowledgementLabel: 'I watched the video or reviewed its transcript.' }, 'playable, with a transcript'],
    [{ youTube: true, selfHosted: false, required: false }, { unavailable: false, showsAcknowledgement: true, canContinue: true },
      'an optional YouTube video still offers the acknowledgement'],
    [{ required: false }, { showsAcknowledgement: false, canContinue: true, continueLabel: 'Continue' }, 'an optional self-hosted video'],
  ];
  for (const [input, expected, why] of cases) {
    const view = videoStepView({ ...base, ...input });
    for (const [key, value] of Object.entries(expected)) assert.equal(view[key as keyof typeof view], value, `${why}: ${key}`);
  }
});

test('an unavailable video saves the acknowledgement and flags itself; a playable one saves whether it was watched', () => {
  assert.deepEqual(videoStepResponse({ unavailable: true }, true), { watched: false, acknowledged: true, video_unavailable: true });
  assert.deepEqual(videoStepResponse({ unavailable: false }, true), { watched: true });
  assert.deepEqual(videoStepResponse({ unavailable: false }, false), { watched: false });
});
