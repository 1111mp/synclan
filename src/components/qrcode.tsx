import { QRCodeCanvas } from 'qrcode.react';

function QRCode({
  className,
  size = 224,
  ...props
}: React.ComponentProps<typeof QRCodeCanvas>) {
  return (
    <QRCodeCanvas
      className={className}
      size={size}
      // bgColor='#000000'
      // fgColor='#ffffff'
      {...props}
    ></QRCodeCanvas>
  );
}

export { QRCode };
