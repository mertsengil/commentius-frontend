/* ------------------------------------------------------------------ */
/*  app/(dashboard)/settings/page.tsx                                 */
/* ------------------------------------------------------------------ */
'use client';

import React, { useEffect, useState } from 'react';
import {
    Loader2,
    Plus,
    Building2,
    Check,
    X,
    Save,
    Settings2,
    Info,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
    fetchAllBusinesses,
    clearBusinesses,
    createBusiness,
    updateBusiness,
    bulkUpdateBusinesses,
    selectAllBusinesses,
    selectBusinessesStatus,
} from '@/features/businesses/businessesSlice';

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip';

/* ─────────────────────────── ZOD Şemaları ───────────────────────── */
const NewBizSchema = z.object({
    name: z.string().min(2, 'İşletme adı gerekli'),
    googleMapsUrl: z.string().url('Geçersiz URL'),
    yemekSepetiUrl: z.string().url().optional().or(z.literal('')),
});
type NewBizForm = z.infer<typeof NewBizSchema>;

const BizFormSchema = z.object({
    phone: z.string().optional(),
    googleMapsUrl: z.string().url('Geçersiz URL').optional().or(z.literal('')),
    yemekSepetiUrl: z.string().url().optional().or(z.literal('')),
    reviewReplyPrompt: z.string().optional(),
});
type BizPatch = z.infer<typeof BizFormSchema>;

/* ================================================================= */
/*                            PAGE                                    */
/* ================================================================= */
export default function SettingsPage() {
    const dispatch = useAppDispatch();
    const items = useAppSelector(selectAllBusinesses);
    const statusAll = useAppSelector(selectBusinessesStatus);

    useEffect(() => {
        dispatch(clearBusinesses());
        dispatch(fetchAllBusinesses());
    }, [dispatch]);

    const [savingId, setSaving] = useState<number | null>(null);

    /* ---------------- Yeni İşletme Dialog RHF ---------------- */
    const {
        register,
        handleSubmit,
        reset,
        formState: { isSubmitting, errors, isValid },
    } = useForm<NewBizForm>({
        resolver: zodResolver(NewBizSchema),
        mode: 'onChange',
    });
    const [openNewBiz, setOpenNewBiz] = useState(false);

    const submitNewBiz = handleSubmit((data) =>
        dispatch(createBusiness(data))
            .unwrap()
            .then(() => {
                toast.success('İşletme oluşturuldu');
                reset();
                setOpenNewBiz(false);
            })
            .catch((e: string) => toast.error(e)),
    );

    /* ---------- Loading ---------- */
    if (statusAll === 'loading')
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );

    return (
        <TooltipProvider>
            <div className="p-6 space-y-8">
                <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-primary" />
                    Hesap Ayarları
                </h1>

                {/* ---------- Toplu Ayarlar ---------- */}
                <Card className="max-w-3xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Settings2 className="h-5 w-5 text-primary" /> Toplu Ayarlar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <BulkToggle
                            label="Otomatik Yorum Analizi"
                            tooltip="Tüm işletmeler için aç/kapat"
                            field="canReviewPeriod"
                        />
                        <BulkToggle
                            label="Otomatik Yanıt"
                            tooltip="Tüm işletmeler için aç/kapat"
                            field="reviewReplyAuto"
                        />
                    </CardContent>
                </Card>

                {/* ---------- İşletme Kartları ---------- */}
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {items.map((biz) => (
                        <BusinessCardMemo
                            key={biz.id}
                            biz={biz}
                            saving={savingId === biz.id}
                            onSave={(patch) => {
                                setSaving(biz.id);
                                dispatch(updateBusiness({ id: biz.id, data: patch }))
                                    .unwrap()
                                    .then(() => toast.success('Kaydedildi'))
                                    .catch((e: string) => toast.error(e))
                                    .finally(() => setSaving(null));
                            }}
                        />
                    ))}

                    {/* + Yeni kart */}
                    <Card
                        onClick={() => setOpenNewBiz(true)}
                        className="group flex cursor-pointer items-center justify-center border-dashed
              hover:shadow-md transition-shadow min-h-[200px]"
                    >
                        <Plus className="h-10 w-10 text-primary group-hover:scale-110 transition-transform" />
                    </Card>
                </div>

                {/* ---------- Yeni İşletme Dialog ---------- */}
                <Dialog open={openNewBiz} onOpenChange={setOpenNewBiz}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="mb-4">Yeni İşletme Oluştur</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={submitNewBiz} className="space-y-4">
                            <Input
                                placeholder="İşletme Adı"
                                {...register('name')}
                                aria-invalid={!!errors.name}
                            />
                            {errors.name && (
                                <p className="text-xs text-red-600">{errors.name.message}</p>
                            )}

                            <Input
                                placeholder="Google Maps URL"
                                {...register('googleMapsUrl')}
                                aria-invalid={!!errors.googleMapsUrl}
                            />
                            {errors.googleMapsUrl && (
                                <p className="text-xs text-red-600">
                                    {errors.googleMapsUrl.message}
                                </p>
                            )}

                            <Input
                                placeholder="Yemeksepeti URL (isteğe bağlı)"
                                {...register('yemekSepetiUrl')}
                                aria-invalid={!!errors.yemekSepetiUrl}
                            />
                            {errors.yemekSepetiUrl && (
                                <p className="text-xs text-red-600">
                                    {errors.yemekSepetiUrl.message}
                                </p>
                            )}

                            <DialogFooter>
                                <Button type="submit" disabled={!isValid || isSubmitting}>
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        'Kaydet'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}

/* ------------------------------------------------------------------ */
/*  BusinessCard (react-hook-form)                                    */
/* ------------------------------------------------------------------ */
type BizType = {
    id: number;
    name: string;
    phone?: string;
    googleMapsUrl?: string;
    yemekSepetiUrl?: string;
    reviewReplyPrompt?: string;
    canReviewPeriod?: boolean;
    reviewReplyAuto?: boolean;
};

function BusinessCard({
    biz,
    saving,
    onSave,
}: {
    biz: BizType;
    saving: boolean;
    onSave: (data: BizPatch) => void;
}) {
    const {
        register,
        handleSubmit,
        formState: { isDirty },
    } = useForm<BizPatch>({
        resolver: zodResolver(BizFormSchema),
        defaultValues: {
            phone: biz.phone ?? '',
            googleMapsUrl: biz.googleMapsUrl ?? '',
            yemekSepetiUrl: biz.yemekSepetiUrl ?? '',
            reviewReplyPrompt: biz.reviewReplyPrompt ?? '',
        },
    });

    const submit = handleSubmit((data) => onSave(data));

    return (
        <Card className="relative shadow-sm min-h-[200px]">
            {saving && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            )}

            <CardHeader>
                <CardTitle className="truncate">{biz.name}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 pb-4">
                <SettingRow
                    label="Otomatik Yorum Dönemi"
                    tooltip="Her yorum analizi 1 kredi"
                    checked={biz.canReviewPeriod ?? false}
                    onChange={(v) => onSave({ canReviewPeriod: v })}
                    disabled={saving}
                />
                <SettingRow
                    label="Otomatik Yanıt"
                    tooltip="Her yorum cevaplama 1 kredi"
                    checked={biz.reviewReplyAuto ?? false}
                    onChange={(v) => onSave({ reviewReplyAuto: v })}
                    disabled={saving}
                />

                <Input label="Telefon" {...register('phone')} />
                <Input label="Google Maps URL" {...register('googleMapsUrl')} />
                <Input label="Yemeksepeti URL" {...register('yemekSepetiUrl')} />
                <textarea
                    rows={3}
                    className="w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm
            focus-visible:outline-none focus-visible:ring focus-visible:ring-primary/40
            disabled:opacity-50 resize-none"
                    placeholder="Otomatik Yanıt Metni"
                    {...register('reviewReplyPrompt')}
                />
            </CardContent>

            <CardFooter className="justify-end">
                <Button size="sm" disabled={!isDirty || saving} onClick={submit}>
                    <Save className="mr-1 h-4 w-4" />
                    Kaydet
                </Button>
            </CardFooter>
        </Card>
    );
}

const BusinessCardMemo = React.memo(BusinessCard);

/* ------------------------------------------------------------------ */
/*  SettingRow                                                        */
/* ------------------------------------------------------------------ */
function SettingRow({
    label,
    tooltip,
    checked,
    onChange,
    disabled,
    extraBadge,
}: {
    label: string;
    tooltip: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
    extraBadge?: string;
}) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
                <span className="text-sm">{label}</span>

                <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                        <Info
                            className="h-[14px] w-[14px] cursor-help text-muted-foreground"
                            strokeWidth={2}
                        />
                    </TooltipTrigger>
                    <TooltipContent side="top">{tooltip}</TooltipContent>
                </Tooltip>
            </div>

            <div className="flex items-center gap-2">
                <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium
          ${checked
                            ? 'bg-emerald-100 text-emerald-800'
                            : extraBadge
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                        }`}
                >
                    {extraBadge ?? (
                        <>
                            {checked ? (
                                <>
                                    <Check className="h-3 w-3" /> Açık
                                </>
                            ) : (
                                <>
                                    <X className="h-3 w-3" /> Kapalı
                                </>
                            )}
                        </>
                    )}
                </span>

                <Switch
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={onChange}
                />
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  BulkToggle                                                        */
/* ------------------------------------------------------------------ */
function BulkToggle({
    label,
    tooltip,
    field,
}: {
    label: string;
    tooltip: string;
    field: 'canReviewPeriod' | 'reviewReplyAuto';
}) {
    const dispatch = useAppDispatch();
    const items = useAppSelector(selectAllBusinesses);

    const allTrue = items.length > 0 && items.every((b) => b[field]);
    const allFalse = items.every((b) => !b[field]);
    const mixed = !allTrue && !allFalse;

    return (
        <SettingRow
            label={label}
            tooltip={tooltip}
            checked={allTrue}
            disabled={items.length === 0}
            onChange={(v) => {
                dispatch(
                    bulkUpdateBusinesses({
                        ids: items.map((b) => b.id),
                        data: { [field]: v },
                    }),
                )
                    .unwrap()
                    .then(() => toast.success('Tüm işletmeler güncellendi'))
                    .catch((e: string) => toast.error(e));
            }}
            extraBadge={mixed ? 'Karışık' : undefined}
        />
    );
}
