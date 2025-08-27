import { CompositionInput, EmojiButton } from '@/components';

function Transmitter() {
  return (
    <div className='p-2'>
      <header>
        <EmojiButton
          onPickEmoji={(e) => {
            console.log(e);
          }}
        />
      </header>
      <div>
        <CompositionInput />
      </div>
    </div>
  );
}

export { Transmitter };
