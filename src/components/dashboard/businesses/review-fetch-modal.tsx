// src/components/dashboard/businesses/review-fetch-modal.tsx
'use client';

import React, { FC, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAppDispatch } from '@/lib/hooks';
import { enqueueReviews } from '@/features/businesses/businessesSlice';

interface Props {
    businessId: number;
    isOpen: boolean;
    onClose: () => void;
}

export const ReviewFetchModal: FC<Props> = ({ businessId, isOpen, onClose }) => {

    const dispatch = useAppDispatch();
    const [mode, setMode] = useState<'incremental' | 'full'>('incremental');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await dispatch(enqueueReviews({ businessId, mode })).unwrap();
            toast.success('Yorum çekme işlemi başlatıldı.');
            onClose();
        } catch (err: any) {
            console.error(err);
            toast.error('Yorum çekilirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Yorum Çekme Modu</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="mode"
                            value="incremental"
                            checked={mode === 'incremental'}
                            onChange={() => setMode('incremental')}
                        />
                        Sadece Yeni (incremental)
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="mode"
                            value="full"
                            checked={mode === 'full'}
                            onChange={() => setMode('full')}
                        />
                        Tam Olarak (full)
                    </label>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        İptal
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Gönderiliyor…' : 'Başlat'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
