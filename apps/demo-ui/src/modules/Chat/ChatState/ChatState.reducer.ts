import Debug from 'debug';
import {
  ChatAudioEndedState,
  ChatAudioPlayingState,
  ChatConnectedState,
  ChatConnectingState,
  ChatGeneratingState,
  ChatInitState,
  ChatRespondingState,
  ChatState,
  ChatTranscribingState,
} from './ChatState.interface';

const debug = Debug('demo-ui:ChatState:reducer');

export enum ChatStateActionTypes {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  TRANSCRIBE = 'TRANSCRIBE',
  GENERATE = 'GENERATE',
  RESPOND = 'RESPOND',
  PLAY_AUDIO = 'PLAY_AUDIO',
  ERROR = 'ERROR',
  TURN_END = 'TURN_END',
}

export type ChatStateConnecting = {
  type: ChatStateActionTypes.CONNECTING;
};

export type ChatStateConnected = {
  type: ChatStateActionTypes.CONNECTED;
};

export type ChatStateTranscribe = {
  type: ChatStateActionTypes.TRANSCRIBE;
  inputBuffer: ArrayBuffer;
};

export type ChatStateGenerate = {
  type: ChatStateActionTypes.GENERATE;
  transcribedText: string;
};

export type ChatStateRespond = {
  type: ChatStateActionTypes.RESPOND;
  responseBuffer: ArrayBuffer;
  responseStream: MediaStream;
  responseText: string;
};

export type ChatStateAudioPlay = {
  type: ChatStateActionTypes.PLAY_AUDIO;
};

export type ChatStateTurnEnd = {
  type: ChatStateActionTypes.TURN_END;
};

export type ChatStateError = {
  type: ChatStateActionTypes.ERROR;
  error: string;
};

export type ChatStateAction =
  | ChatStateConnecting
  | ChatStateConnected
  | ChatStateTranscribe
  | ChatStateGenerate
  | ChatStateRespond
  | ChatStateAudioPlay
  | ChatStateTurnEnd
  | ChatStateError;

export const defaultState: ChatInitState = {
  isConnecting: false,
  isConnected: false,
  inputBuffer: null,
  transcribedText: null,
  responseBuffer: null,
  responseStream: null,
  responseText: null,
  isGenerating: false,
  isResponding: false,
  isResponded: false,
  isAudioPlaying: false,
  isAudioEnded: false,
  isTranscribing: false,
  isTranscribed: false,
  isError: false,
  error: null,
};

export const chatStateReducer = (state: ChatState, action: ChatStateAction): ChatState => {
  debug(`reducer: action: ${action.type}`, state, action);

  let outputState: ChatState;

  switch (action.type) {
    case ChatStateActionTypes.CONNECTING:
      outputState = {
        ...state,
        isConnected: false,
        isConnecting: true,
      } as ChatConnectingState;

      break;
    case ChatStateActionTypes.CONNECTED:
      outputState = {
        ...state,
        isConnecting: false,
        isConnected: true,
      } as ChatConnectedState;

      break;
    case ChatStateActionTypes.TRANSCRIBE:
      outputState = {
        ...state,
        inputBuffer: action.inputBuffer,
        isTranscribing: true,
        responseBuffer: null,
        responseStream: null,
        responseText: null,
      } as ChatTranscribingState;

      break;
    case ChatStateActionTypes.GENERATE:
      outputState = {
        ...state,
        transcribedText: action.transcribedText,
        isGenerating: true,
        isTranscribing: false,
      } as ChatGeneratingState;

      break;
    case ChatStateActionTypes.RESPOND:
      outputState = {
        ...state,
        responseBuffer: action.responseBuffer,
        responseStream: action.responseStream,
        responseText: action.responseText,
        isResponding: true,
        isGenerating: false,
        isTranscribing: false,
      } as ChatRespondingState;

      break;
    case ChatStateActionTypes.PLAY_AUDIO:
      outputState = {
        ...state,
        isAudioPlaying: true,
        isAudioEnded: false,
        isGenerating: false,
        isTranscribing: false,
      } as ChatAudioPlayingState;

      break;
    case ChatStateActionTypes.TURN_END:
      outputState = {
        ...state,
        isAudioPlaying: false,
        isAudioEnded: true,
        isResponding: false,
        isTranscribing: false,
        isResponded: true,
      } as ChatAudioEndedState;

      break;
    case ChatStateActionTypes.ERROR:
      outputState = {
        ...defaultState,
        ...state,
        isError: true,
        error: action.error,
      };

      break;
    default:
      outputState = state;

      break;
  }

  return outputState;
};
