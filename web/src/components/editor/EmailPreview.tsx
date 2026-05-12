import { useEffect, useRef } from 'react'

interface EmailPreviewProps {
  html: string
}

const PREVIEW_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 16px; color: #333; line-height: 1.6; }
  a { color: #0066cc; }
  img { max-width: 100%; height: auto; }
</style>
</head>
<body>{{CONTENT}}</body>
</html>`

export function EmailPreview({ html }: EmailPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(PREVIEW_TEMPLATE.replace('{{CONTENT}}', html || '<p style="color:#999">No content</p>'))
        doc.close()
      }
    }
  }, [html])

  return (
    <div className="border rounded-lg overflow-hidden h-full">
      <div className="px-3 py-2 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
        Preview
      </div>
      <iframe
        ref={iframeRef}
        className="w-full min-h-[300px] border-0"
        sandbox="allow-same-origin"
        title="Email Preview"
      />
    </div>
  )
}
