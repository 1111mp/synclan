import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { LoadingScreen } from '@/components';
// import { AppProvider } from '@/app-context';
import { router } from '@/routes';
import { useAppStore } from '@/stores';
import { getClient } from '@/lib/utils';

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
    <>
      <RouterProvider router={router} />
      <LoadingScreen loading={loading} />
    </>
  );
}

export default App;
