import { Stream } from 'node:stream';

export class TranscriptionError extends Error {
  constructor(
    public readonly message = 'TranscriptionError',
    public readonly code = 'TRANSCRIPTION_ERROR'
  ) {
    super(message);
  }
}

export interface TranscriptionSuccessResult {
  partial: boolean;
  content: string;

  /// The start time of the result in milliseconds from the start of the audio stream.
  startTime: number;
  /// The end time of the result in milliseconds from the start of the audio stream.
  endTime: number;
  error?: never;
}

export interface TranscriptionErrorResult {
  partial?: never;
  content?: never;
  startTime?: never;
  endTime?: never;
  error: TranscriptionError;
}

export type TranscriptionResult = TranscriptionSuccessResult | TranscriptionErrorResult;

export enum SpeechLanguage {
  ENGLISH = 'en-US',
}

export abstract class SpeechToText {
  public language: SpeechLanguage = SpeechLanguage.ENGLISH;

  public abstract recognize(input: Buffer): Promise<TranscriptionResult>;

  public abstract recognizeStream(input: Stream): Promise<AsyncGenerator<TranscriptionResult>>;
}
