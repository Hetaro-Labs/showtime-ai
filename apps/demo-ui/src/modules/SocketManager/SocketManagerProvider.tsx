import React from 'react';
import { useToast } from '../Toast';
import { io, Socket as ClientSocket } from 'socket.io-client';
import { SocketServerMock } from 'socket.io-mock-ts';
import {
  ChatSpeechResponse,
  ClientToServerEvents,
  ServerToClientEvents,
  TranscriptionResult,
} from '../../interfaces';

// "undefined" means the URL will be computed from the `window.location` object
const API_URL = process.env.REACT_APP_API_URL || 'https://ai-api.dev.showtime-ai.com';

const getAccessToken = async (): Promise<string | null> => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'john',
      password: '123456',
    }),
  });

  if (response.status === 200) {
    const data = await response.json();

    return data.token;
  }

  return null;
};

function convertDataURIToBinary(dataURI: string) {
  const BASE64_MARKER = ';base64,';
  const base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
  const base64 = dataURI.substring(base64Index);
  const raw = window.atob(base64);
  const rawLength = raw.length;
  const array = new Uint8Array(new ArrayBuffer(rawLength));

  for (var i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }
  return array;
}
export interface ConnectionMangerContextProps {
  isConnected: boolean;
  isConnecting: boolean;
  socket: ClientSocket<ServerToClientEvents, ClientToServerEvents> | null;
  connect: () => void;
  disconnect: () => void;
}

export const ConnectionMangerContext = React.createContext<ConnectionMangerContextProps>({
  isConnected: false,
  isConnecting: false,
  socket: null,
  connect: () => {},
  disconnect: () => {},
});

interface SocketManagerProviderProps {
  children: React.ReactNode;
}

const LOCAL_RUN = window.localStorage && window.localStorage.getItem('LOCAL_RUN') !== null;

export const SocketManagerProvider: React.FC<SocketManagerProviderProps> = ({ children }) => {
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const socket = React.useMemo<ClientSocket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(() => {
    let _socket: ClientSocket<ServerToClientEvents, ClientToServerEvents> | null = null;

    if (LOCAL_RUN) {
      const socketMock = new SocketServerMock();

      _socket = socketMock.clientMock as unknown as ClientSocket<
        ServerToClientEvents,
        ClientToServerEvents
      >;
      let demoTTS: ArrayBuffer | null = null;

      fetch('/tts-demo.mp3.base64')
        .then(res => res.text())
        .then(text => {
          demoTTS = convertDataURIToBinary(`data:audio/mp3;base64,${text}`).buffer;
        });

      socketMock.on(
        'asr',
        (_buffer: ArrayBuffer, callback: (result: TranscriptionResult) => void) => {
          callback({
            partial: false,
            content: 'Hello World',
            startTime: 0,
            endTime: 0,
          });
        }
      );

      socketMock.on('chat', (inputText: string, callback: (result: ChatSpeechResponse) => void) => {
        callback({
          inputText,
          responseText: 'Hello World',
          responseSpeech: demoTTS || new ArrayBuffer(0),
        });
      });
    } else if (accessToken) {
      _socket = io(API_URL, {
        autoConnect: false,
        extraHeaders: {
          Authorization: `bearer ${accessToken}`,
        },
      });
    }

    return _socket;
  }, [accessToken]);
  const [isConnected, setIsConnected] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(() => false);
  const { addToast } = useToast();

  React.useEffect(() => {
    if (LOCAL_RUN) {
      setAccessToken('local-run');
    } else {
      getAccessToken()
        .then(setAccessToken)
        .catch(error => {
          console.error(error);

          addToast({
            title: 'Authentication Error',
            description: 'Failed to login',
            intent: 'error',
          });
        });
    }
  }, [addToast]);

  React.useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      setIsConnecting(false);
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setIsConnecting(true);
    };

    const onConnectError = (error: Error) => {
      addToast({
        title: 'Connection Error',
        description: error.message,
        intent: 'error',
      });
    };

    if (socket) {
      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('connect_error', onConnectError);
    }

    return () => {
      if (socket) {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('connect_error', onConnectError);
        socket.disconnect();
        socket.close();
      }
    };
  }, [addToast, socket]);

  const connect = React.useCallback(() => {
    if (isConnected || isConnecting) return;

    if (LOCAL_RUN) {
      setIsConnecting(false);
      setIsConnected(true);

      return;
    }

    if (socket) {
      socket.connect();
    }
    setIsConnecting(true);
  }, [isConnected, isConnecting, socket]);

  const disconnect = React.useCallback(() => {
    if (!isConnected || isConnecting) return;

    if (socket) {
      socket.disconnect();
    }
  }, [isConnected, isConnecting, socket]);

  const value = React.useMemo(
    () => ({
      isConnected,
      isConnecting,
      socket,
      connect,
      disconnect,
    }),
    [isConnected, isConnecting, socket, connect, disconnect]
  );

  return (
    <ConnectionMangerContext.Provider value={value}>{children}</ConnectionMangerContext.Provider>
  );
};
