"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
  businessId: number;
  businessName: string;
}

export default function DeleteBusinessModal({ isOpen, onClose, onConfirm, businessId, businessName }: DeleteBusinessModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Silme işlemini gerçekleştir
  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      await onConfirm(businessId);
      // Silme işlemi başarılı olduğunda modal otomatik kapanacak (onConfirm içinde)
    } catch (error) {
      // Hata durumunda sadece loading durumunu sıfırla
      setIsDeleting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>İşletmeyi Sil</DialogTitle>
          <DialogDescription>
            Bu işlem geri alınamaz. Devam etmek istediğinizden emin misiniz?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center gap-2 p-4 bg-yellow-50 text-yellow-800 rounded-md border border-yellow-200">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium">Uyarı:</p>
              <p className="text-sm">
                <span className="font-semibold">{businessName}</span> işletmesini silmek,
                bu işletmeye ait tüm kartların da silinmesine neden olabilir.
              </p>
            </div>
          </div>
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
          >
            {isDeleting ? "Siliniyor..." : "Sil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 