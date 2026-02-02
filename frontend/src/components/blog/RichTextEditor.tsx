import React, { useCallback } from 'react';
import { $getRoot, $getSelection } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $patchStyleText,
  $setBlocksType
} from '@lexical/selection';
import { 
  $createHeadingNode,
  $createQuoteNode,
  HeadingNode,
  QuoteNode
} from '@lexical/rich-text';
import { 
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode
} from '@lexical/list';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';

const theme = {
  ltr: 'ltr',
  rtl: 'rtl',
  placeholder: 'editor-placeholder',
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
    h6: 'editor-heading-h6',
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem',
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listitem',
  },
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
    code: 'editor-text-code',
  },
};

function onError(error: Error) {
  console.error(error);
}

// Simple error boundary component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

interface ToolbarProps {
  disabled?: boolean;
}

function ToolbarPlugin({ disabled }: ToolbarProps) {
  const [editor] = useLexicalComposerContext();

  const formatText = useCallback(
    (format: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if (selection) {
          $patchStyleText(selection, {
            [format]: format === 'bold' ? 'bold' : format === 'italic' ? 'italic' : 'underline'
          });
        }
      });
    },
    [editor]
  );

  const formatHeading = useCallback(
    (headingSize: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if (selection) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize as any));
        }
      });
    },
    [editor]
  );

  const formatQuote = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if (selection) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  }, [editor]);

  const formatList = useCallback(
    (listType: 'bullet' | 'number') => {
      if (listType === 'bullet') {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      } else {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      }
    },
    [editor]
  );

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
      {/* Text formatting */}
      <div className="flex items-center gap-1 mr-4">
        <button
          type="button"
          onClick={() => formatText('bold')}
          disabled={disabled}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => formatText('italic')}
          disabled={disabled}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => formatText('underline')}
          disabled={disabled}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Underline"
        >
          <u>U</u>
        </button>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-1 mr-4">
        <select
          onChange={(e) => formatHeading(e.target.value)}
          disabled={disabled}
          className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          defaultValue=""
        >
          <option value="">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-1 mr-4">
        <button
          type="button"
          onClick={() => formatList('bullet')}
          disabled={disabled}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => formatList('number')}
          disabled={disabled}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Numbered List"
        >
          1.
        </button>
      </div>

      {/* Quote */}
      <button
        type="button"
        onClick={formatQuote}
        disabled={disabled}
        className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Quote"
      >
        "
      </button>
    </div>
  );
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing...',
  disabled = false,
  className = ''
}) => {
  const initialConfig = {
    namespace: 'BlogEditor',
    theme,
    onError,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
    editorState: value || undefined,
  };

  const handleChange = useCallback(
    (editorState: any) => {
      editorState.read(() => {
        const root = $getRoot();
        const htmlString = root.getTextContent(); // For now, just get text content
        // In a full implementation, you'd serialize to HTML
        onChange(htmlString);
      });
    },
    [onChange]
  );

  return (
    <div className={`border border-gray-300 rounded-md overflow-hidden ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin disabled={disabled} />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                className="min-h-[200px] p-4 outline-none resize-none text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={disabled}
              />
            }
            placeholder={
              <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={ErrorBoundary}
          />
          <OnChangePlugin onChange={handleChange} />
          <HistoryPlugin />
          <ListPlugin />
        </div>
      </LexicalComposer>
    </div>
  );
};