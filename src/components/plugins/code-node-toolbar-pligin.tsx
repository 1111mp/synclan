import { useEffect, useLayoutEffect, useState, type JSX } from 'react';
import { createPortal } from 'react-dom';
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui';
import { BookCopy, CheckIcon, ChevronDown } from 'lucide-react';
import {
  autoUpdate,
  FloatingPortal,
  offset,
  size,
  useFloating,
} from '@floating-ui/react';
import { toast } from 'sonner';
import { $isCodePlusNode, CodePlusNode } from '../nodes';
import { $getNodeByKey, $getSelection, $setSelection } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { cn } from '@/lib/utils';

function CodeNodeToolbarPlugin(): JSX.Element | null {
  const [keys, setKeys] = useState<string[]>([]);
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerMutationListener(
      CodePlusNode,
      (mutations) => {
        editor.getEditorState().read(() => {
          for (const [nodeKey, mutation] of mutations) {
            if (mutation === 'created' && !keys.includes(nodeKey)) {
              setKeys((pre) => [...pre, nodeKey]);
            }

            if (mutation === 'destroyed' && keys.includes(nodeKey)) {
              setKeys((pre) => pre.filter((k) => k !== nodeKey));
            }
          }
        });
      },
      { skipInitialization: false },
    );
  }, [editor, keys]);

  return (
    <>
      {keys.map((key) =>
        createPortal(<CodeToolbar key={key} nodeKey={key} />, document.body),
      )}
    </>
  );
}

export { CodeNodeToolbarPlugin };

const CODE_LANGUAGE_OPTIONS: [string, string][] = [
  ['text', 'Plain Text'],
  ['abap', 'ABAP'],
  ['ada', 'Ada'],
  ['apache', 'Apache'],
  ['apex', 'Apex'],
  ['asm', 'Assembly'],
  ['bash', 'Bash'],
  ['csharp', 'C#'],
  ['cpp', 'C++'],
  ['c', 'C'],
  ['cmake', 'CMake'],
  ['cobol', 'COBOL'],
  ['css', 'CSS'],
  ['coffee', 'CoffeeScript'],
  ['d', 'D'],
  ['dart', 'Dart'],
  ['pascal', 'Delphi'],
  ['diff', 'Diff'],
  ['jinja', 'Django'],
  ['docker', 'Dockerfile'],
  ['erlang', 'Erlang'],
  ['fortran-fixed-form', 'Fortran (Fixed Form)'],
  ['fortran-free-form', 'Fortran (Free Form)'],
  ['gherkin', 'Gherkin'],
  ['go', 'Go'],
  ['graphql', 'GraphQL'],
  ['groovy', 'Groovy'],
  ['html', 'HTML'],
  ['handlebars', 'HTMLBars'],
  ['http', 'HTTP'],
  ['haskell', 'Haskell'],
  ['json', 'JSON'],
  ['java', 'Java'],
  ['javascript', 'JavaScript'],
  ['jsx', 'JSX'],
  ['julia', 'Julia'],
  ['kotlin', 'Kotlin'],
  ['latex', 'LaTeX'],
  ['common-lisp', 'Lisp'],
  ['log', 'Log'],
  ['lua', 'Lua'],
  ['matlab', 'MATLAB'],
  ['make', 'Makefile'],
  ['markdown', 'Markdown'],
  ['nginx', 'Nginx'],
  ['objective-c', 'Objective-C'],
  ['glsl', 'OpenGL Shading Language'],
  ['php', 'PHP'],
  ['perl', 'Perl'],
  ['postcss', 'PostCSS'],
  ['powershell', 'PowerShell'],
  ['prolog', 'Prolog'],
  ['ini', 'Properties'],
  ['proto', 'Protocol Buffer'],
  ['python', 'Python'],
  ['r', 'R'],
  ['ruby', 'Ruby'],
  ['rust', 'Rust'],
  ['sas', 'SAS'],
  ['sass', 'Sass'],
  ['scss', 'SCSS'],
  ['sql', 'SQL'],
  ['scala', 'Scala'],
  ['scheme', 'Scheme'],
  ['shellscript', 'Shell'],
  ['solidity', 'Solidity'],
  ['swift', 'Swift'],
  ['toml', 'TOML'],
  ['proto', 'Thrift'],
  ['tsx', 'TSX'],
  ['typescript', 'TypeScript'],
  ['vb', 'VBScript'],
  ['vb', 'Visual Basic'],
  ['vue', 'Vue'],
  ['xml', 'XML'],
  ['yaml', 'YAML'],
];

function CodeToolbar({ nodeKey }: { nodeKey: string }) {
  const [open, setOpen] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>();
  const [editor] = useLexicalComposerContext();

  const { refs, floatingStyles, update } = useFloating({
    placement: 'top-start',
    middleware: [
      offset(-28),
      size({
        apply({ elements, rects }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
          });
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    return editor.registerTextContentListener(() => {
      update();
    });
  }, [editor, update]);

  useEffect(() => {
    const node = editor.getElementByKey(nodeKey);
    if (node) {
      refs.setReference(node);
    }

    return () => {
      refs.setReference(null);
    };
  }, [editor, refs, nodeKey]);

  useLayoutEffect(() => {
    editor.getEditorState().read(() => {
      const node = $getNodeByKey<CodePlusNode>(nodeKey);
      if (node) {
        setLanguage(node.getLanguage() ?? 'text');
      }
    });
  }, [editor, nodeKey]);

  const onSelectLanguage = (value: string) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isCodePlusNode(node)) {
        node.setLanguage(value);
      }
    });
    setLanguage(value);
    setOpen(false);
  };

  const onCopyCode = async () => {
    let content = '';
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isCodePlusNode(node)) {
        content = node.getTextContent();
      }

      const selection = $getSelection();
      $setSelection(selection);
    });

    try {
      await navigator.clipboard.writeText(content);
      toast.success('复制成功');
    } catch (err) {
      toast.error('复制失败');
    }
  };

  return (
    <FloatingPortal
      root={document.getElementById('synclan-composition-scroll-wrapper')}
    >
      <div
        data-node-key={nodeKey}
        ref={refs.setFloating}
        className='px-2'
        style={floatingStyles}
      >
        <div className='flex justify-between items-center'>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                className='flex items-center font-light text-muted-foreground hover:text-muted-foreground'
                variant='ghost'
                role='combobox'
                size='xxs'
              >
                {
                  (CODE_LANGUAGE_OPTIONS.find((opt) => opt[0] === language) || [
                    '',
                    '',
                  ])[1]
                }
                <ChevronDown />
              </Button>
            </PopoverTrigger>
            <PopoverContent align='start' side='top' className='max-w-48 p-0'>
              <Command>
                <CommandInput placeholder='Search Language...'></CommandInput>
                <CommandList>
                  <CommandEmpty>No language found.</CommandEmpty>
                  <CommandGroup>
                    {CODE_LANGUAGE_OPTIONS.map(([value, name]) => (
                      <CommandItem
                        key={name}
                        value={value}
                        onSelect={onSelectLanguage}
                      >
                        {name}
                        <CheckIcon
                          className={cn(
                            'ml-auto',
                            value === language ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <div>
            <Button
              className='flex items-center font-light text-muted-foreground hover:text-muted-foreground hover:bg-gray-75'
              variant='ghost'
              size='xxs'
              onClick={onCopyCode}
            >
              <BookCopy />
              复制
            </Button>
          </div>
        </div>
      </div>
    </FloatingPortal>
  );
}
