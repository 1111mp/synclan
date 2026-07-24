import { QRCodeCanvas } from 'qrcode.react';
import { useImperativeHandle, useState, type Ref } from 'react';
import { useTranslation } from 'react-i18next';

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

  const { t } = useTranslation();

  const domain = useAppServerStore((s) => s.domain);

  useImperativeHandle(ref, () => ({
    open: onOpen,
  }));

  const onOpen = () => {
    setOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='w-2xl max-w-2xl! max-[700px]:max-w-[90%]!'>
        <DialogHeader>
          <DialogTitle>{t('qrCodeDialog.title')}</DialogTitle>
          <DialogDescription>{t('qrCodeDialog.description')}</DialogDescription>
        </DialogHeader>
        <div className='flex items-center gap-8 px-4 pb-6 max-[576px]:flex-col'>
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
              {t('qrCodeDialog.scanWithPhone')}
            </h1>
            <p className='text-sm leading-6 font-light'>
              {t('qrCodeDialog.step1')}
            </p>
            <p className='text-sm leading-6 font-light'>
              {t('qrCodeDialog.step2')}
            </p>
            <p className='text-sm leading-6 font-light'>
              {t('qrCodeDialog.step3')}
            </p>
            <p className='mt-3 text-sm leading-6 font-light break-all'>
              {t('qrCodeDialog.orVisitDirectly')}&nbsp;
              <a
                href={domain}
                target='_blank'
                className='text-blue-500 underline'
              >
                {domain}
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { QRCodeDialog };
