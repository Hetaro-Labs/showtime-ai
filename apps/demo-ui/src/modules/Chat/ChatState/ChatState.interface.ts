export interface ChatInitState {
  isConnecting: false;
  isConnected: false;
  isAudioPlaying: false;
  isAudioEnded: false;
  inputBuffer: null;
  transcribedText: null;
  responseBuffer: null;
  responseStream: null;
  responseText: null;
  isGenerating: false;
  isResponding: false;
  isResponded: false;
  isTranscribing: false;
  isTranscribed: false;
  isError: false;
  error: null;
}

export interface ChatConnectingState extends Omit<ChatInitState, 'isConnecting' | 'isConnected'> {
  isConnecting: true;
  isConnected: false;
}

export interface ChatConnectedState extends Omit<ChatInitState, 'isConnecting' | 'isConnected'> {
  isConnecting: false;
  isConnected: true;
}

export interface ChatTranscribingState
  extends Omit<ChatInitState, 'isTranscribing' | 'inputBuffer'> {
  inputBuffer: ArrayBuffer;
  isTranscribing: true;
  isTranscribed: false;
  responseBuffer: null;
  responseStream: null;
  responseText: null;
}

export interface ChatTranscribedState
  extends Omit<ChatTranscribingState, 'isTranscribed' | 'isTranscribing' | 'transcribedText'> {
  transcribedText: string;
  isTranscribing: false;
  isTranscribed: true;
}

export interface ChatGeneratingState extends Omit<ChatTranscribedState, 'isGenerating'> {
  isGenerating: true;
}

export interface ChatGeneratedState
  extends Omit<
    ChatGeneratingState,
    'isGenerating' | 'responseBuffer' | 'responseStream' | 'responseText'
  > {
  isGenerating: false;
  responseBuffer: ArrayBuffer;
  responseStream: MediaStream;
  responseText: string;
}

export interface ChatRespondingState extends Omit<ChatGeneratedState, 'isResponding'> {
  isResponding: true;
}

export interface ChatRespondedState
  extends Omit<ChatRespondingState, 'isResponding' | 'isResponded'> {
  isResponding: false;
  isResponded: true;
}

export interface ChatAudioPlayingState
  extends Omit<ChatRespondedState, 'isAudioPlaying' | 'isAudioEnded'> {
  isAudioPlaying: true;
  isAudioEnded: false;
}

export interface ChatAudioEndedState
  extends Omit<ChatRespondedState, 'isAudioPlaying' | 'isAudioEnded'> {
  isAudioPlaying: false;
  isAudioEnded: true;
}

export interface ChatErrorState {
  isConnecting: boolean;
  isConnected: boolean;
  inputBuffer: ArrayBuffer | null;
  transcribedText: string | null;
  responseBuffer: ArrayBuffer | null;
  responseStream: MediaStream | null;
  responseText: string | null;
  isGenerating: boolean;
  isResponding: boolean;
  isResponded: boolean;
  isAudioPlaying: boolean;
  isAudioEnded: boolean;
  isTranscribing: boolean;
  isTranscribed: boolean;
  isError: true;
  error: string;
}

export type ChatState =
  | ChatInitState
  | ChatConnectingState
  | ChatConnectedState
  | ChatTranscribingState
  | ChatTranscribedState
  | ChatGeneratingState
  | ChatRespondingState
  | ChatRespondedState
  | ChatAudioPlayingState
  | ChatAudioEndedState
  | ChatErrorState;
