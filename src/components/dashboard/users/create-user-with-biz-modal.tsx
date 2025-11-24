'use client'

import { useEffect, useState } from 'react'
import {
    Dialog, DialogHeader, DialogTitle,
    DialogContent, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue }
    from '@/components/ui/select'
import { businessAPI } from '@/lib/api'
import type { Business } from '@/types/business'

interface Props {
    isOpen: boolean
    onClose: () => void
    onSubmit: (payload: {
        /* user */
        name: string
        email: string
        password: string
        /* business */
        createNew: boolean
        businessName?: string
        phone?: string
        existingBusinessId?: number
    }) => void
}

export default function CreateUserWithBizModal({ isOpen, onClose, onSubmit }: Props) {
    /* ---------- fetch unassigned businesses ---------- */
    const [unassigned, setUnassigned] = useState<Business[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        setLoading(true)
        businessAPI.fetchUnassigned().then(r => {
            if (r.data) setUnassigned(r.data)
        }).finally(() => setLoading(false))
    }, [isOpen])

    /* ---------- form state ---------- */
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        /* mode */
        createNew: true,
        businessName: '',
        phone: '',
        existingBusinessId: undefined as number | undefined,
    })
    const handle = (k: string) => (e: any) =>
        setForm({ ...form, [k]: e?.target ? e.target.value : e })

    /* ---------- validations ---------- */
    const canSave =
        form.name &&
        form.email &&
        form.password &&
        (
            (form.createNew && form.businessName) ||
            (!form.createNew && form.existingBusinessId)
        )

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Yeni Kullanıcı + İşletme</DialogTitle>
                </DialogHeader>

                {/* ---------- USER ---------- */}
                <div className="grid gap-4 py-4">
                    <div className="space-y-1">
                        <Label>Kullanıcı Adı</Label>
                        <Input value={form.name} onChange={handle('name')} />
                    </div>
                    <div className="space-y-1">
                        <Label>E-posta</Label>
                        <Input type="email" value={form.email} onChange={handle('email')} />
                    </div>
                    <div className="space-y-1">
                        <Label>Şifre</Label>
                        <Input type="password" value={form.password} onChange={handle('password')} />
                    </div>

                    <hr />

                    {/* ---------- BUSINESS MODE TOGGLE ---------- */}
                    <div className="flex gap-4">
                        <Button
                            variant={form.createNew ? 'default' : 'outline'}
                            onClick={() => setForm({ ...form, createNew: true })}
                        >
                            Yeni İşletme
                        </Button>
                        <Button
                            variant={!form.createNew ? 'default' : 'outline'}
                            onClick={() => setForm({ ...form, createNew: false })}
                        >
                            Mevcut Sahipsiz İşletme
                        </Button>
                    </div>

                    {/* ---------- CREATE NEW ---------- */}
                    {form.createNew && (
                        <>
                            <div className="space-y-1">
                                <Label>İşletme İsmi</Label>
                                <Input value={form.businessName} onChange={handle('businessName')} />
                            </div>
                            <div className="space-y-1">
                                <Label>Telefon (opsiyonel)</Label>
                                <Input value={form.phone} onChange={handle('phone')} />
                            </div>
                        </>
                    )}

                    {/* ---------- SELECT EXISTING ---------- */}
                    {!form.createNew && (
                        <div className="space-y-1">
                            <Label>Sahipsiz İşletme Seç</Label>
                            <Select
                                disabled={loading}
                                onValueChange={value =>
                                    setForm({ ...form, existingBusinessId: Number(value) })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={loading ? 'Yükleniyor…' : 'Seçiniz'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {unassigned.map(b => (
                                        <SelectItem key={b.id} value={String(b.id)}>
                                            {b.id} — {b.name || b.name}
                                        </SelectItem>
                                    ))}
                                    {unassigned.length === 0 && !loading && (
                                        <div className="p-2 text-sm text-muted-foreground">
                                            Sahipsiz işletme yok
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Vazgeç</Button>
                    <Button disabled={!canSave} onClick={() => onSubmit(form)}>
                        Kaydet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
