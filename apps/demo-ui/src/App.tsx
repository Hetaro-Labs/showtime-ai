import { SocketManagerDialog } from './modules/SocketManager';
import { Chat } from './modules/Chat';
import * as React from 'react';

export default function App() {
  return (
    <div className="h-full">
      <SocketManagerDialog />
      <Chat />
    </div>
  );
}
