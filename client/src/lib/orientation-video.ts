// Orientation video step: what the step shows and saves for each source; see client/src/AGENTS.md §Orientation journeys.

export interface VideoStepInput {
  /** A YouTube embed id was found in `video_url`. */
  youTube: boolean;
  /** A self-hosted `video_url` resolved to a playable URL. */
  selfHosted: boolean;
  /** The `<video>` fired `error` (e.g. a missing asset the SPA answers with HTML). */
  loadFailed: boolean;
  required: boolean;
  hasTranscript: boolean;
  /** The acknowledgement is ticked, or a self-hosted video played to the end. */
  acknowledged: boolean;
}

export interface VideoStepView {
  /** Nothing can play here: no source, or the self-hosted video failed to load. */
  unavailable: boolean;
  /** Shown in place of the player when unavailable. */
  unavailableMessage: string | null;
  unavailableHint: string | null;
  showsAcknowledgement: boolean;
  acknowledgementLabel: string;
  canContinue: boolean;
  continueLabel: string;
}

/** A required video gates Continue on an acknowledgement for every source, including one that cannot play. */
export function videoStepView(input: VideoStepInput): VideoStepView {
  const unavailable = !input.youTube && (!input.selfHosted || input.loadFailed);
  const canContinue = !input.required || input.acknowledged;
  return {
    unavailable,
    unavailableMessage: !unavailable ? null
      : input.selfHosted ? 'This video could not be loaded.' : 'No video is available for this step yet.',
    unavailableHint: !unavailable ? null
      : input.hasTranscript ? 'You can read the transcript below and continue.' : 'You can continue without it.',
    showsAcknowledgement: input.required || input.youTube,
    acknowledgementLabel: unavailable
      ? `I'll continue without the video${input.hasTranscript ? ' and have read its transcript' : ''}.`
      : `I watched the video${input.hasTranscript ? ' or reviewed its transcript' : ''}.`,
    canContinue,
    continueLabel: canContinue ? 'Continue' : unavailable ? 'Confirm to continue' : 'Watch to continue',
  };
}

/** What the step saves: an unavailable video records the acknowledgement and flags itself for content owners. */
export function videoStepResponse(view: Pick<VideoStepView, 'unavailable'>, acknowledged: boolean):
  { watched: boolean; acknowledged?: boolean; video_unavailable?: true } {
  return view.unavailable
    ? { watched: false, acknowledged, video_unavailable: true }
    : { watched: acknowledged };
}
