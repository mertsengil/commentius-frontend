/* components/dashboard/cards/category-card.tsx */
'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
    getGaugeData,
    GRADIENT_ARCS,
    GRADIENT_COLORS,
} from '@/helpers/category-metrics';
import { useInViewport } from '@/lib/hooks';
import { GaugeCircle } from 'lucide-react';

const GaugeChart = dynamic(() => import('react-gauge-chart'), { ssr: false });

/* --------- Sabitler --------- */

const catEmoji: Record<string, string> = {
    ambience: '🎶', drink: '🍹', food: '🍽️', hygiene: '🧼',
    location: '📍', other: '🏷️', price: '💸', service: '🛎️',
    view: '🌅', waiter: '🤵',
};

const badgeTone = (p: number) =>
    p > 0.65
        ? 'bg-lime-500/20 text-lime-700 dark:text-lime-300'
        : p > 0.35
            ? 'bg-amber-300/25 text-amber-600 dark:text-amber-300'
            : 'bg-rose-500/25 text-rose-600 dark:text-rose-400';

const perfTone = (p: number) =>
    p > 0.65
        ? 'text-lime-600 dark:text-lime-400'
        : p > 0.35
            ? 'text-amber-500 dark:text-amber-400'
            : 'text-rose-600 dark:text-rose-400';

const mini =
    'px-1.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap';

interface Props { cat: CategorySummary }

/* --------- Bileşen --------- */

export default function CategoryCard({ cat }: Props) {
    const { percent } = getGaugeData(cat);               // nötr hariç
    const { ref, inView } = useInViewport<HTMLAnchorElement>();
    const pctText = `${Math.round(percent * 100)}%`;
    const totalAspects =
        cat.positiveAspects + cat.neutralAspects + cat.negativeAspects;

    return (
        <Link
            ref={ref}
            href={`/dashboard/categories/${encodeURIComponent(cat.category)}`}
            className="block focus:outline-none"
        >
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: .35, ease: 'easeOut' }}
                whileHover={{ y: -6, boxShadow: '0 12px 28px rgba(0,0,0,.14)', rotateX: 1 }}
                className="
          rounded-2xl overflow-visible
          ring-1 ring-transparent bg-white/70 dark:bg-slate-900/70 backdrop-blur-md
          transition-all duration-300
          hover:ring-2 hover:ring-gradient-to-tr hover:from-green-400 hover:to-cyan-500
          dark:hover:ring-pink-500/50
        "
            >
                {/* ---------- Başlık ---------- */}
                <header className="flex justify-between items-center px-4 pt-4">
                    <p className="font-semibold capitalize flex items-center gap-1
                        text-slate-900 dark:text-slate-100 tracking-tight">
                        {catEmoji[cat.category] ?? ''} {cat.category}
                    </p>
                    <Badge className={badgeTone(percent)}>{totalAspects} aspect</Badge>
                </header>

                <hr className="mx-4 mt-2 mb-3 border-slate-200/50 dark:border-slate-700/50" />

                {/* ---------- İçerik ---------- */}
                <div className="px-4 pb-5 sm:pb-6 space-y-3">
                    <div className="relative w-full h-[clamp(8rem,18vw,12rem)]">
                        {inView && (
                            <GaugeChart
                                id={`gauge-${cat.category}`}
                                nrOfLevels={GRADIENT_COLORS.length * 6}
                                arcsLength={GRADIENT_ARCS}
                                colors={GRADIENT_COLORS}
                                percent={percent}
                                needleScale={0.45}
                                hideText
                                animate
                                animDelay={0}
                                className="w-full h-full"
                            />
                        )}

                        {/* Sağ-üst köşe performans etiketi — artık Header’la çakışmaz */}
                        <div className={`
              absolute right-1.5 top-1.5 z-10 flex items-center gap-0.5
              rounded-md bg-white/75 dark:bg-slate-800/60 backdrop-blur
              px-1.5 py-0.5 text-[11px] font-bold ${perfTone(percent)}
            `}>
                            <GaugeCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                            {pctText}
                        </div>
                    </div>

                    {/* Negatif • Nötr • Pozitif */}
                    <div className="grid grid-cols-3 gap-x-2 text-center">
                        <span className={`${mini} bg-rose-500/15 text-rose-700 dark:text-rose-400`}>
                            -{cat.negativeReviews}
                        </span>
                        <span className={`${mini} bg-slate-500/15 text-slate-700 dark:text-slate-400`}>
                            {cat.neutralReviews}
                        </span>
                        <span className={`${mini} bg-lime-500/15 text-lime-700 dark:text-lime-300`}>
                            +{cat.positiveReviews}
                        </span>
                    </div>

                    <p className="text-[11px] text-right text-slate-500 dark:text-slate-400">
                        İnceleme: {cat.reviewCount}
                    </p>
                </div>
            </motion.div>
        </Link>
    );
}
