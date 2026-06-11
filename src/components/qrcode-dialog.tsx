import { QRCodeCanvas } from 'qrcode.react';
import { useImperativeHandle, useState, type Ref } from 'react';

import { useAppServerStore } from '@/stores';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui';

export type QRCodeDialogRef = {
  open: () => void;
};

type QRCodeDialogProps = {
  ref?: Ref<QRCodeDialogRef>;
};

function QRCodeDialog({ ref }: QRCodeDialogProps) {
  const [open, setOpen] = useState<boolean>(false);

  const domain = useAppServerStore((s) => s.domain);

  useImperativeHandle(ref, () => ({
    open: onOpen,
  }));

  const onOpen = () => {
    setOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='top-80 w-2xl max-w-2xl!'>
        <DialogHeader>
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className='flex items-center space-x-10 px-4 pb-6'>
          <div className='rounded-sm border p-2'>
            <QRCodeCanvas
              size={224}
              value={domain}
              // bgColor='#000000'
              // fgColor='#ffffff'
            />
          </div>
          <div className='flex-1'>
            <h1 className='pb-3 text-xl font-bold'>
              请使用手机相机扫描此二维码
            </h1>
            <p className='text-sm leading-6 font-light'>
              1. 在您的手机上打开相机
            </p>
            <p className='text-sm leading-6 font-light'>2. 扫描此二维码</p>
            <p className='text-sm leading-6 font-light'>
              3. 识别后前往浏览器打开
            </p>
            <p className='mt-3 text-sm leading-6 font-light'>
              或者通过{' '}
              <a
                href={domain}
                target='_blank'
                className='text-blue-500 underline'
              >
                {domain}
              </a>
              &nbsp; 直接访问
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { QRCodeDialog };
