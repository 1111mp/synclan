import { useEffect, useRef } from 'react';
import { RouterProvider } from 'react-router';
import { useShallow } from 'zustand/react/shallow';

import { AppProvider } from '@/app-context';
import { ConfirmProvider, LoadingScreen } from '@/components';
import { TooltipProvider } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { getDevice } from '@/lib/device';
import { router } from '@/routes';
import { useDeviceStore, useIMStore } from '@/stores';

function App() {
  const mounted = useRef<boolean>(false);
  const { loading, updateLoading, updateCurrent } = useDeviceStore(
    useShallow((s) => ({
      loading: s.loading,
      updateLoading: s.updateLoading,
      updateCurrent: s.updateCurrent,
    })),
  );
  const hydrateConversations = useIMStore((s) => s.hydrateConversations);
  const updateConvsFromOffline = useIMStore((s) => s.updateConvsFromOffline);

  useTheme();

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const initialization = async () => {
      try {
        const [device] = await Promise.all([
          getDevice(),
          hydrateConversations(),
        ]);
        if (device) {
          await updateConvsFromOffline(device.id);
          updateCurrent(device);
        }
        console.log('device', device);
      } finally {
        setTimeout(() => {
          updateLoading(false);
        }, 300);
      }
    };

    void initialization();
  }, [
    updateLoading,
    updateCurrent,
    hydrateConversations,
    updateConvsFromOffline,
  ]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <TooltipProvider>
      <AppProvider>
        <ConfirmProvider>
          <RouterProvider router={router} />
        </ConfirmProvider>
      </AppProvider>
    </TooltipProvider>
  );
}

export default App;
