import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, FileIcon, Image as ImageIcon, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'

interface FileWithPreview {
  file: File
  preview?: string
  name: string
  size: number
  type: string
}

interface FileUploadProps {
  onFilesChange: (files: FileWithPreview[]) => void
  maxFiles?: number
  maxSize?: number // in bytes
  acceptedTypes?: string[]
  className?: string
}

export function FileUpload({
  onFilesChange,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = ['image/*', 'application/pdf'],
  className
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const { toast } = useToast()

  const handleFiles = useCallback((newFiles: FileList) => {
    const validFiles: FileWithPreview[] = []

    Array.from(newFiles).forEach((file) => {
      // Check file size
      if (file.size > maxSize) {
        toast({
          title: 'Fichier trop volumineux',
          description: `${file.name} dépasse la taille maximale de ${Math.round(maxSize / 1024 / 1024)}MB`,
          variant: 'destructive',
        })
        return
      }

      // Check file type
      const isValidType = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          const baseType = type.replace('/*', '')
          return file.type.startsWith(baseType)
        }
        return file.type === type
      })

      if (!isValidType) {
        toast({
          title: 'Type de fichier non supporté',
          description: `${file.name} n'est pas un type de fichier accepté`,
          variant: 'destructive',
        })
        return
      }

      // Check max files
      if (files.length + validFiles.length >= maxFiles) {
        toast({
          title: 'Nombre maximum atteint',
          description: `Vous ne pouvez uploader que ${maxFiles} fichiers maximum`,
          variant: 'destructive',
        })
        return
      }

      // Create preview for images
      const fileWithPreview: FileWithPreview = {
        file,
        name: file.name,
        size: file.size,
        type: file.type,
      }

      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          fileWithPreview.preview = reader.result as string
          setFiles(prev => {
            const updated = [...prev, fileWithPreview]
            onFilesChange(updated)
            return updated
          })
        }
        reader.readAsDataURL(file)
      } else {
        validFiles.push(fileWithPreview)
      }
    })

    if (validFiles.length > 0) {
      setFiles(prev => {
        const updated = [...prev, ...validFiles]
        onFilesChange(updated)
        return updated
      })
    }
  }, [files, maxFiles, maxSize, acceptedTypes, onFilesChange, toast])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles)
    }
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles)
    }
    // Reset input
    e.target.value = ''
  }, [handleFiles])

  const removeFile = useCallback((index: number) => {
    setFiles(prev => {
      const updated = prev.filter((_, i) => i !== index)
      onFilesChange(updated)
      return updated
    })
  }, [onFilesChange])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          files.length >= maxFiles && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          disabled={files.length >= maxFiles}
        />
        <label
          htmlFor="file-upload"
          className={cn(
            'cursor-pointer',
            files.length >= maxFiles && 'cursor-not-allowed'
          )}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">
            Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
          </p>
          <p className="text-xs text-muted-foreground">
            {acceptedTypes.includes('image/*') && 'Images, '}
            {acceptedTypes.includes('application/pdf') && 'PDF, '}
            max {Math.round(maxSize / 1024 / 1024)}MB par fichier ({maxFiles} fichiers max)
          </p>
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{files.length} fichier(s) sélectionné(s)</p>
          <div className="grid gap-2">
            {files.map((fileItem, index) => (
              <Card key={index}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {/* File Icon/Preview */}
                    <div className="flex-shrink-0">
                      {fileItem.preview ? (
                        <img
                          src={fileItem.preview}
                          alt={fileItem.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          {fileItem.type.startsWith('image/') ? (
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          ) : (
                            <FileIcon className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fileItem.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(fileItem.size)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
