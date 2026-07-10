import React, { useEffect, useRef } from 'react'
import { Cancel01Icon } from 'hugeicons-react'
import { ScrollArea } from './ui/scroll-area'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialogNode = dialogRef.current
    if (isOpen) {
      if (!dialogNode?.open) {
        dialogNode?.showModal()
      }
    } else {
      if (dialogNode?.open) {
        dialogNode?.close()
      }
    }
  }, [isOpen])

  useEffect(() => {
    const dialogNode = dialogRef.current
    const handleCancel = (event: Event) => {
      event.preventDefault()
      onClose()
    }
    
    dialogNode?.addEventListener('cancel', handleCancel)
    return () => {
      dialogNode?.removeEventListener('cancel', handleCancel)
    }
  }, [onClose])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="custom-dialog"
      onClick={handleBackdropClick}
    >
      <div className="custom-dialog-content">
        <div className="custom-dialog-header">
          <h2 className="custom-dialog-title">{title}</h2>
          <button className="btn-icon custom-dialog-close" onClick={onClose} aria-label="Close">
            <Cancel01Icon size={24} />
          </button>
        </div>
        <div className="custom-dialog-body" style={{ padding: 0, overflow: 'hidden' }}>
          <ScrollArea style={{ height: '100%', flex: 1 }}>
            <div style={{ padding: '1.5rem' }}>
              {children}
            </div>
          </ScrollArea>
        </div>
      </div>
    </dialog>
  )
}
