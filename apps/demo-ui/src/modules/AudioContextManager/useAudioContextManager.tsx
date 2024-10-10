import * as React from 'react';
import { AudioContextManagerContext } from './AudioContextManagerProvider';

export const useAudioContextManager = () => {
  const context = React.useContext(AudioContextManagerContext);

  return context;
};
