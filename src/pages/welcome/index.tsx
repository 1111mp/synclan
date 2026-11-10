import {
  MonitorSmartphone,
  MessageSquare,
  Radar,
  ChevronRightIcon,
  FolderOpenIcon,
  Info,
  User,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useShallow } from 'zustand/react/shallow';

import { useDeviceDiscover } from '@/components';
import { ThemeSelector } from '@/components/theme-selector';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  Field,
  FieldGroup,
  FieldLabel,
  Separator,
} from '@/components/ui';
import { isWeb } from '@/lib/constant';
import { resolveResourceUrl } from '@/lib/utils';
import { useConversationList, useIMStore, useSynclanStore } from '@/stores';

function WelcomePage() {
  const reduceMotion = useReducedMotion();
  const [showCard, setShowCard] = useState<boolean>(true);

  const needAnimation = useRef<boolean>(false);

  const navigate = useNavigate();

  const { t } = useTranslation();

  const { config, updateTheme } = useSynclanStore(
    useShallow((s) => ({ config: s.config, updateTheme: s.updateTheme })),
  );
  const conversations = useConversationList();
  const { openDiscover } = useDeviceDiscover();

  const hasDevices = conversations.length > 0;

  return (
    <div className='bg-background @container/welcome flex min-h-0 flex-1 flex-col overflow-y-auto'>
      {(isWeb || OS_PLATFORM !== 'win32') && (
        <header
          data-tauri-drag-region
          className='bg-background/95 sticky top-0 z-20 flex h-14 w-full shrink-0 items-center justify-end px-6 backdrop-blur-sm'
        >
          <Button
            variant='ghost'
            size='icon-lg'
            aria-label={t(
              showCard ? 'welcome.hideWelcome' : 'welcome.showWelcome',
            )}
            aria-expanded={showCard}
            className='relative overflow-hidden'
            onClick={() => {
              needAnimation.current = true;
              setShowCard((pre) => !pre);
            }}
          >
            <AnimatePresence initial={false} mode='popLayout'>
              <motion.div
                key={showCard ? 'close' : 'info'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.15 }}
              >
                {showCard ? (
                  <X className='size-5' />
                ) : (
                  <Info className='size-5' />
                )}
              </motion.div>
            </AnimatePresence>
          </Button>
        </header>
      )}
      <div className='flex flex-1 items-center justify-center px-6 py-8 sm:px-8 sm:py-10 @max-[30rem]/welcome:px-4 @max-[30rem]/welcome:py-6'>
        <AnimatePresence mode='popLayout'>
          {showCard ? (
            <motion.div
              key='card'
              className='flex flex-1 items-center justify-center'
              initial={
                needAnimation.current
                  ? {
                      opacity: 0,
                      y: reduceMotion ? 0 : 12,
                    }
                  : false
              }
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
              transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
              onAnimationComplete={() => {
                needAnimation.current = false;
              }}
            >
              <Card className='border-border/60 bg-card w-full max-w-lg gap-6 rounded-2xl shadow-(--surface-shadow) [--card-spacing:1.5rem] @max-[30rem]/welcome:gap-5 @max-[30rem]/welcome:[--card-spacing:1rem]'>
                <CardHeader className='gap-3 @max-[30rem]/welcome:gap-2'>
                  <span className='bg-muted border-border/60 mb-1 flex size-11 items-center justify-center rounded-2xl border @max-[30rem]/welcome:hidden'>
                    <MessageSquare className='size-5' aria-hidden='true' />
                  </span>
                  <CardTitle className='text-xl font-semibold tracking-tight'>
                    {t('welcome.welcomeBack')}
                  </CardTitle>
                  <CardDescription className='leading-relaxed'>
                    {t('welcome.selectExistingOrDiscover')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup className='gap-6 @max-[30rem]/welcome:gap-5'>
                    <Field>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type='button'
                            variant='outline'
                            size='xl'
                            className='w-full justify-between'
                          >
                            <span className='flex min-w-0 items-center gap-2'>
                              <MonitorSmartphone className='size-4 shrink-0' />
                              <span className='truncate'>
                                {t('welcome.selectDeviceToStart')}
                              </span>
                            </span>
                            <ChevronRightIcon data-icon='inline-end' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuGroup>
                            {hasDevices ? (
                              <>
                                <DropdownMenuLabel>
                                  {t('welcome.myDevices')}
                                </DropdownMenuLabel>
                                {conversations.map((conv) => {
                                  const name =
                                    conv?.device?.name ??
                                    t('welcome.unknownDevice');
                                  return (
                                    <DropdownMenuItem
                                      key={conv.id}
                                      className='py-1.5'
                                      title={name}
                                      onClick={() => {
                                        useIMStore
                                          .getState()
                                          .setActiveConversation(conv.id);
                                        void navigate(`/devices/${conv.id}`);
                                      }}
                                    >
                                      <Avatar>
                                        <AvatarImage
                                          src={resolveResourceUrl(
                                            conv?.device?.avatar,
                                          )}
                                          className='rounded-full'
                                        />
                                        <AvatarFallback>
                                          <User />
                                        </AvatarFallback>
                                      </Avatar>
                                      {name}
                                      <DropdownMenuShortcut>
                                        <ChevronRightIcon className='size-4' />
                                      </DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                  );
                                })}
                              </>
                            ) : (
                              <div className='flex flex-col items-center justify-center gap-2 p-6 text-center'>
                                <FolderOpenIcon className='text-muted-foreground/50 size-6' />
                                <div className='flex flex-col gap-1'>
                                  <p className='text-sm font-medium'>
                                    {t('welcome.noDevicesYet')}
                                  </p>
                                  <p className='text-muted-foreground text-xs'>
                                    {t('welcome.discoverFirstDevice')}
                                  </p>
                                </div>
                              </div>
                            )}
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        className='w-full'
                        size='xl'
                        onClick={() => {
                          openDiscover();
                        }}
                      >
                        <Radar data-icon='inline-start' />
                        {t('welcome.discoverDevices')}
                      </Button>
                    </Field>
                    <Separator />
                    <Field className='gap-3'>
                      <FieldLabel id='welcome-appearance-label'>
                        {t('settings.appearance.title')}
                      </FieldLabel>
                      <ThemeSelector
                        variant='compact'
                        value={config?.theme}
                        onValueChange={updateTheme}
                      />
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <p className='text-muted-foreground text-center text-sm'>
              {t('welcome.selectDeviceToStartMessaging')}
            </p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default WelcomePage;
