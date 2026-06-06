import { useEffect } from 'react';

import { LoadingScreen } from '@/components';
// import { AppProvider } from '@/app-context';
import { TooltipProvider } from '@/components/ui';
import { getClient } from '@/lib/utils';
import HomePage from '@/pages/home';
import { useAppStore } from '@/stores';

function App() {
  const { loading, updateLoading, updateClient } = useAppStore();

  useEffect(() => {
    const initialization = async () => {
      try {
        const client = await getClient();
        if (client !== null) {
          updateClient(client);
        }
      } finally {
        setTimeout(() => {
          updateLoading(false);
        }, 800);
      }
    };

    void initialization();
  }, [updateClient, updateLoading]);

  return (
    <TooltipProvider>
      <HomePage />
      <LoadingScreen loading={loading} />
    </TooltipProvider>
  );
}

export default App;
