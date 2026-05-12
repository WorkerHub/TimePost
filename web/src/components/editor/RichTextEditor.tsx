import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Bold, Italic, Underline, List, ListOrdered, LinkIcon, ImageIcon } from 'lucide-react'

interface RichTextEditorProps {
  initialJson?: string
  onChange?: (json: Record<string, unknown>, html: string) => void
}

export function RichTextEditor({ initialJson, onChange }: RichTextEditorProps) {
  const { t } = useTranslation()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image,
    ],
    content: initialJson ? JSON.parse(initialJson) : '',
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON(), editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && initialJson) {
      const currentJson = JSON.stringify(editor.getJSON())
      const newJson = initialJson
      if (currentJson !== newJson) {
        editor.commands.setContent(JSON.parse(newJson))
      }
    }
  }, [editor, initialJson])

  if (!editor) return null

  const addLink = () => {
    const url = window.prompt(t('emails.enterUrl', { defaultValue: 'Enter URL' }))
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }

  const addImage = () => {
    const url = window.prompt(t('emails.enterImageUrl', { defaultValue: 'Enter image URL' }))
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title={t('emails.bold', { defaultValue: 'Bold' })}
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title={t('emails.italic', { defaultValue: 'Italic' })}
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline?.().run()}
          isActive={editor.isActive('underline')}
          title={t('emails.underline', { defaultValue: 'Underline' })}
        >
          <Underline className="w-4 h-4" />
        </ToolbarButton>
        <div className="w-px h-6 bg-border mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title={t('emails.bulletList', { defaultValue: 'Bullet List' })}
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title={t('emails.orderedList', { defaultValue: 'Ordered List' })}
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <div className="w-px h-6 bg-border mx-1" />
        <ToolbarButton
          onClick={addLink}
          isActive={editor.isActive('link')}
          title={t('emails.link', { defaultValue: 'Link' })}
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={addImage}
          isActive={editor.isActive('image')}
          title={t('emails.image', { defaultValue: 'Image' })}
        >
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none dark:prose-invert"
      />
    </div>
  )
}

function ToolbarButton({
  onClick,
  isActive,
  title,
  children,
}: {
  onClick: () => void
  isActive: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        isActive ? 'bg-primary/20 text-primary' : 'hover:bg-accent text-muted-foreground'
      }`}
    >
      {children}
    </button>
  )
}
