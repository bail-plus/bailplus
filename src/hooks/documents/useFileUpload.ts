import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/ui/use-toast'
import { useAuth } from '@/hooks/auth/useAuth'

export interface UploadedFile {
  id: string
  file_url: string
  name: string
  file_size: number
  mime_type: string
  category?: string
}

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()
  const { user } = useAuth()

  /**
   * Upload files to Supabase Storage and create document records
   */
  const uploadFiles = async (
    files: File[],
    options: {
      bucket?: string
      ticketId?: string
      propertyId?: string
      leaseId?: string
      category?: string
    } = {}
  ): Promise<UploadedFile[]> => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    const {
      bucket = 'PRIVATE',
      ticketId,
      propertyId,
      leaseId,
      category = 'maintenance'
    } = options

    setIsUploading(true)
    setUploadProgress(0)

    const uploadedFiles: UploadedFile[] = []
    const totalFiles = files.length

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Generate unique file name with MAINTENANCE folder
        const fileExt = file.name.split('.').pop()
        const fileName = `MAINTENANCE/${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

        // Upload to Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (storageError) {
          console.error('Storage upload error:', storageError)
          throw storageError
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName)

        // Create document record in database
        const { data: documentData, error: documentError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            mime_type: file.type,
            type: category,
            category: category,
            ticket_id: ticketId || null,
            property_id: propertyId || null,
            lease_id: leaseId || null,
            uploaded_by: user.id
          })
          .select()
          .single()

        if (documentError) {
          console.error('Document creation error:', documentError)
          // Try to delete the uploaded file from storage
          await supabase.storage.from(bucket).remove([fileName])
          throw documentError
        }

        uploadedFiles.push({
          id: documentData.id,
          file_url: documentData.file_url,
          name: documentData.name,
          file_size: documentData.file_size || 0,
          mime_type: documentData.mime_type || '',
          category: documentData.category || undefined
        })

        // Update progress
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100))
      }

      toast({
        title: 'Succès',
        description: `${uploadedFiles.length} fichier(s) uploadé(s) avec succès`,
      })

      return uploadedFiles

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de l\'upload des fichiers',
        variant: 'destructive',
      })
      throw error
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  /**
   * Delete a file from storage and database
   */
  const deleteFile = async (documentId: string, fileUrl: string) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/')
      const fileName = urlParts[urlParts.length - 1]
      const userFolder = urlParts[urlParts.length - 2]
      const maintenanceFolder = urlParts[urlParts.length - 3]
      const filePath = `${maintenanceFolder}/${userFolder}/${fileName}`

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('PRIVATE')
        .remove([filePath])

      if (storageError) {
        console.error('Storage delete error:', storageError)
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)

      if (dbError) {
        throw dbError
      }

      toast({
        title: 'Succès',
        description: 'Fichier supprimé avec succès',
      })

    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la suppression du fichier',
        variant: 'destructive',
      })
      throw error
    }
  }

  return {
    uploadFiles,
    deleteFile,
    isUploading,
    uploadProgress
  }
}
