import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { useShallow } from 'zustand/react/shallow';

import { AppProvider } from '@/app-context';
import { LoadingScreen } from '@/components';
import { TooltipProvider } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { getDevice } from '@/lib/device';
import { router } from '@/routes';
import { useDeviceStore, useIMStore } from '@/stores';

function App() {
  const { loading, updateLoading, updateCurrent } = useDeviceStore(
    useShallow((s) => ({
      loading: s.loading,
      updateLoading: s.updateLoading,
      updateCurrent: s.updateCurrent,
    })),
  );
  const hydrateConversations = useIMStore((s) => s.hydrateConversations);

  useTheme();

  useEffect(() => {
    const initialization = async () => {
      try {
        const [device] = await Promise.all([
          getDevice(),
          hydrateConversations(),
        ]);
        if (device) {
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
  }, [updateLoading, updateCurrent, hydrateConversations]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <TooltipProvider>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </TooltipProvider>
  );
}

export default App;
