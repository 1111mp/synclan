import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { RouterProvider } from 'react-router';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';

import { AppProvider } from '@/app-context';
import { ConfirmProvider, LoadingScreen, UpdateDialog } from '@/components';
import { Toaster, TooltipProvider } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { isWeb } from '@/lib/constant';
import { getDevice } from '@/lib/device';
import { router } from '@/routes';
import { getServerDomain } from '@/services/cmd';
import { useAppServerStore, useDeviceStore, useIMStore } from '@/stores';

function App() {
  const mounted = useRef<boolean>(false);
  const { loading, updateLoading, updateCurrent } = useDeviceStore(
    useShallow((s) => ({
      loading: s.loading,
      updateLoading: s.updateLoading,
      updateCurrent: s.updateCurrent,
    })),
  );
  const updateDomain = useAppServerStore((s) => s.updateDomain);
  const hydrateConversations = useIMStore((s) => s.hydrateConversations);
  const updateConvsFromOffline = useIMStore((s) => s.updateConvsFromOffline);

  useTheme();

  const { t } = useTranslation();

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const initialization = async () => {
      try {
        const [device, domain, _] = await Promise.all([
          getDevice(),
          getServerDomain(),
          hydrateConversations(),
        ]);
        updateDomain(domain);
        if (device) {
          await updateConvsFromOffline(device.id);
          updateCurrent(device);
        }
      } catch (error) {
        console.error('App initialization failed:', error);

        toast.error(t('toast.init_failed'), {
          description:
            error instanceof Error ? error.message : t('toast.unknown_error'),
        });
      } finally {
        setTimeout(() => {
          updateLoading(false);
        }, 300);
      }
    };

    void initialization();
  }, [
    t,
    updateLoading,
    updateCurrent,
    updateDomain,
    hydrateConversations,
    updateConvsFromOffline,
  ]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <TooltipProvider>
        <AppProvider>
          <ConfirmProvider>
            <RouterProvider router={router} />
          </ConfirmProvider>
        </AppProvider>
      </TooltipProvider>
      <Toaster id='global' position='top-center' richColors={true} />
      {!isWeb && <UpdateDialog />}
    </>
  );
}

export default App;
