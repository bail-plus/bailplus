import { useState } from "react"

export function useDocumentModals() {
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [leaseModalOpen, setLeaseModalOpen] = useState(false)
  const [edlModalOpen, setEdlModalOpen] = useState(false)
  const [letterModalOpen, setLetterModalOpen] = useState(false)
  const [generatingBatch, setGeneratingBatch] = useState(false)

  const handleGenerateMonthlyReceipts = () => {
    setReceiptModalOpen(true)
  }

  return {
    receiptModalOpen,
    setReceiptModalOpen,
    leaseModalOpen,
    setLeaseModalOpen,
    edlModalOpen,
    setEdlModalOpen,
    letterModalOpen,
    setLetterModalOpen,
    generatingBatch,
    setGeneratingBatch,
    handleGenerateMonthlyReceipts,
  }
}
