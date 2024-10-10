import { ChatSpeechResponse } from '../lib/agents/chat-agent';
import { TranscriptionResult } from '../lib/speech';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ServerToClientEvents {
  toolExecuted: (toolName: string, args: object, executedReturn: object) => void;
}

export interface ClientToServerEvents {
  talk: (input: ArrayBuffer, callback: (result: ChatSpeechResponse) => void) => void;
  chat: (text: string, callback: (result: ChatSpeechResponse) => void) => void;
  asr: (buffer: ArrayBuffer, callback: (result: TranscriptionResult) => void) => void;
}
