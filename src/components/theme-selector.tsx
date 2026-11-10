import { Check, Monitor, MoonStar, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { RadioGroup, RadioGroupItem } from '@/components/ui';
import { cn } from '@/lib/utils';

const themes = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: MoonStar },
  { value: 'system', icon: Monitor },
] as const;

function ThemePreview({ scheme }: { scheme: 'light' | 'dark' }) {
  return (
    <div
      className='flex h-20 flex-1 overflow-hidden rounded-md border border-current/10'
      style={{
        colorScheme: scheme,
        backgroundColor: 'Canvas',
        color: 'CanvasText',
      }}
    >
      <div className='flex w-1/4 flex-col gap-1.5 border-r border-current/10 bg-current/5 p-2'>
        <span className='mb-1 size-2 rounded-sm bg-current/30' />
        <span className='h-1 rounded-full bg-current/10' />
        <span className='h-1 rounded-full bg-current/10' />
        <span className='h-1 w-2/3 rounded-full bg-current/10' />
      </div>
      <div className='flex flex-1 flex-col gap-2 p-2'>
        <span className='h-1.5 w-1/2 rounded-full bg-current/30' />
        <span className='flex-1 rounded border border-current/10 bg-current/5' />
        <span className='h-1 w-2/3 rounded-full bg-current/10' />
      </div>
    </div>
  );
}

function ThemeSelector({
  value = 'system',
  onValueChange,
  variant = 'preview',
}: {
  value?: AppTheme;
  variant?: 'preview' | 'compact';
  onValueChange: (theme: AppTheme) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  return (
    <RadioGroup
      aria-label={t('settings.appearance.theme')}
      value={value}
      onValueChange={(next) => onValueChange(next as AppTheme)}
      data-theme-variant={variant}
      className={cn(
        '@container/theme grid-cols-3',
        variant === 'compact'
          ? 'bg-muted/60 gap-1 rounded-xl p-1'
          : 'gap-2 sm:gap-3',
      )}
    >
      {themes.map(({ value: option, icon: Icon }) => (
        <div
          key={option}
          className={cn(
            'group/theme has-focus-visible:ring-ring relative flex min-w-0 transition-colors has-focus-visible:ring-2',
            variant === 'compact'
              ? 'min-h-10 items-center justify-center rounded-lg px-2 has-data-[state=checked]:bg-background has-data-[state=checked]:shadow-xs has-data-[state=checked]:ring-1 has-data-[state=checked]:ring-border'
              : 'border-border flex-col gap-3 rounded-xl border p-2.5 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-accent/40',
          )}
        >
          {variant === 'preview' && (
            <div
              className='pointer-events-none flex gap-0.5'
              aria-hidden='true'
            >
              {option === 'system' ? (
                <>
                  <ThemePreview scheme='light' />
                  <ThemePreview scheme='dark' />
                </>
              ) : (
                <ThemePreview scheme={option} />
              )}
            </div>
          )}
          <div className='pointer-events-none flex items-center justify-between gap-1 text-xs'>
            <span className='flex min-w-0 items-center gap-1.5'>
              <Icon
                className={cn(
                  'size-3.5 shrink-0',
                  variant === 'preview' && 'hidden @min-[22rem]/theme:block',
                )}
              />
              <span className='truncate'>
                {t(`settings.appearance.${option}`)}
              </span>
            </span>
            {variant === 'preview' && value === option && (
              <Check className='size-3.5 shrink-0' />
            )}
          </div>
          <RadioGroupItem
            value={option}
            aria-label={t(`settings.appearance.${option}`)}
            className='absolute inset-0 size-full cursor-pointer rounded-xl opacity-0 after:hidden'
          />
        </div>
      ))}
    </RadioGroup>
  );
}

export { ThemeSelector };
