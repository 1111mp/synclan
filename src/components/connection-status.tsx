import { useAppContext } from '@/app-context';
import { ReadyState } from '@/hooks';
import { cn } from '@/lib/utils';

function ConnectionStatus() {
  const { socketState } = useAppContext();

  if (socketState === ReadyState.CONNECTED) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 text-sm rounded-md',
        socketState === ReadyState.DISCONNECT &&
          'text-destructive bg-destructive/10',
        socketState === ReadyState.CONNECTING &&
          'text-yellow-600 bg-yellow-500/10',
      )}
    >
      <span className='size-2 rounded-full bg-current' />

      {socketState === ReadyState.DISCONNECT && 'Connection lost'}
      {socketState === ReadyState.CONNECTING && 'Reconnecting...'}
    </div>
  );
}

export { ConnectionStatus };
