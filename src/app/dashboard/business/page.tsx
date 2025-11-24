/* ------------------------------------------------------------------ */
/*  app/(dashboard)/BusinessDashboard.tsx                             */
/* ------------------------------------------------------------------ */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import {
  BarChart2,
  BookOpen,
  MessageSquareText,
  ClipboardList,
  Sparkles,
  TrendingUp /* ✨ EKLE */,
  TrendingDown /* ✨ EKLE */,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"; // ✅ shadcn-ui
import { Checkbox } from "@/components/ui/checkbox"; // ✅ varsa — yoksa kendiniz kullanın
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

/* ---------- auth ---------- */
import { selectAuthStatus, selectAuthUser } from "@/features/auth/authSlice";

/* ---------- dashboard slice ---------- */
import {
  /* thunks */
  fetchDashboard,
  fetchRadar,
  fetchAspectCompare /* ✨ EKLE */,

  /* selectors */
  selectAspectCompare /* ✨ EKLE */,
  selectDash,
  selectLastReviews,
  selectTopAspects,
  selectNewAspects,
  selectRadarCats,
  selectRadarSeries,
  selectWeekCounts,
} from "@/features/dashboard/dashboardSlice";

/* ---------- UI ---------- */
import RadarMultiChart from "@/components/ui/RadarMultiChart";
import TopAspectBars from "@/components/ui/TopAspectBars";
import BarChart from "@/components/ui/bar-chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";

/* ---------- helpers ---------- */
import { pill, highlightAspects } from "@/components/reviews/helpers";

function readStoredBusinesses(): { id: number; name: string }[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("commentius_businesses");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
/* --------------------------------------------- */
/*  localStorage → state                         */
/* --------------------------------------------- */

/* utils */
const fmt = (iso: string) =>
  format(parseISO(iso), "dd.MM.yyyy HH:mm", { locale: tr });

/* ================================================================= */
/*                            COMPONENT                              */
/* ================================================================= */
export default function BusinessDashboard() {
  const [storedBusinesses, setStoredBusinesses] = useState<
    { id: number; name: string }[]
  >([]);

  useEffect(() => {
    setStoredBusinesses(readStoredBusinesses());
  }, []);
  const dispatch = useAppDispatch();
  const router = useRouter();

  /* auth */
  const authStatus = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectAuthUser);
  /* filtre state’i ekle */
  const [selectedIds, setSelectedIds] = useState<number[]>([]); // [] = hepsi

  /* veriyi state’e göre çek */
  useEffect(() => {
    dispatch(
      fetchAspectCompare(
        selectedIds.length ? selectedIds : undefined, // [] → parametresiz
      ),
    );
  }, [dispatch, selectedIds]);

  /* slice state */
  const dash = useAppSelector(selectDash);
  const lastReviews = useAppSelector(selectLastReviews);
  const topAspects = useAppSelector(selectTopAspects);
  const newAspects = useAppSelector(selectNewAspects);
  const aspectCompare = useAppSelector(selectAspectCompare);

  const { prev, curr } = useAppSelector(selectWeekCounts); /* ✨ EKLE */
  const pctChange = useMemo(() => {
    /* ✨ EKLE */
    if (prev === 0) return 0;
    return ((curr - prev) / prev) * 100;
  }, [prev, curr]);

  /* radar selectors */
  const radarCats = useAppSelector(selectRadarCats);
  const radarSeries = useAppSelector(selectRadarSeries);

  /* local ui state */
  const [filter, setFilter] = useState<"all" | "daily" | "weekly">("all");
  const [openAspectId, setOpenAspectId] = useState<number | null>(null);

  /* ──────────────── DERIVED DATA ───────────────── */
  /* 1) Kart başına okuma grafiği */
  const chartData = useMemo(
    () =>
      dash.readCountByCard.map(
        ({ card, totalCount, dailyCount, weeklyCount }) => ({
          id: card.id,
          name: card.name,
          value:
            filter === "daily"
              ? dailyCount
              : filter === "weekly"
              ? weeklyCount
              : totalCount,
        }),
      ),
    [dash.readCountByCard, filter],
  );

  /* 2) Son 20 okuma */
  const rows = useMemo(
    () =>
      [...dash.cardReads]
        .sort((a, b) => Date.parse(b.readAt) - Date.parse(a.readAt))
        .slice(0, 20),
    [dash.cardReads],
  );

  /* 3) Kart id → ad */
  const nameMap = useMemo(
    () =>
      Object.fromEntries(
        dash.readCountByCard.map(({ card }) => [card.id, card.name]),
      ),
    [dash.readCountByCard],
  );

  /* 4) En çok geçen 10 aspect */
  const aspectChart = useMemo(
    () =>
      topAspects.slice(0, 10).map((a) => ({
        id: a.id,
        name: a.text,
        value: a.value,
      })),
    [topAspects],
  );

  /* 5) Yeni aspect listesi */
  const recentAspects = useMemo(
    () =>
      [...newAspects].sort(
        (a, b) => Date.parse(b.lastUsed) - Date.parse(a.lastUsed),
      ),
    [newAspects],
  );

  /* ──────────────── FETCH FLOW ─────────────────── */
  /* Temel dashboard */
  useEffect(() => {
    if (authStatus === "loading") return;
    if (!user) return void router.replace("/login");
    if (user.role !== "business") return void router.replace("/dashboard");

    if (dash.status === "idle") dispatch(fetchDashboard());
  }, [authStatus, user, dash.status, dispatch, router]);

  /* Radar → dashboard başarıyla geldikten sonra tek sefer */
  useEffect(() => {
    if (dash.status !== "succeeded") return;
    if (radarCats.length) return; // zaten yüklendi
    dispatch(fetchRadar()); // parametresiz thunk
  }, [dash.status, radarCats.length, dispatch]);

  /* ──────────────── UI: loading / error ────────── */
  if (authStatus === "loading" || dash.status === "loading")
    return <FullCenter>Yükleniyor…</FullCenter>;

  if (dash.error)
    return <FullCenter className="text-red-600">{dash.error}</FullCenter>;

  /* METRİK KARTLARI */
  const totalCards = dash.cardCount;
  const totalReads = dash.readCountByCard.reduce((s, x) => s + x.totalCount, 0);

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<BookOpen />}
            label="Toplam Kart"
            value={totalCards}
          />
          <StatCard
            icon={<ClipboardList />}
            label="Toplam Okuma"
            value={totalReads}
          />
          <StatCard
            icon={pctChange >= 0 ? <TrendingUp /> : <TrendingDown />}
            label="Yorum Değişimi (Önceki Haftaya Göre)"
            value={`${pctChange >= 0 ? "+" : ""}${pctChange.toFixed(1)} %`}
          />
        </div>
        {/* Radar Chart */}
        {radarCats.length > 0 && radarSeries.length > 0 && (
          <SectionCard
            className="lg:col-span-12"
            title="Şube Karşılaştırmaları"
            icon={<BarChart2 />}
          >
            {/* dış kutu — içeriği ortalamak için flex  */}
            <div className="flex justify-center">
              {/* gerçek grafik alanı */}
              <div className="flex justify-center h-[260px] sm:h-[500px] max-w-[780px] w-full">
                <RadarMultiChart labels={radarCats} series={radarSeries} />
              </div>
            </div>
          </SectionCard>
        )}
        {/* ───── STAT CARDS ───── */}

        {/* ───── MAIN GRID ───── */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Kart grafiği */}
          <SectionCard
            className="lg:col-span-6"
            title="Kart Başına Okuma"
            icon={<BarChart2 />}
            action={<FilterTabs value={filter} onChange={setFilter} />}
          >
            {chartData.length ? (
              <BarChart data={chartData} />
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                Kartınız bulunmamaktadır
              </div>
            )}
          </SectionCard>

          {/* En çok aspect */}
          <SectionCard
            className="lg:col-span-6"
            title="En Çok Geçen 10 Aspect"
            icon={<MessageSquareText />}
            action={
              topAspects.length ? (
                <Link href="/aspects" passHref>
                  <Button size="sm" variant="ghost">
                    Detay
                  </Button>
                </Link>
              ) : null
            }
          >
            <TopAspectBars data={aspectChart} />
          </SectionCard>

          {/* Yeni aspect listesi */}
          <SectionCard
            className="lg:col-span-4"
            title="Yeni Aspect'ler"
            icon={<Sparkles />}
          >
            {recentAspects.length ? (
              <ul className="space-y-1">
                {recentAspects.map((a) => {
                  /* --- pozitif / negatif sayıları hesapla --- */
                  let pos = 0,
                    neg = 0;
                  a.reviews.forEach((r) =>
                    r.aspects?.forEach((as) => {
                      if (as.aspect === a.text) {
                        if (as.sentiment === "positive") pos += 1;
                        else if (as.sentiment === "negative") neg += 1;
                      }
                    }),
                  );

                  /* --- renk seç --- */
                  const color =
                    pos === neg
                      ? "bg-yellow-100 text-yellow-800"
                      : pos > neg
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800";

                  return (
                    <li
                      key={a.id}
                      onClick={() => setOpenAspectId(a.id)}
                      className={`flex cursor-pointer items-center justify-between rounded px-2 py-1 hover:opacity-90 ${color}`}
                    >
                      <span className="truncate font-medium">{a.text}</span>
                      <span className="text-xs">
                        ✔️ {pos} | ❌ {neg}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <NoData />
            )}
          </SectionCard>

          {/* Son yorumlar */}
          <SectionCard className="lg:col-span-8" title="Son Yorumlar">
            <ReviewTable reviews={lastReviews} />
          </SectionCard>
        </div>

        {/* Son okumalar */}
        <SectionCard className="lg:col-span-12" title="Son Okumalar (20)">
          <ReadTable rows={rows} nameMap={nameMap} />
        </SectionCard>

        {aspectCompare && (
          <SectionCard
            className="lg:col-span-12"
            title="Aspect Karşılaştırma (İşletmeler)"
            icon={<BarChart2 />}
          >
            <AspectCompareTable
              data={aspectCompare}
              dropdownOptions={storedBusinesses}
              selectedIds={selectedIds}
              onChange={setSelectedIds}
            />
          </SectionCard>
        )}
      </div>

      {/* ───── Aspect Modal ───── */}
      {openAspectId != null && (
        <AspectDialog
          aspect={newAspects.find((x) => x.id === openAspectId)!}
          onClose={() => setOpenAspectId(null)}
        />
      )}
    </>
  );
}

/* ================================================================= */
/*                           SUB-COMPONENTS                          */
/* ================================================================= */

type StatValue = number | string; /* ✨ EKLE */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: StatValue;
  icon: React.ReactNode;
}) {
  const isPct = typeof value === "string" && value.includes("%"); /* ✨ EKLE */
  const color = isPct
    ? value.startsWith("+")
      ? "text-emerald-600"
      : "text-red-600"
    : "text-primary";

  return (
    <Card className="flex items-center space-x-3 p-4">
      <div className={color}>{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
    </Card>
  );
}

function SectionCard({
  title,
  children,
  icon,
  action,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          {icon && <span className="text-primary">{icon}</span>}
          <CardTitle>{title}</CardTitle>
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function FilterTabs({
  value,
  onChange,
}: {
  value: "all" | "daily" | "weekly";
  onChange: (v: "all" | "daily" | "weekly") => void;
}) {
  return (
    <div className="inline-flex rounded-md border p-1">
      {(["all", "daily", "weekly"] as const).map((k) => (
        <Button
          key={k}
          size="sm"
          variant={value === k ? "secondary" : "ghost"}
          onClick={() => onChange(k)}
        >
          {k === "all" ? "Tümü" : k === "daily" ? "Günlük" : "Haftalık"}
        </Button>
      ))}
    </div>
  );
}

/* ---------- tablolar ---------- */

function ReadTable({
  rows,
  nameMap,
}: {
  rows: { id: number; cardId: number; readAt: string; userAgent: string }[];
  nameMap: Record<number, string>;
}) {
  if (!rows.length) return <NoData />;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Kart</TableHead>
          <TableHead>Tarih</TableHead>
          <TableHead>Cihaz</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>{r.id}</TableCell>
            <TableCell>
              <Link
                href={`kartlarim/${r.cardId}`}
                className="underline text-primary"
              >
                {nameMap[r.cardId] ?? `#${r.cardId}`}
              </Link>
            </TableCell>
            <TableCell>{fmt(r.readAt)}</TableCell>
            <TableCell className="max-w-[160px] truncate">
              {r.userAgent}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ReviewTable({
  reviews,
}: {
  reviews: {
    id: number;
    name: string;
    text: string;
    publishedAtDate: string;
    stars: number;
  }[];
}) {
  if (!reviews.length) return <NoData />;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>İsim</TableHead>
          <TableHead>Yorum</TableHead>
          <TableHead>Tarih</TableHead>
          <TableHead>Puan</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reviews.slice(0, 10).map((v) => (
          <TableRow key={v.id}>
            <TableCell>{v.name}</TableCell>
            <TableCell className="max-w-[220px] truncate">{v.text}</TableCell>
            <TableCell>{fmt(v.publishedAtDate)}</TableCell>
            <TableCell>{"★".repeat(v.stars)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/* ---------- Aspect Dialog ---------- */

/* ---------- Aspect Compare Table ---------- */
function AspectCompareTable({
  data,
  dropdownOptions = [], // 👈 yeni
  selectedIds,
  onChange,
}: {
  data: {
    businessNamesWithIds: { id: number; name: string }[];
    datas: {
      aspect: string;
      stats: Record<
        number,
        { positive: number; negative: number; neutral: number }
      >;
    }[];
  };
  dropdownOptions?: { id: number; name: string }[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const { datas } = data;

  const dropdownList = dropdownOptions;
  const businessNamesWithIds = data.businessNamesWithIds.length
    ? data.businessNamesWithIds
    : dropdownList;

  /* hücre helper aynı ‥‥ */
  /* ----------------------------------------------------- */
  /*  Pozitif-oranına göre renkli progress-bar + sayılar    */
  /* ----------------------------------------------------- */
  const Cell = ({
    s,
  }: {
    s: { positive: number; negative: number; neutral: number };
  }) => {
    const total = s.positive + s.negative + s.neutral || 1; // 0 bölmeyi önle
    const pct = (s.positive / total) * 100;

    /* Renk eşikleri:  <30% kırmızı, 30-70% sarı, ≥70% yeşil */
    const barColor =
      pct < 30 ? "bg-rose-500" : pct < 70 ? "bg-yellow-500" : "bg-emerald-500";

    return (
      <>
        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
          <div
            style={{ width: `${pct}%` }}
            className={`h-full transition-all duration-500 ${barColor}`}
          />
        </div>

        {/* Alttaki sayılar */}
        <div className="mt-0.5 text-[10px] text-center text-gray-600">
          ✔️ {s.positive} | ❌ {s.negative} | ➖ {s.neutral}
        </div>
      </>
    );
  };

  /* ---------- render ---------- */
  return (
    <div className="max-w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              colSpan={businessNamesWithIds.length + 1 /* Aspect sütunu */}
            >
              <div className="flex items-center gap-3">
                {/* Aç/kapa butonu */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      Şube Seç&nbsp;
                      <span className="font-semibold">
                        ({selectedIds.length || businessNamesWithIds.length}/
                        {businessNamesWithIds.length})
                      </span>
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-60 p-2 space-y-1">
                    {dropdownList.map((b) => {
                      const allIds = businessNamesWithIds.map((x) => x.id);
                      const everything = selectedIds.length === 0;
                      const effectiveCount = everything
                        ? allIds.length
                        : selectedIds.length;
                      const checked = everything || selectedIds.includes(b.id);

                      /* 🔒 min-2 */
                      const disableUncheck = checked && effectiveCount <= 2;

                      return (
                        <label
                          key={b.id}
                          className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={checked}
                            disabled={disableUncheck}
                            onCheckedChange={(isOn) => {
                              let next: number[];

                              if (isOn) {
                                /* ➕ işaretle */
                                if (everything) return; // zaten açık
                                next = [...new Set([...selectedIds, b.id])];
                              } else {
                                /* ➖ kaldır */
                                next = (
                                  everything ? allIds : selectedIds
                                ).filter((id) => id !== b.id);
                                if (next.length < 2) return; // min-2 koru
                              }

                              onChange(next);
                            }}
                          />
                          {b.name}
                        </label>
                      );
                    })}

                    {/* ayırıcı */}
                    <div className="border-t my-1" />

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => onChange([])} // boş → hepsi
                    >
                      Tümünü Göster
                    </Button>
                  </PopoverContent>
                </Popover>

                {/* seçili adları “chip” olarak göstermek isterseniz: */}
                {selectedIds.length !== 0 &&
                  businessNamesWithIds
                    .filter((b) => selectedIds.includes(b.id))
                    .slice(0, 3) /* ilk 3 chip */
                    .map((b) => (
                      <span
                        key={b.id}
                        className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                      >
                        {b.name}
                      </span>
                    ))}
                {selectedIds.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{selectedIds.length - 3} diğer
                  </span>
                )}
              </div>
            </TableHead>
          </TableRow>

          {/* ---- 2. satır: normal başlık ---- */}
          <TableRow>
            <TableHead>Aspect</TableHead>
            {businessNamesWithIds.map((b) => (
              <TableHead key={b.id} className="text-center">
                {b.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {datas.map(({ aspect, stats }) => {
            const total = Object.values(stats).reduce(
              (a, cur) => ({
                positive: a.positive + cur.positive,
                negative: a.negative + cur.negative,
                neutral: a.neutral + cur.neutral,
              }),
              { positive: 0, negative: 0, neutral: 0 },
            );

            return (
              <TableRow key={aspect}>
                {/* kelime + toplam bar hemen altında */}
                <TableCell className="py-1 px-2 w-44">
                  <div className="font-medium">{aspect}</div>
                  <div className="mt-1">
                    <Cell s={total} />
                  </div>
                </TableCell>

                {businessNamesWithIds.map((b) => (
                  <TableCell key={b.id} className="py-1 px-2">
                    <Cell
                      s={
                        stats[b.id] ?? { positive: 0, negative: 0, neutral: 0 }
                      }
                    />
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function AspectDialog({
  aspect,
  onClose,
}: {
  aspect: {
    text: string;
    count: number;
    reviews: {
      id: number;
      text: string;
      stars: number;
      publishedAtDate: string;
      aspects?: {
        id: number;
        aspect: string;
        sentiment: "positive" | "neutral" | "negative";
        category: string;
      }[];
    }[];
  };
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <span className="text-lg font-medium">{aspect.text}</span>{" "}
          <span className="text-muted-foreground">— {aspect.count} yorum</span>
        </DialogHeader>

        <ul className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {aspect.reviews.map((r) => (
            <li
              key={r.id}
              className="rounded border p-3 text-sm leading-relaxed"
            >
              <p className="mb-2">
                {r.aspects ? highlightAspects(r.text, r.aspects) : r.text}
              </p>

              {r.aspects && (
                <ul className="mb-2 flex flex-wrap gap-1">
                  {r.aspects.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/aspects/${a.id}`}
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          pill[a.sentiment]
                        }`}
                      >
                        {a.aspect}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <span className="text-xs text-muted-foreground">
                {fmt(r.publishedAtDate)} — {"★".repeat(r.stars)}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- helpers ---------- */
const NoData = () => <p className="text-sm text-muted-foreground">Veri yok.</p>;

function FullCenter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex h-screen items-center justify-center text-lg ${className}`}
    >
      {children}
    </div>
  );
}
