import * as React from 'react';
import { ChatStateContext } from './ChatState.provider';

export interface UseChatStateProps {
  onAudioPlay?: () => void;
  onTurnEnded?: () => void;
  onError?: (error: string) => void;
}

export const useChatState = (props?: UseChatStateProps) => {
  const { onAudioPlay, onTurnEnded, onError } = props || {};
  const context = React.useContext(ChatStateContext);

  if (!context) {
    throw new Error('useChatState must be used within a ChatStateProvider');
  }

  React.useEffect(() => {
    if (context.state.isError) {
      onError?.(context.state.error);
    }

    if (context.state.isAudioPlaying) {
      onAudioPlay?.();
    }

    if (context.state.isAudioEnded) {
      onTurnEnded?.();
    }
  }, [context.state, onTurnEnded, onAudioPlay, onError]);

  return context;
};
