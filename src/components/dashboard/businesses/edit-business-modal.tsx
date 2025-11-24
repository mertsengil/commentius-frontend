'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { User } from '@/types/user'

interface Business {
  id: number
  name: string
  email: string
  phone: string | null
  active: boolean
  googleMapsUrl?: string | null
  reviewReplyTokens?: number | null
  reviewReplyPrompt?: string | null
  user: User
}

interface EditBusinessModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (
    id: number,
    data: Partial<Omit<Business, 'id'>>
  ) => Promise<void> | void
  business: Business
}

export default function EditBusinessModal({
  isOpen,
  onClose,
  onSubmit,
  business,
}: EditBusinessModalProps) {
  const [formData, setFormData] = useState({
    name: business.name,
    email: business.email,
    phone: business.phone ?? '',
    googleMapsUrl: business.googleMapsUrl ?? '',
    reviewReplyTokens: business.user.reviewReplyTokens.toString() ?? '',
    reviewReplyPrompt: business.reviewReplyPrompt ?? '',
    active: business.active,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  /* ---------- Validation ---------- */
  const validate = () => {
    const e: Record<string, string> = {}
    if (!formData.name.trim()) e.name = 'İşletme adı gerekli'
    if (!formData.email.trim()) e.email = 'E-posta gerekli'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Geçersiz e-posta'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  /* ---------- Change Handlers ---------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((p) => ({ ...p, [name]: value }))
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined! }))
  }

  const handleCheckbox = (checked: boolean) =>
    setFormData((p) => ({ ...p, active: checked }))

  /* ---------- Submit ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)

    const diff: Partial<Omit<Business, 'id'>> = {}

    if (formData.name !== business.name) diff.name = formData.name
    if (formData.email !== business.email) diff.email = formData.email
    if (formData.phone !== (business.phone ?? '')) diff.phone = formData.phone || null
    if (formData.googleMapsUrl !== (business.googleMapsUrl ?? ''))
      diff.googleMapsUrl = formData.googleMapsUrl || null
    if (formData.reviewReplyTokens !== (business.user.reviewReplyTokens?.toString() ?? ''))
      diff.reviewReplyTokens = formData.reviewReplyTokens
        ? Number(formData.reviewReplyTokens)
        : null
    if (formData.reviewReplyPrompt !== (business.reviewReplyPrompt ?? ''))
      diff.reviewReplyPrompt = formData.reviewReplyPrompt || null
    if (formData.active !== business.active) diff.active = formData.active

    try {
      if (Object.keys(diff).length) await onSubmit(business.id, diff)
      else onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ---------- Render ---------- */
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>İşletme Düzenle</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* name */}
          <div className="space-y-2">
            <Label htmlFor="name">İşletme Adı</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* EMAIL */}
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          {/* PHONE */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          {/* GOOGLE MAPS URL */}
          <div className="space-y-2">
            <Label htmlFor="googleMapsUrl">Google Maps URL</Label>
            <Input
              id="googleMapsUrl"
              name="googleMapsUrl"
              value={formData.googleMapsUrl}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          {/* TOKEN */}
          <div className="space-y-2">
            <Label htmlFor="reviewReplyTokens">Token</Label>
            <Input
              id="reviewReplyTokens"
              name="reviewReplyTokens"
              type="number"
              min={0}
              value={formData.reviewReplyTokens}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          {/* PROMPT */}
          <div className="space-y-2">
            <Label htmlFor="reviewReplyPrompt">Yanıt Promptu</Label>
            <textarea
              id="reviewReplyPrompt"
              name="reviewReplyPrompt"
              rows={3}
              value={formData.reviewReplyPrompt}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full rounded-md border px-3 py-2 text-sm resize-none"
            />
          </div>

          {/* ACTIVE CHECKBOX */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="active"
              checked={formData.active}
              onCheckedChange={handleCheckbox}
              disabled={isSubmitting}
            />
            <Label htmlFor="active" className="text-sm font-medium">
              Aktif
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
