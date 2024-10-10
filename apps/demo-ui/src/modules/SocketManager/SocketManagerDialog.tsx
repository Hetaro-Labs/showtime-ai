import { Button } from '../../components/Button';
import * as Dialog from '@radix-ui/react-dialog';
import { useSocketManager } from './useSocketManager';
import * as React from 'react';
import { twc } from 'react-twc';

export type SocketManagerProps = Dialog.DialogProps;

const DialogOverlay = twc(
  Dialog.Overlay
)`fixed inset-0 bg-black bg-opacity-50 animate-[overlayShow_150ms_cubic-bezier(0.16, 1, 0.3, 1)]`;

const DialogContent = twc(
  Dialog.Content
)`data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-background p-[25px] focus:outline-none shadow-[0px_12px_48px_16px_#553c9a52] border border-violet-950`;

export const SocketManagerDialog: React.FC<SocketManagerProps> = props => {
  const { connect, disconnect, isConnected, isConnecting } = useSocketManager();

  return (
    <Dialog.Root {...props} open={!isConnected || props.open}>
      <Dialog.Portal>
        <DialogOverlay />
        <DialogContent>
          <Dialog.Title className="mb-4 text-2xl font-bold">Connection</Dialog.Title>

          <Dialog.Description className="mb-6 font-mono text-sm">
            Status: {isConnected ? 'Connected' : 'Not connected'}
          </Dialog.Description>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 mb-4">
              {isConnected ? (
                <Button disabled={isConnecting} onClick={disconnect}>
                  Disconnect
                </Button>
              ) : (
                <Button disabled={isConnecting} onClick={connect}>
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
