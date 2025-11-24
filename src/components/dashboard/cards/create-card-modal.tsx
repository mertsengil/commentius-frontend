"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

// Business kullanıcı tipi
interface Business {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  created_at: string;
}

// Form verisi tipi
interface BusinessFormData {
  name: string;
  type: "table" | "card";
  redirect_url: string;
  businessId: string;
}

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: "table" | "card";
    redirect_url: string;
    businessId: number;
  }) => void;
  businesses?: Business[];
}

export default function CreateCardModal({
  isOpen,
  onClose,
  onSubmit,
  businesses = []
}: CreateCardModalProps) {
  const [formData, setFormData] = useState<BusinessFormData>({
    name: "",
    type: "table",
    redirect_url: "",
    businessId: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof BusinessFormData, string>>
  >({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof formData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (field: keyof BusinessFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Kart ismi zorunludur";
    }
    if (!["table", "card"].includes(formData.type)) {
      newErrors.type = "Tip geçersiz";
    }
    if (!formData.redirect_url) {
      newErrors.redirect_url = "URL alanı zorunludur";
    } else if (!/^https?:\/\/.+/.test(formData.redirect_url)) {
      newErrors.redirect_url =
        "Geçerli bir URL giriniz (http:// veya https:// ile başlamalı)";
    }
    if (!formData.businessId) {
      newErrors.businessId = "İşletme seçimi zorunludur";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        type: formData.type,
        redirect_url: formData.redirect_url,
        businessId: Number(formData.businessId)
      });
      setFormData({
        name: "",
        type: "table",
        redirect_url: "",
        businessId: ""
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeBusinesses = businesses.filter((b) => b.active);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Yeni Kart Oluştur</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Kart İsmi */}
          <div className="space-y-2">
            <Label htmlFor="name">Kart İsmi</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Kart için bir isim girin"
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Tip Seçimi */}
          <div className="space-y-2">
            <Label htmlFor="type">Tip</Label>
            <Select
              value={formData.type}
              onValueChange={(v) => handleSelectChange("type", v)}
              disabled={isSubmitting}
            >
              <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                <SelectValue placeholder="Tip seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="table">Table</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type}</p>
            )}
          </div>

          {/* İşletme Seçimi */}
          <div className="space-y-2">
            <Label htmlFor="businessId">İşletme Seçimi</Label>
            {activeBusinesses.length > 0 ? (
              <Select
                value={formData.businessId}
                onValueChange={(v) =>
                  handleSelectChange("businessId", v)
                }
                disabled={isSubmitting}
              >
                <SelectTrigger
                  className={errors.businessId ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="İşletme seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {activeBusinesses.map((biz) => (
                    <SelectItem
                      key={biz.id}
                      value={biz.id.toString()}
                    >
                      {biz.name} ({biz.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="businessId"
                name="businessId"
                type="number"
                placeholder="İşletme ID giriniz"
                value={formData.businessId}
                onChange={handleChange}
                disabled={isSubmitting}
                className={errors.businessId ? "border-red-500" : ""}
              />
            )}
            {errors.businessId && (
              <p className="text-sm text-red-500">
                {errors.businessId}
              </p>
            )}
            {activeBusinesses.length === 0 &&
              businesses.length > 0 && (
                <p className="text-xs text-amber-600">
                  Not: Aktif işletme bulunamadı. Kart eklemek
                  için aktif bir işletme gereklidir.
                </p>
              )}
          </div>

          {/* Yönlendirme URL */}
          <div className="space-y-2">
            <Label htmlFor="redirect_url">Yönlendirme URL'i</Label>
            <Input
              id="redirect_url"
              name="redirect_url"
              type="url"
              placeholder="https://example.com"
              value={formData.redirect_url}
              onChange={handleChange}
              disabled={isSubmitting}
              className={errors.redirect_url ? "border-red-500" : ""}
            />
            {errors.redirect_url && (
              <p className="text-sm text-red-500">
                {errors.redirect_url}
              </p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || activeBusinesses.length === 0}
            >
              {isSubmitting ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
