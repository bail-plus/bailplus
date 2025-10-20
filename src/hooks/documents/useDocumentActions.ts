import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import type { Document } from "./useDocuments"

export function useDocumentActions() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)

  const getSignedUrl = async (document: Document): Promise<string | null> => {
    if (!document.file_url) return null

    try {
      const docType = document.type.toUpperCase()
      if (docType === 'RECEIPT' || docType === 'LEASE' || docType === 'EDL' || docType === 'LETTER') {
        const path = document.file_url.startsWith('PRIVATE/')
          ? document.file_url.slice('PRIVATE/'.length)
          : document.file_url.startsWith('QUITTANCES/') || document.file_url.startsWith('LEASES/') || document.file_url.startsWith('EDL/') || document.file_url.startsWith('LETTERS/')
            ? document.file_url
            : document.file_url

        const { data, error } = await supabase.storage
          .from('PRIVATE')
          .createSignedUrl(path, 3600)

        if (error) {
          console.error('Error creating signed URL:', error)
          throw error
        }
        return data?.signedUrl || null
      } else {
        return document.file_url
      }
    } catch (error) {
      console.error('Error getting signed URL:', error)
      return null
    }
  }

  const handlePreview = async (document: Document) => {
    setSelectedDocument(document)
    setPreviewLoading(true)
    setPreviewUrl(null)

    try {
      const url = await getSignedUrl(document)
      if (!url) throw new Error('Impossible de générer le lien')
      setPreviewUrl(url)
    } catch (error) {
      console.error('Error previewing document:', error)
      alert('Erreur lors de la prévisualisation du document')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleDownload = async (document: Document) => {
    setDownloading(document.id)
    try {
      const url = await getSignedUrl(document)
      if (!url) throw new Error('Impossible de générer le lien de téléchargement')

      const response = await fetch(url)
      if (!response.ok) throw new Error('Erreur lors du téléchargement')

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      const link = window.document.createElement('a')
      link.href = blobUrl
      link.download = document.name
      link.style.display = 'none'
      window.document.body.appendChild(link)
      link.click()

      setTimeout(() => {
        window.document.body.removeChild(link)
        window.URL.revokeObjectURL(blobUrl)
      }, 100)
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('Erreur lors du téléchargement du document')
    } finally {
      setDownloading(null)
    }
  }

  const handleClosePreview = () => {
    setSelectedDocument(null)
    setPreviewUrl(null)
  }

  return {
    selectedDocument,
    setSelectedDocument,
    previewUrl,
    previewLoading,
    downloading,
    handlePreview,
    handleDownload,
    handleClosePreview,
  }
}
