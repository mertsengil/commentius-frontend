'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface CreateBusinessModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    name: string
    email: string
    password: string
    googleMapsUrl?: string | null
    reviewReplyTokens?: number | null
    reviewReplyPrompt?: string | null
  }) => Promise<void> | void
}

export default function CreateBusinessModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateBusinessModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    googleMapsUrl: '',
    reviewReplyTokens: '',
    reviewReplyPrompt: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  /* ---------- Validation ---------- */
  const validate = () => {
    const e: Record<string, string> = {}
    if (!formData.name.trim()) e.name = 'İşletme adı zorunludur'
    if (!formData.email.trim()) e.email = 'E-posta zorunludur'
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email))
      e.email = 'Geçerli bir e-posta giriniz'
    if (!formData.password) e.password = 'Şifre zorunludur'
    else if (formData.password.length < 6) e.password = 'Şifre en az 6 karakter olmalıdır'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  /* ---------- Handlers ---------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((p) => ({ ...p, [name]: value }))
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined! }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)

    try {
      await onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        googleMapsUrl: formData.googleMapsUrl.trim() || null,
        reviewReplyTokens: formData.reviewReplyTokens
          ? Number(formData.reviewReplyTokens)
          : null,
        reviewReplyPrompt: formData.reviewReplyPrompt.trim() || null,
      })
      /* Reset */
      setFormData({
        name: '',
        email: '',
        password: '',
        googleMapsUrl: '',
        reviewReplyTokens: '',
        reviewReplyPrompt: '',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ---------- Render ---------- */
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Yeni İşletme Ekle</DialogTitle>
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

          {/* PASSWORD */}
          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
          </div>

          {/* GOOGLE MAPS */}
          <div className="space-y-2">
            <Label htmlFor="googleMapsUrl">Google Maps URL (ops.)</Label>
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
            <Label htmlFor="reviewReplyTokens">Token (ops.)</Label>
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
            <Label htmlFor="reviewReplyPrompt">Yanıt Promptu (ops.)</Label>
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

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Ekleniyor…' : 'Ekle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
