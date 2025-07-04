import { RouterProvider } from 'react-router';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  LoadingScreen,
  QRCode,
} from '@/components';
import { AppProvider } from '@/app-context';
import { router } from '@/routes';
import { useAppStore } from '@/stores';

function App() {
  const { loading } = useAppStore();

  return (
    <AppProvider>
      <RouterProvider router={router} />
      <LoadingScreen loading={loading} />
      <Dialog open={true}>
        <DialogTrigger asChild>
          <Button variant='outline'>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent className='top-70 w-2xl max-w-2xl!'>
          <DialogHeader>
            <DialogTitle></DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className='pb-6 px-4 flex items-center space-x-10'>
            <div className='p-2 border rounded-sm'>
              <QRCode value='http://10.97.86.23:53317' />
            </div>
            <div className='flex-1'>
              <h1 className='pb-3 font-bold text-xl'>
                请使用手机相机扫描此二维码
              </h1>
              <p className='font-light leading-6 text-sm'>
                1. 在您的手机上打开相机
              </p>
              <p className='font-light leading-6 text-sm'>2. 扫描此二维码</p>
              <p className='font-light leading-6 text-sm'>
                3. 识别后前往浏览器打开
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppProvider>
  );
}

export default App;
