import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui';
import { QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

type QRCodeDialogProps = {
  url: string;
};

function QRCodeDialog({ url }: QRCodeDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='secondary' size='icon'>
          <QrCode size={20} strokeWidth={1.5} />
        </Button>
      </DialogTrigger>
      <DialogContent className='top-80 w-2xl max-w-2xl!'>
        <DialogHeader>
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className='pb-6 px-4 flex items-center space-x-10'>
          <div className='p-2 border rounded-sm'>
            <QRCodeCanvas
              size={224}
              value={url}
              // bgColor='#000000'
              // fgColor='#ffffff'
            />
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
            <p className='mt-3 font-light leading-6 text-sm'>
              或者通过 <span className='text-blue-500 underline'>{url}</span>
              &nbsp; 直接访问
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { QRCodeDialog };
