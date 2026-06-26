import {
  BadgeCheckIcon,
  ChevronRightIcon,
  FolderOpenIcon,
  Info,
  MoonStar,
  Sun,
  SunMoon,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useShallow } from 'zustand/react/shallow';

import { DeviceDiscover } from '@/components/device-discover';
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
import {
  useConversationList,
  useDeviceStore,
  useIMStore,
  useSynclanStore,
} from '@/stores';

function WelcomePage() {
  const navigate = useNavigate();
  const { config, updateTheme } = useSynclanStore(
    useShallow((s) => ({ config: s.config, updateTheme: s.updateTheme })),
  );
  const current = useDeviceStore((s) => s.current);
  const conversations = useConversationList();

  const currentId = current ? [current.id] : [];
  const localIds = conversations.map((c) => c.id);
  const excludeIds = [...currentId, ...localIds];

  const hasDevices = conversations.length > 0;

  return (
    <div className='flex flex-1 items-center justify-center'>
      <Button
        variant='outline'
        size='icon-lg'
        className='absolute top-4 right-4'
      >
        {/* <X className='size-5' /> */}
        <Info className='size-5' />
      </Button>
      <Card className='w-full max-w-sm'>
        <CardHeader className='text-center'>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Select an existing device or discover a new one to start messaging.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className='gap-8'>
            <Field className='gap-3'>
              <FieldLabel className='justify-center'>Appearance</FieldLabel>
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
                      <ItemTitle>Select your device to start.</ItemTitle>
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
                        <DropdownMenuLabel>My Devices</DropdownMenuLabel>
                        {conversations.map((conv) => {
                          const name = conv?.device?.name ?? '未知设备Ï';
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
                                  src={conv?.device?.avatar}
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
                          <p className='text-sm font-medium'>No devices yet</p>
                          <p className='text-muted-foreground text-xs'>
                            Discover your first device to get started.
                          </p>
                        </div>
                      </div>
                    )}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <DeviceDiscover excludeIds={excludeIds} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}

export default WelcomePage;
