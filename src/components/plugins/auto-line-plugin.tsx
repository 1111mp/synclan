import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

function AutoLinePlugin() {
  const [editor] = useLexicalComposerContext();

  const initialHeight = useRef<number>(0);

  useEffect(() => {
    const editable = editor.getRootElement();
    if (!editable) return;

    initialHeight.current = editable.getBoundingClientRect().height;

    return editor.registerUpdateListener(() => {
      const editable = editor.getRootElement();
      if (!editable) return;

      // 获取容器当前高度
      const { height } = editable.getBoundingClientRect();
      console.log('height', height);
      console.log('prevHeightRef.current', initialHeight.current);
      // 如果高度增加，说明出现换行（Enter 或自动换行）
      if (height > initialHeight.current) {
        console.log('换行了');
      } else if (height <= initialHeight.current) {
        console.log('回来了');
      }
    });
  }, [editor]);

  return null;
}

export { AutoLinePlugin };
