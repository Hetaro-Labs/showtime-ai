import * as React from 'react';
import Debug from 'debug';
import { ChatState } from './ChatState.interface';
import { ChatStateActionTypes, chatStateReducer, defaultState } from './ChatState.reducer';
import { useSocketManager } from '../../SocketManager';
import { ChatSpeechResponse, TranscriptionResult } from '../../../interfaces';
import { useToast } from '../../Toast';
import { useAudioContextManager } from '../../AudioContextManager';

const debug = Debug('demo-ui:ChatState');

export interface ChatStateContextValue {
  state: ChatState;
  eventEmitter: EventTarget;
  isLoading: boolean;
  transcribe: (inputBuffer: ArrayBuffer) => void;
  generate: (transcribedText: string) => void;
}

export const ChatStateContext = React.createContext<ChatStateContextValue>({
  state: defaultState,
  eventEmitter: new EventTarget(),
  isLoading: false,
  transcribe: () => {},
  generate: () => {},
});

export interface ChatStateProviderProps {
  children: React.ReactNode;
  onAudioPlay?: () => void;
  onAudioEnded?: () => void;
  onError?: (error: string) => void;
}

export const ChatStateProvider: React.FC<ChatStateProviderProps> = ({ children }) => {
  const { isConnected, isConnecting, socket } = useSocketManager();
  const [state, dispatch] = React.useReducer(chatStateReducer, defaultState);
  const audioContext = useAudioContextManager();
  const { addToast } = useToast();
  const eventEmitter = React.useRef<EventTarget>(new EventTarget());
  const isLoading = React.useMemo(
    () => state.isTranscribing || state.isGenerating || state.isResponding || isConnecting,
    [isConnecting, state.isGenerating, state.isResponding, state.isTranscribing]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const generate = React.useCallback(
    (transcribedText: string) => {
      dispatch({ type: ChatStateActionTypes.GENERATE, transcribedText: transcribedText });

      if (isLoading || !socket) {
        return;
      }

      socket.emit('chat', transcribedText, (result: ChatSpeechResponse) => {
        debug('chat result', result.responseSpeech);

        if (!result.responseSpeech) {
          dispatch({
            type: ChatStateActionTypes.ERROR,
            error: 'No response from server, please try again',
          });

          return;
        }

        // const audioContext = new AudioContext();
        // const audio = new Audio(URL.createObjectURL(new Blob([result.responseSpeech])));
        // const streamDestination = audioContext.createMediaStreamDestination();
        // const source = audioContext.createMediaElementSource(audio);
        // const stream = streamDestination.stream;

        // source.connect(streamDestination);
        // source.connect(audioContext.destination);

        dispatch({
          type: ChatStateActionTypes.RESPOND,
          responseBuffer: result.responseSpeech,
          responseText: result.responseText,
          responseStream: audioContext.audioStream!,
        });

        // audio.addEventListener('play', () => {
        //   dispatch({ type: ChatStateActionTypes.PLAY_AUDIO });
        // });

        // audio.addEventListener('ended', () => {
        //   dispatch({ type: ChatStateActionTypes.TURN_END });
        // });

        // audio.play().catch(error => {
        //   console.error(error);
        //   debug('error playing audio', error);

        //   dispatch({ type: ChatStateActionTypes.ERROR, error: 'Error playing audio' });

        //   return;
        // });
        dispatch({ type: ChatStateActionTypes.PLAY_AUDIO });

        console.log(result.responseSpeech);

        audioContext
          .play(result.responseSpeech)
          .then(() => {
            dispatch({ type: ChatStateActionTypes.TURN_END });
          })
          .catch(error => {
            console.error(error);
            debug('error playing audio', error);

            dispatch({ type: ChatStateActionTypes.ERROR, error: 'Error playing audio' });

            return;
          });
      });
    },
    [audioContext, isLoading, socket]
  );

  const transcribe = React.useCallback(
    (inputBuffer: ArrayBuffer) => {
      dispatch({ type: ChatStateActionTypes.TRANSCRIBE, inputBuffer });

      if (isLoading || !socket) {
        return;
      }

      socket.emit('asr', inputBuffer, (result: TranscriptionResult) => {
        debug('asr result', result.content);

        if (result.content && result.content.trim().length) {
          return generate(result.content.trim());
        } else if (result.error) {
          addToast({
            title: 'Error',
            description: result.error.message || 'An error occurred',
            intent: 'error',
          });
        }

        dispatch({
          type: ChatStateActionTypes.TURN_END,
        });
      });
    },
    [addToast, generate, isLoading, socket]
  );

  const value = React.useMemo<ChatStateContextValue>(
    () => ({
      state,
      isLoading,
      eventEmitter: eventEmitter.current,
      transcribe,
      generate,
    }),
    [generate, isLoading, state, transcribe]
  );

  React.useEffect(() => {
    if (isConnected && !value.state.isConnected) {
      dispatch({ type: ChatStateActionTypes.CONNECTED });
    }

    if (isConnecting && !value.state.isConnecting) {
      dispatch({ type: ChatStateActionTypes.CONNECTING });
    }
  }, [value, isConnected, isConnecting]);

  return <ChatStateContext.Provider value={value}>{children}</ChatStateContext.Provider>;
};
