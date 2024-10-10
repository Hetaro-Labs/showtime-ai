import * as React from 'react';
import { useSocketManager } from '../SocketManager';
import Debug from 'debug';
import * as ort from 'onnxruntime-web';
import { useAudioVisualizer } from './useAudioVisualizer';
import { useMicVAD, utils } from '@ricky0123/vad-react';
import { useToast } from '../Toast';
import { AudioVisualizer } from './AudioVisualizer';
import { useChatState, ChatStateProvider } from './ChatState';

const debug = Debug('demo-ui:Chat');

export interface ChatContentProps {
  inputStream: MediaStream;
}

ort.env.wasm.wasmPaths = {
  // "ort-wasm-simd-threaded.wasm": "/ort-wasm-simd-threaded.wasm",
  // "ort-wasm-simd.wasm": "/ort-wasm-simd.wasm",
  // "ort-wasm-threaded.wasm": "/ort-wasm-threaded.wasm",
  // 'ort-wasm.wasm': '/js/ort-wasm.wasm',
};

const ChatContent: React.FC<ChatContentProps> = ({ inputStream }) => {
  const { addToast } = useToast();
  const [volume, setVolume] = React.useState<number>(0);
  const [stream, setStream] = React.useState<MediaStream>(() => inputStream); // eslint-disable-line
  const [spectrum, setSpectrum] = React.useState<number[]>([]);
  const { getVolume, getSpectrum } = useAudioVisualizer(stream);
  const vad = useMicVAD({
    stream: inputStream!,
    onSpeechEnd: audio => {
      const wavBuffer = utils.encodeWAV(audio);

      debug('sending audioRecordingBuffer to server');

      chatState.transcribe(wavBuffer);

      vad.pause();
    },
  });
  const chatState = useChatState({
    onError(error) {
      addToast({
        title: 'Error',
        description: error,
        intent: 'error',
      });
    },
    onAudioPlay() {
      vad.pause();

      if (chatState.state.responseStream) {
        setStream(chatState.state.responseStream);
      }
    },
    onTurnEnded() {
      vad.start();
      setStream(inputStream);
    },
  });

  React.useEffect(() => {
    let rafId: number;

    const update = () => {
      setSpectrum(getSpectrum());
      setVolume(getVolume());

      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);

    return () => cancelAnimationFrame(rafId);
  }, [getSpectrum, getVolume]);

  // React.useEffect(() => {
  //   // set random spectrum and volume for testing
  //   const interval = setInterval(() => {
  //     setSpectrum(Array.from({ length: 1024 }, () => Math.random()));
  //     setVolume(Math.random());
  //   }, 50);

  //   return () => clearInterval(interval);
  // }, []);

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full gap-4">
      {vad.loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <AudioVisualizer
            spectrum={spectrum}
            isLoading={chatState.state.isGenerating || chatState.state.isTranscribing}
            volume={volume}
            isPlaying={chatState.state.isAudioPlaying}
          />
          <div className="min-h-[25vh] w-full p-4 text-center align-middle flex-col items-center gap-4 hidden md:flex">
            <p
              className={`${chatState.state.responseText ? `opacity-50` : `opacity-100`} transition-all duration-300`}
            >
              {chatState.state.transcribedText}
            </p>
            <p>{chatState.state.responseText}</p>
          </div>
        </>
      )}
    </div>
  );
};

export const Chat: React.FC = () => {
  const { isConnected, socket } = useSocketManager();
  const [inputStream, setInputStream] = React.useState<MediaStream | null>(null);

  React.useEffect(() => {
    if (!isConnected) {
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          autoGainControl: true,
          noiseSuppression: true,
        },
      })
      .then(stream => {
        debug('getUserMedia success', stream);

        setInputStream(stream);
      });
  }, [isConnected]);

  React.useEffect(() => {
    if (socket) {
      socket.on('toolExecuted', (toolName, args, executedReturn: any) => {
        debug('toolExecuted', toolName, args, executedReturn);

        if (toolName === 'swap-token') {
          window.open(
            `showallet://swap?mint=${executedReturn.mintAddress}&amount=${executedReturn.amount}`
          );
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('toolExecuted');
      }
    };
  }, [socket]);

  return (
    <ChatStateProvider>
      {inputStream && isConnected ? <ChatContent inputStream={inputStream} /> : null}
    </ChatStateProvider>
  );
};
