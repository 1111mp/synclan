import { RouterProvider } from 'react-router';
import { LoadingScreen } from '@/components';
import { AppProvider } from '@/app-context';
import { router } from '@/routes';
import { useAppStore } from '@/stores';

function App() {
  const { loading } = useAppStore();

  return (
    <AppProvider>
      <RouterProvider router={router} />
      <LoadingScreen loading={loading} />
    </AppProvider>
  );
}

export default App;
