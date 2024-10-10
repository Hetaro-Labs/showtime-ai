export interface ServerToClientEvents {
  toolExecuted: (toolName: string, args: object, executedReturn: object) => void;
}

export interface ClientToServerEvents {
  talk: (input: ArrayBuffer, callback: (result: ChatSpeechResponse) => void) => void;
  chat: (text: string, callback: (result: ChatSpeechResponse) => void) => void;
  asr: (buffer: ArrayBuffer, callback: (result: TranscriptionResult) => void) => void;
}

export class ChatAgentError extends Error {
  constructor(
    public readonly message = 'ChatAgentError',
    public readonly code = 'ERROR'
  ) {
    super(message);
  }
}

export interface ChatSpeechSuccessResponse {
  responseSpeech: ArrayBuffer;
  responseText: string;
  inputText: string;
  error?: never;
}

export interface ChatSpeechErrorResponse {
  responseSpeech?: never;
  responseText?: never;
  inputText: string;
  error: ChatAgentError;
}

export type ChatSpeechResponse = ChatSpeechSuccessResponse | ChatSpeechErrorResponse;

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
