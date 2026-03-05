import React, { useRef, useCallback } from 'react';

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
  const editorRef = useRef<HTMLDivElement>(null);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const formatText = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  // Set initial content and update when value changes
  React.useEffect(() => {
    if (editorRef.current) {
      // Only update if the content is actually different to avoid cursor jumping
      const currentContent = editorRef.current.innerHTML;
      if (currentContent !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  return (
    <div className={`border border-gray-300 rounded-md overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
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
        <div className="w-px h-6 bg-gray-300 mx-2"></div>
        <button
          type="button"
          onClick={() => formatText('formatBlock', 'h1')}
          disabled={disabled}
          className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => formatText('formatBlock', 'h2')}
          disabled={disabled}
          className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => formatText('formatBlock', 'h3')}
          disabled={disabled}
          className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          title="Heading 3"
        >
          H3
        </button>
        <div className="w-px h-6 bg-gray-300 mx-2"></div>
        <button
          type="button"
          onClick={() => formatText('insertUnorderedList')}
          disabled={disabled}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => formatText('insertOrderedList')}
          disabled={disabled}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Numbered List"
        >
          1.
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        className="min-h-[300px] p-4 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ 
          minHeight: '300px',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'text'
        }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};