"use client";

import { useState, useEffect } from "react";
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
import { Card } from "@/types/card";

interface EditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    redirect_url: string;
  }) => void;
  card: Card;
}

export default function EditCardModal({
  isOpen,
  onClose,
  onSubmit,
  card
}: EditCardModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    redirect_url: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    redirect_url?: string;
  }>({});

  useEffect(() => {
    if (card) {
      setFormData({
        name: card.name || "",
        redirect_url: card.redirect_url
      });
    }
  }, [card]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Kart ismi zorunludur";
    }
    if (!formData.redirect_url) {
      newErrors.redirect_url = "URL alanı zorunludur";
    } else if (!/^https?:\/\/.+/.test(formData.redirect_url)) {
      newErrors.redirect_url =
        "Geçerli bir URL giriniz (http:// veya https:// ile başlamalı)";
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
        redirect_url: formData.redirect_url
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Kart Düzenle</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* İşletme, Kart ID ve Tip bilgisi */}
          <div className="space-y-1 text-sm text-gray-500">
            <p>
              <span className="font-medium">İşletme:</span>{" "}
              {card.business?.name || `#${card.businessId}`}
            </p>
            <p>
              <span className="font-medium">Kart ID:</span> {card.id}
            </p>
            <p>
              <span className="font-medium">Tip:</span> {card.type}
            </p>
          </div>

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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
