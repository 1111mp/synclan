import { User } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
import { resolveResourceUrl } from '@/lib/utils';
import { useCurrentConversation } from '@/stores';

function DeviceHeader() {
  const conversation = useCurrentConversation();

  return (
    <header
      data-tauri-drag-region
      className='bg-background/80 sticky top-0 z-20 flex h-14 w-full shrink-0 items-center justify-center gap-2 border-b px-4 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'
    >
      <div className='flex flex-1 items-center gap-3'>
        <Avatar className='rounded-full'>
          <AvatarImage
            className='rounded-full'
            src={resolveResourceUrl(conversation?.device?.avatar)}
          />
          <AvatarFallback className='rounded-full'>
            <User />
          </AvatarFallback>
        </Avatar>
        {conversation?.device?.name}
      </div>
      <div></div>
    </header>
  );
}

export { DeviceHeader };
