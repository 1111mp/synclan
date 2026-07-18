import {
  BadgeCheckIcon,
  ChevronRightIcon,
  FolderOpenIcon,
  Info,
  MoonStar,
  Sun,
  SunMoon,
  User,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useShallow } from 'zustand/react/shallow';

import { useDeviceDiscover } from '@/components';
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
  FieldSeparator,
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
  Label,
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui';
import { resolveResourceUrl } from '@/lib/utils';
import { useConversationList, useIMStore, useSynclanStore } from '@/stores';

function WelcomePage() {
  const [showCard, setShowCard] = useState<boolean>(true);

  const needAnimation = useRef<boolean>(false);

  const navigate = useNavigate();
  const { config, updateTheme } = useSynclanStore(
    useShallow((s) => ({ config: s.config, updateTheme: s.updateTheme })),
  );
  const conversations = useConversationList();
  const { openDiscover } = useDeviceDiscover();

  const hasDevices = conversations.length > 0;

  return (
    <div className='flex flex-1 flex-col overflow-hidden'>
      <header
        data-tauri-drag-region
        className='bg-background flex h-14 w-full items-center justify-end px-4'
      >
        <Button
          variant='outline'
          size='icon-lg'
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
              transition={{ duration: 0.3 }}
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
      <div className='flex flex-1 items-center justify-center'>
        <AnimatePresence mode='popLayout'>
          {showCard ? (
            <motion.div
              key='card'
              className='flex flex-1 items-center justify-center'
              initial={
                needAnimation.current
                  ? {
                      opacity: 0,
                      scale: 0.6,
                    }
                  : false
              }
              animate={{
                opacity: 1,
                scale: 1,
                transition: {
                  type: 'spring',
                  stiffness: 350,
                  damping: 22,
                  mass: 0.8,
                },
              }}
              exit={{
                opacity: 0,
                scale: 0.6,
                transition: {
                  duration: 0.15,
                  ease: 'easeOut',
                },
              }}
              onAnimationComplete={() => {
                needAnimation.current = false;
              }}
            >
              <Card className='w-full max-w-sm max-[400px]:max-w-[94%]'>
                <CardHeader className='text-center'>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>
                    Select an existing device or discover a new one to start
                    messaging.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup className='gap-8'>
                    <Field className='gap-3'>
                      <FieldLabel className='justify-center'>
                        Appearance
                      </FieldLabel>
                      <ToggleGroup
                        type='single'
                        variant='outline'
                        value={config?.theme}
                        className='flex items-center gap-3'
                        onValueChange={async (val) => {
                          if (val) {
                            await updateTheme(val as AppTheme);
                          }
                        }}
                      >
                        <ToggleGroupItem
                          value='system'
                          aria-label='System'
                          className='group/toggle flex-1'
                        >
                          <SunMoon className='group-data-[state=on]/toggle:fill-foreground size-5' />
                          <Label>System</Label>
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value='dark'
                          aria-label='Dark'
                          className='group/toggle flex-1'
                        >
                          <MoonStar className='group-data-[state=on]/toggle:fill-foreground size-5' />
                          <Label>Dark</Label>
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value='light'
                          aria-label='Light'
                          className='group/toggle flex-1'
                        >
                          <Sun className='group-data-[state=on]/toggle:fill-foreground size-5' />
                          <Label>Light</Label>
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </Field>
                    <FieldSeparator className='*:data-[slot=field-separator-content]:bg-card'>
                      Or continue with
                    </FieldSeparator>
                    <Field>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Item
                            variant='outline'
                            size='sm'
                            className='hover:bg-muted transition-colors'
                          >
                            <ItemMedia>
                              <BadgeCheckIcon className='size-5' />
                            </ItemMedia>
                            <ItemContent>
                              <ItemTitle>
                                Select your device to start.
                              </ItemTitle>
                            </ItemContent>
                            <ItemActions>
                              <ChevronRightIcon className='size-4' />
                            </ItemActions>
                          </Item>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuGroup>
                            {hasDevices ? (
                              <>
                                <DropdownMenuLabel>
                                  My Devices
                                </DropdownMenuLabel>
                                {conversations.map((conv) => {
                                  const name = conv?.device?.name ?? '未知设备';
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
                                <div className='space-y-1'>
                                  <p className='text-sm font-medium'>
                                    No devices yet
                                  </p>
                                  <p className='text-muted-foreground text-xs'>
                                    Discover your first device to get started.
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
                        Devices Discover
                      </Button>
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <p>Select a device to start messaging</p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default WelcomePage;
