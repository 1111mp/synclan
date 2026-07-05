import {
  autoUpdate,
  FloatingPortal,
  offset,
  size,
  useFloating,
} from '@floating-ui/react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, $getSelection, $setSelection } from 'lexical';
import { BookCopy, CheckIcon, ChevronDown } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useState, type JSX } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';

import { $isCodePlusNode, CodePlusNode } from '../nodes';
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

function CodeNodeToolbarPlugin(): JSX.Element | null {
  const [nodeKeys, setNodeKeys] = useState<string[]>([]);

  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerMutationListener(
      CodePlusNode,
      (mutations) => {
        editor.getEditorState().read(() => {
          for (const [nodeKey, mutation] of mutations) {
            if (mutation === 'created') {
              setNodeKeys((pre) =>
                pre.includes(nodeKey) ? pre : [...pre, nodeKey],
              );
            }

            if (mutation === 'destroyed') {
              setNodeKeys((pre) => pre.filter((k) => k !== nodeKey));
            }
          }
        });
      },
      { skipInitialization: false },
    );
  }, [editor]);

  return (
    <>
      {nodeKeys.map((nodeKey) =>
        createPortal(
          <CodeToolbar key={nodeKey} nodeKey={nodeKey} />,
          document.body,
        ),
      )}
    </>
  );
}

export { $matchLanguage, CodeNodeToolbarPlugin };

function $matchLanguage(input?: string): string {
  if (!input) return 'text';

  input = input.toLowerCase();
  return (
    CODE_LANGUAGES.find(
      (opt) =>
        opt.name.toLowerCase() === input ||
        opt.value.toLowerCase() === input ||
        opt.shortcuts.some((s) => s.toLowerCase() === input),
    )?.value ?? 'text'
  );
}

type CodeLanguageOption = {
  name: string;
  value: string;
  shortcuts: string[];
};
const CODE_LANGUAGES: CodeLanguageOption[] = [
  { name: 'Plain Text', value: 'text', shortcuts: ['text', 'txt', 'plain'] },
  { name: 'ABAP', value: 'abap', shortcuts: ['abap'] },
  { name: 'Ada', value: 'ada', shortcuts: ['ada', 'adb', 'ads'] },
  { name: 'Apache', value: 'apache', shortcuts: ['apacheconf', 'apache'] },
  { name: 'Apex', value: 'apex', shortcuts: ['apex', 'cls'] },
  {
    name: 'Assembly',
    value: 'asm',
    shortcuts: ['asm', 'assembly', 'nasm', 's'],
  },
  { name: 'Bash', value: 'bash', shortcuts: ['bash', 'sh', 'zsh', 'shell'] },
  { name: 'C#', value: 'csharp', shortcuts: ['csharp', 'c#', 'cs'] },
  {
    name: 'C++',
    value: 'cpp',
    shortcuts: ['cpp', 'c++', 'cc', 'cxx', 'hpp', 'h++'],
  },
  { name: 'C', value: 'c', shortcuts: ['c', 'h'] },
  { name: 'CMake', value: 'cmake', shortcuts: ['cmake', 'cmake.in'] },
  { name: 'COBOL', value: 'cobol', shortcuts: ['cobol', 'cob', 'cpy'] },
  { name: 'CSS', value: 'css', shortcuts: ['css'] },
  {
    name: 'CoffeeScript',
    value: 'coffee',
    shortcuts: ['coffee', 'coffeescript', 'cson', 'iced'],
  },
  { name: 'D', value: 'd', shortcuts: ['d', 'di'] },
  { name: 'Dart', value: 'dart', shortcuts: ['dart'] },
  {
    name: 'Delphi',
    value: 'pascal',
    shortcuts: ['delphi', 'pas', 'pascal', 'objectpascal'],
  },
  { name: 'Diff', value: 'diff', shortcuts: ['diff', 'patch', 'udiff'] },
  {
    name: 'Django',
    value: 'jinja',
    shortcuts: ['django', 'jinja', 'jinja2', 'html+django'],
  },
  { name: 'Dockerfile', value: 'docker', shortcuts: ['docker', 'dockerfile'] },
  { name: 'Erlang', value: 'erlang', shortcuts: ['erlang', 'erl', 'hrl'] },
  {
    name: 'Fortran (Fixed Form)',
    value: 'fortran-fixed-form',
    shortcuts: ['fortran', 'f77', 'f'],
  },
  {
    name: 'Fortran (Free Form)',
    value: 'fortran-free-form',
    shortcuts: ['f90', 'f95', 'f03', 'f08'],
  },
  { name: 'Gherkin', value: 'gherkin', shortcuts: ['gherkin', 'feature'] },
  { name: 'Go', value: 'go', shortcuts: ['go', 'golang'] },
  { name: 'GraphQL', value: 'graphql', shortcuts: ['graphql', 'gql'] },
  {
    name: 'Groovy',
    value: 'groovy',
    shortcuts: ['groovy', 'gvy', 'gy', 'gsh'],
  },
  { name: 'HTML', value: 'html', shortcuts: ['html', 'htm', 'xhtml'] },
  {
    name: 'HTMLBars',
    value: 'handlebars',
    shortcuts: ['handlebars', 'hbs', 'htmlbars'],
  },
  { name: 'HTTP', value: 'http', shortcuts: ['http'] },
  { name: 'Haskell', value: 'haskell', shortcuts: ['haskell', 'hs'] },
  { name: 'JSON', value: 'json', shortcuts: ['json'] },
  { name: 'Java', value: 'java', shortcuts: ['java', 'jsp'] },
  {
    name: 'JavaScript',
    value: 'javascript',
    shortcuts: ['javascript', 'js', 'node'],
  },
  { name: 'JSX', value: 'jsx', shortcuts: ['jsx', 'react'] },
  { name: 'Julia', value: 'julia', shortcuts: ['julia', 'jl'] },
  { name: 'Kotlin', value: 'kotlin', shortcuts: ['kotlin', 'kt', 'kts'] },
  { name: 'LaTeX', value: 'latex', shortcuts: ['latex', 'tex', 'context'] },
  {
    name: 'Lisp',
    value: 'common-lisp',
    shortcuts: ['lisp', 'cl', 'elisp', 'emacs-lisp'],
  },
  { name: 'Log', value: 'log', shortcuts: ['log'] },
  { name: 'Lua', value: 'lua', shortcuts: ['lua'] },
  { name: 'MATLAB', value: 'matlab', shortcuts: ['matlab', 'm'] },
  {
    name: 'Makefile',
    value: 'make',
    shortcuts: ['makefile', 'make', 'mak', 'mk'],
  },
  { name: 'Markdown', value: 'markdown', shortcuts: ['markdown', 'md', 'mkd'] },
  { name: 'Nginx', value: 'nginx', shortcuts: ['nginx', 'nginxconf'] },
  {
    name: 'Objective-C',
    value: 'objective-c',
    shortcuts: ['objective-c', 'objc', 'obj-c', 'm', 'mm'],
  },
  {
    name: 'OpenGL Shading Language',
    value: 'glsl',
    shortcuts: ['glsl', 'vert', 'frag', 'geom'],
  },
  {
    name: 'PHP',
    value: 'php',
    shortcuts: ['php', 'php3', 'php4', 'php5', 'phtml'],
  },
  { name: 'Perl', value: 'perl', shortcuts: ['perl', 'pl', 'pm', 't'] },
  { name: 'PostCSS', value: 'postcss', shortcuts: ['postcss'] },
  {
    name: 'PowerShell',
    value: 'powershell',
    shortcuts: ['powershell', 'ps', 'ps1'],
  },
  { name: 'Prolog', value: 'prolog', shortcuts: ['prolog', 'pl', 'pro'] },
  {
    name: 'Properties',
    value: 'ini',
    shortcuts: ['ini', 'properties', 'toml'],
  },
  { name: 'Protocol Buffer', value: 'proto', shortcuts: ['proto', 'protobuf'] },
  {
    name: 'Python',
    value: 'python',
    shortcuts: ['python', 'py', 'gyp', 'ipython'],
  },
  { name: 'R', value: 'r', shortcuts: ['r', 'rscript', 's'] },
  { name: 'Ruby', value: 'ruby', shortcuts: ['ruby', 'rb', 'gemspec', 'rake'] },
  { name: 'Rust', value: 'rust', shortcuts: ['rust', 'rs'] },
  { name: 'SAS', value: 'sas', shortcuts: ['sas'] },
  { name: 'Sass', value: 'sass', shortcuts: ['sass'] },
  { name: 'SCSS', value: 'scss', shortcuts: ['scss'] },
  {
    name: 'SQL',
    value: 'sql',
    shortcuts: ['sql', 'mysql', 'postgresql', 'plsql'],
  },
  { name: 'Scala', value: 'scala', shortcuts: ['scala', 'sc'] },
  { name: 'Scheme', value: 'scheme', shortcuts: ['scheme', 'scm', 'ss'] },
  { name: 'Shell', value: 'shellscript', shortcuts: ['shell', 'sh', 'zsh'] },
  { name: 'Solidity', value: 'solidity', shortcuts: ['solidity', 'sol'] },
  { name: 'Swift', value: 'swift', shortcuts: ['swift'] },
  { name: 'TOML', value: 'toml', shortcuts: ['toml', 'ini'] },
  { name: 'Thrift', value: 'thrift', shortcuts: ['thrift'] },
  { name: 'TSX', value: 'tsx', shortcuts: ['tsx', 'typescript-react'] },
  { name: 'TypeScript', value: 'typescript', shortcuts: ['typescript', 'ts'] },
  { name: 'VBScript', value: 'vb', shortcuts: ['vbscript', 'vbs'] },
  {
    name: 'Visual Basic',
    value: 'vb',
    shortcuts: ['vb', 'visualbasic', 'vba'],
  },
  { name: 'Vue', value: 'vue', shortcuts: ['vue'] },
  { name: 'XML', value: 'xml', shortcuts: ['xml', 'rss', 'xsd', 'wsdl'] },
  { name: 'YAML', value: 'yaml', shortcuts: ['yaml', 'yml'] },
];

const CODE_THEMES = [
  { name: 'Ayu Dark', value: 'ayu-dark' },
  { name: 'Ayu Light', value: 'ayu-light' },
  { name: 'Dark Plus', value: 'dark-plus' },
  { name: 'Light Plus', value: 'light-plus' },
  { name: 'GitHub Dark', value: 'github-dark' },
  { name: 'GitHub Light', value: 'github-light' },
  { name: 'Houston', value: 'houston' },
  { name: 'Material Theme Darker', value: 'material-theme-darker' },
  { name: 'Material Theme Lighter', value: 'material-theme-lighter' },
  { name: 'Monokai', value: 'monokai' },
  { name: 'One Dark Pro', value: 'one-dark-pro' },
  { name: 'One Light', value: 'one-light' },
];

function CodeToolbar({ nodeKey }: { nodeKey: string }) {
  const [language, setLanguage] = useState<string>();
  const [theme, setTheme] = useState<string>();

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
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const el = editor.getElementByKey(nodeKey);
        if (el) {
          refs.setReference(el);
          update();
        }
      });
    });
  }, [editor, refs, nodeKey, update]);

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
      const node = $getNodeByKey(nodeKey);
      if ($isCodePlusNode(node)) {
        setLanguage(node.getLanguage() ?? 'text');
      }
    });
  }, [editor, nodeKey]);

  const currentLanguage = useMemo(() => {
    if (!language) return 'Plain Text';

    return (
      CODE_LANGUAGES.find((opt) => opt.value === language)?.name ?? 'Plain Text'
    );
  }, [language]);

  const currentTheme = useMemo(() => {
    if (!theme) return 'One Dark Pro';

    return (
      CODE_THEMES.find((opt) => opt.value === theme)?.name ?? 'One Dark Pro'
    );
  }, [theme]);

  const onSelectLanguage = (value: string) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isCodePlusNode(node)) {
        node.setLanguage(value);
      }
    });
    setLanguage(value);
  };

  const onSelectTheme = (value: string) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isCodePlusNode(node)) {
        node.setTheme(value);
      }
    });
    setTheme(value);
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
    } catch {
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
        className='px-2 select-none'
        style={floatingStyles}
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-1'>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  className='text-muted-foreground hover:text-muted-foreground flex items-center font-light'
                  variant='ghost'
                  role='combobox'
                  size='xs'
                >
                  {currentLanguage}
                  <ChevronDown />
                </Button>
              </PopoverTrigger>
              <PopoverContent align='start' side='top' className='max-w-48 p-0'>
                <Command>
                  <CommandInput placeholder='Search Language...'></CommandInput>
                  <CommandList>
                    <CommandEmpty>No language found.</CommandEmpty>
                    <CommandGroup>
                      {CODE_LANGUAGES.map(({ name, value }) => (
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  className='text-muted-foreground hover:text-muted-foreground flex items-center font-light'
                  variant='ghost'
                  role='combobox'
                  size='xs'
                >
                  {currentTheme}
                  <ChevronDown />
                </Button>
              </PopoverTrigger>
              <PopoverContent align='start' side='top' className='max-w-48 p-0'>
                <Command>
                  <CommandInput placeholder='Search Theme...'></CommandInput>
                  <CommandList>
                    <CommandEmpty>No theme found.</CommandEmpty>
                    <CommandGroup>
                      {CODE_THEMES.map(({ name, value }) => (
                        <CommandItem
                          key={name}
                          value={value}
                          onSelect={onSelectTheme}
                        >
                          {name}
                          <CheckIcon
                            className={cn(
                              'ml-auto',
                              value === theme ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Button
              className='text-muted-foreground hover:text-muted-foreground hover:bg-gray-75 flex items-center font-light'
              variant='ghost'
              size='xs'
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
