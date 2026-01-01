"use client"

import "quill/dist/quill.snow.css"
import { useEffect, useRef } from "react"

type QuillEditorProps = {
    value: string
    onChange: (html: string) => void
    height?: number
    placeholder?: string
    readOnly?: boolean
}

export function QuillEditor({ value, onChange, height = 380, placeholder, readOnly }: QuillEditorProps) {
    const editorRef = useRef<HTMLDivElement | null>(null)
    const quillRef = useRef<any>(null)

    useEffect(() => {
        let mounted = true
        import("quill").then(({ default: Quill }) => {
            if (!mounted || !editorRef.current) return

            const toolbarOptions = [
                [{ header: [1, 2, 3, 4, 5, 6, false] }, { font: [] }],
                [{ size: [] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code'],
                [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
                [{ indent: '-1' }, { indent: '+1' }],
                [{ align: [] }],
                [{ color: [] }, { background: [] }],
                ['link', 'image', 'video'],
                ['clean'],
            ]

            quillRef.current = new Quill(editorRef.current, {
                theme: 'snow',
                readOnly,
                placeholder,
                modules: {
                    toolbar: toolbarOptions,
                },
            })

            // Initial content
            if (value) {
                quillRef.current.clipboard.dangerouslyPasteHTML(value)
            }

            // Height
            const el: HTMLElement = editorRef.current.querySelector('.ql-editor') as HTMLElement
            if (el) {
                el.style.minHeight = `${height}px`
            }

            quillRef.current.on('text-change', () => {
                const html = editorRef.current!.querySelector('.ql-editor')!.innerHTML
                onChange(html)
            })
        })

        return () => { mounted = false }
    }, [])

    // Sync external value updates
    useEffect(() => {
        if (quillRef.current && typeof value === 'string') {
            const current = (editorRef.current!.querySelector('.ql-editor') as HTMLElement).innerHTML
            if (current !== value) {
                quillRef.current.clipboard.dangerouslyPasteHTML(value || '')
            }
        }
    }, [value])

    return (
        <div className="rounded-lg overflow-hidden">
            <div ref={editorRef} />
            <style jsx global>{`
        :root { --primary: var(--primary, #0ea5e9); }
        /* Toolbar and container: no borders/shadows */
        .ql-toolbar.ql-snow,
        .ql-snow .ql-toolbar {
          background: #f8fafc;
          border: 0 !important;
          border-bottom: 0 !important;
          box-shadow: none !important;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji";
          font-size: 13px;
          display: flex;
          flex-wrap: wrap;
          column-gap: 8px;
          row-gap: 6px;
        }
        .ql-snow .ql-formats {
          display: inline-flex;
          gap: 4px;
        }
        .ql-toolbar .ql-formats,
        .ql-snow .ql-toolbar .ql-formats,
        .ql-formats {
          margin: 0 !important;
        }
        .ql-container.ql-snow,
        .ql-snow .ql-container {
          border: 0 !important;
          box-shadow: none !important;
        }
        .ql-snow .ql-toolbar .ql-picker-label.ql-active,
        .ql-snow .ql-toolbar .ql-picker-item.ql-selected,
        .ql-snow .ql-toolbar button.ql-active .ql-stroke,
        .ql-snow .ql-toolbar button:hover .ql-stroke {
          stroke: var(--primary, #0ea5e9);
        }
        .ql-snow .ql-toolbar button.ql-active .ql-fill,
        .ql-snow .ql-toolbar button:hover .ql-fill {
          fill: var(--primary, #0ea5e9);
        }
        /* System font as default */
        .ql-snow .ql-editor {
          padding: 12px;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji";
          font-size: 14px;
          line-height: 1.7;
        }
        /* Picker labels and items use system font */
        .ql-snow .ql-picker,
        .ql-snow .ql-picker-label,
        .ql-snow .ql-picker-item {
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji";
          font-size: 13px;
        }
        /* Rounded, filled pickers to match system style */
        .ql-snow .ql-picker {
          border: none !important;
          background: #f1f5f9;
          border-radius: 8px;
          padding: 0 4px;
          min-height: 32px;
          display: inline-flex;
          align-items: center;
        }
        .ql-snow .ql-picker-label {
          border: none !important;
          background: transparent;
          border-radius: 6px;
          padding: 4px 6px;
          color: inherit;
          min-height: 28px;
          display: inline-flex;
          align-items: center;
        }
        .ql-snow .ql-picker-label:hover,
        .ql-snow .ql-picker.ql-expanded .ql-picker-label {
          background: #e2e8f0;
        }
        .ql-snow .ql-picker-options {
          border: none !important;
          box-shadow: none !important;
          border-radius: 8px;
          background: #f8fafc;
          padding: 4px;
          min-width: 110px;
        }
        .ql-snow .ql-picker-item {
          padding: 6px 8px;
          border-radius: 6px;
          line-height: 1.4;
        }
        .ql-snow .ql-picker-item:hover,
        .ql-snow .ql-picker-item.ql-selected {
          background: #e2e8f0;
        }
        /* Remove extra padding for size picker */
        .ql-snow .ql-picker.ql-size {
          padding: 0;
          min-width: 32px;
          min-height: 32px;
        }
        .ql-snow .ql-picker.ql-size .ql-picker-label {
          padding: 4px 6px;
          min-height: 28px;
        }
        .ql-snow .ql-picker.ql-size .ql-picker-options {
          padding: 2px;
          min-width: 90px;
        }
        .ql-snow .ql-picker.ql-size .ql-picker-item {
          padding: 6px 8px;
        }
        /* Alignment picker tighter padding */
        .ql-snow .ql-picker.ql-align {
          padding: 0;
          min-width: 32px;
          min-height: 32px;
        }
        .ql-snow .ql-picker.ql-align .ql-picker-label {
          padding: 4px 6px;
          min-height: 28px;
        }
        .ql-snow .ql-picker.ql-align .ql-picker-options {
          min-width: 80px;
          padding: 2px;
        }
        .ql-snow .ql-picker.ql-align .ql-picker-item {
          padding: 6px 8px;
        }
        /* Icon sizes for alignment and color pickers */
        .ql-snow .ql-picker.ql-align .ql-picker-label svg,
        .ql-snow .ql-picker.ql-align .ql-picker-item svg,
        .ql-snow .ql-picker.ql-color-picker .ql-picker-label svg,
        .ql-snow .ql-picker.ql-color-picker .ql-picker-item svg {
          width: 18px;
          height: 18px;
        }
        /* Color and background pickers compact */
        .ql-snow .ql-picker.ql-color-picker,
        .ql-snow .ql-picker.ql-background {
          padding: 0;
          min-width: 32px;
          min-height: 32px;
        }
        .ql-snow .ql-picker.ql-color-picker .ql-picker-label,
        .ql-snow .ql-picker.ql-background .ql-picker-label {
          padding: 4px 6px;
          min-height: 28px;
        }
        .ql-snow .ql-picker.ql-color-picker .ql-picker-options,
        .ql-snow .ql-picker.ql-background .ql-picker-options {
          padding: 4px;
          min-width: 140px;
        }
        .ql-snow .ql-picker.ql-color-picker .ql-picker-item,
        .ql-snow .ql-picker.ql-background .ql-picker-item {
          padding: 6px 8px;
          border-radius: 6px;
        }
      `}</style>
        </div>
    )
}

export default QuillEditor
