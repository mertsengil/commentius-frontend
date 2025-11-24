"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/types/card";

interface DeleteCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  card: Card;
}

export default function DeleteCardModal({ isOpen, onClose, onDelete, card }: DeleteCardModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Kartı Sil
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="mb-4">
            <strong>{card.business?.name || `İşletme #${card.businessId}`}</strong> işletmesine ait kartı silmek istediğinizden emin misiniz?
          </p>
          
          <div className="bg-red-50 p-3 rounded-md text-sm border border-red-200 text-red-800 mb-4">
            <p>Bu işlem geri alınamaz ve aşağıdaki verileri silecektir:</p>
            <ul className="list-disc ml-5 mt-2">
              <li>Kart bilgileri</li>
              <li>Yönlendirme URL'i: <code>{card.redirect_url}</code></li>
            </ul>
          </div>
          
          <p className="text-sm text-gray-500">
            Not: Bu işlem "soft delete" olarak gerçekleştirilecek ve veritabanında kayıt kalacaktır.
          </p>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            İptal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Siliniyor..." : "Evet, Kartı Sil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 