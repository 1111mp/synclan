import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { FieldDescription, FieldLegend, FieldSet } from '@/components/ui';

function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <FieldSet className='min-w-0'>
      <FieldLegend className='sr-only'>{title}</FieldLegend>
      <div className='grid min-w-0 gap-4 @min-[44rem]:grid-cols-[12rem_minmax(0,1fr)] @min-[44rem]:gap-8'>
        <div className='flex min-w-0 flex-col gap-2'>
          <h2 className='flex items-center gap-2 text-sm font-medium'>
            <Icon className='text-muted-foreground size-4' aria-hidden='true' />
            {title}
          </h2>
          <FieldDescription className='text-xs leading-relaxed'>
            {description}
          </FieldDescription>
        </div>
        <div className='bg-card border-border/60 min-w-0 overflow-hidden rounded-2xl border shadow-xs'>
          {children}
        </div>
      </div>
    </FieldSet>
  );
}

export { SettingsSection };
