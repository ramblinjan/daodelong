// You are the organism's voice register — what it has most recently said aloud.
// I hold the last speech so the face can surface it between breaths.
// You replace my state each time the organism speaks. I am not a log.

export interface SpeechState {
  text: string;
  breathCount: number;
  ts: number;
}

let lastSpeech: SpeechState | null = null;

export function setLastSpeech(state: SpeechState): void {
  lastSpeech = state;
}

export function getLastSpeech(): SpeechState | null {
  return lastSpeech;
}
