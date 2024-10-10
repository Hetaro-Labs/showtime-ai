import React from 'react';
import { ConnectionMangerContext } from './SocketManagerProvider';

export const useSocketManager = () => {
  const context = React.useContext(ConnectionMangerContext);

  if (!context) {
    throw new Error('useSocketManager must be used within a SocketManagerProvider');
  }

  return context;
};
