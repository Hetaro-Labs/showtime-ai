import * as React from 'react';

export interface AudioContextManagerProviderProps {
  children: React.ReactNode;
}

export interface AudioContextManagerContextValue {
  isUnlocked?: boolean;
  audioStream: MediaStream;
  play: (buffer: ArrayBuffer) => Promise<void>;
}

export const AudioContextManagerContext = React.createContext<AudioContextManagerContextValue>({
  isUnlocked: false,
  audioStream: new MediaStream(),
  play: () => new Promise(() => {}),
});

// This is a dirty hack to make the audio context work on iOS and Android.
export const AudioContextManagerProvider: React.FC<AudioContextManagerProviderProps> = ({
  children,
}) => {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [unlocked, setUnlocked] = React.useState(false);
  const [unlockAudioBuffer, setUnlockAudioBuffer] = React.useState<ArrayBuffer>();
  const sourceBuffer = React.useRef<SourceBuffer | null>(null);
  const [audioStream, setAudioStream] = React.useState<MediaStream>(() => new MediaStream());

  React.useEffect(() => {
    fetch('/notification.mp3')
      .then(response => response.arrayBuffer())
      .then(buffer => {
        setUnlockAudioBuffer(buffer);
      });
  }, []);

  const play = React.useCallback(
    (newBuffer: ArrayBuffer) =>
      new Promise<void>((resolve, reject) => {
        if (!sourceBuffer.current || !audioRef.current) {
          return;
        }

        try {
          audioRef.current.currentTime = sourceBuffer.current.timestampOffset;
          sourceBuffer.current.appendBuffer(newBuffer);

          const audioElement = audioRef.current;

          const sourceBufferUpdateEnd = () => {
            if (!sourceBuffer.current) {
              return;
            }

            const timestampOffset = sourceBuffer.current.timestampOffset;
            let numFramesWithSameTimeStamp = 0;

            const onAudioTimeUpdated = (evt: Event) => {
              if (!evt.target) {
                return;
              }

              const currentTime = (evt.target as any).currentTime;

              console.log('currentTime', currentTime, numFramesWithSameTimeStamp);

              // currentTime >= timestampOffset would never be true coz there always be a difference of ~0.5 sec vary from device to device
              // so this logic block is just a safeguard to prevent waiting forever for just in case
              if (currentTime > timestampOffset) {
                resolve();

                audioElement.removeEventListener('timeupdate', onAudioTimeUpdated);
              }
            };

            audioElement.addEventListener('timeupdate', onAudioTimeUpdated);
            audioElement.addEventListener('waiting', () => {
              resolve();
            });

            sourceBuffer.current!.removeEventListener('updateend', sourceBufferUpdateEnd);
          };

          sourceBuffer.current.addEventListener('updateend', sourceBufferUpdateEnd);
        } catch (error) {
          reject(error);
        }
      }),
    []
  );

  React.useEffect(() => {
    const unlock = () => {
      if (unlocked || !audioRef.current) {
        return;
      }

      const mimeType = 'audio/mpeg';
      const MediaSourceConstructor = (window as any).ManagedMediaSource
        ? (window as any).ManagedMediaSource
        : window.MediaSource;

      if (!MediaSourceConstructor.isTypeSupported(mimeType)) {
        alert('MPEG audio is not supported on this device');

        return;
      }

      const mediaSource: MediaSource = new MediaSourceConstructor();

      audioRef.current.disableRemotePlayback = true;

      mediaSource.addEventListener('sourceopen', () => {
        if (!audioRef.current || !unlockAudioBuffer) {
          return;
        }

        const mySourceBuffer = mediaSource.addSourceBuffer(mimeType);

        mySourceBuffer.mode = 'sequence';
        mySourceBuffer.appendBuffer(unlockAudioBuffer);

        sourceBuffer.current = mySourceBuffer;
      });

      const sUsrAg = navigator.userAgent;
      let stream: MediaStream | null = null;

      if (sUsrAg.indexOf('Firefox') > -1) {
        stream = (audioRef.current as any).mozCaptureStream();
      } else if ('captureStream' in (audioRef.current as any)) {
        stream = (audioRef.current as any).captureStream();
      }

      if (!stream) {
        stream = audioRef.current.srcObject as MediaStream;
      }

      if ('ManagedMediaSource' in window) {
        audioRef.current.disableRemotePlayback = true;
        audioRef.current.srcObject = mediaSource;
      } else {
        URL.revokeObjectURL(audioRef.current.src || '');
        audioRef.current.src = URL.createObjectURL(mediaSource);
        audioRef.current.srcObject = null;
      }

      audioRef.current.play().catch(error => {
        console.error(error);
      });

      setAudioStream(stream);

      setTimeout(function () {
        setUnlocked(true);
      }, 0);
    };

    const events = ['touchstart', 'touchend', 'mousedown', 'keydown'];

    events.forEach(e => document.body.addEventListener(e, unlock, false));

    // TODO: debug function
    (window as any).playDemo = () => {
      if (!sourceBuffer.current) {
        return;
      }
      play(unlockAudioBuffer!).then(() => {
        console.log('play ended');
      });
    };

    return () => {
      events.forEach(e => document.body.removeEventListener(e, unlock));
    };
  }, [play, unlockAudioBuffer, unlocked]);

  return (
    <AudioContextManagerContext.Provider
      value={{
        isUnlocked: unlocked,
        audioStream,
        play,
      }}
    >
      {children}
      <audio preload="none" style={{ visibility: 'hidden' }} ref={audioRef} />
    </AudioContextManagerContext.Provider>
  );
};
