/* ------------------------------------------------------------------ */
/*  components/ui/RadarMultiChart.tsx                                 */
/* ------------------------------------------------------------------ */
'use client';

import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

/* ------------------------------------------------------------------ */
/*  Ölçek & element register                                          */
/* ------------------------------------------------------------------ */
ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
);

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
export interface RadarSeries {
    /** Eşsiz id (işletme veya kart id’si)  */
    id: number;
    /** Legend’da gösterilecek ad          */
    name: string;
    /** Her kategori için 0-1 arası değeri */
    values: number[];
}

interface Props {
    /** Eksen etiketleri - sırası `series[*].values` ile aynı  */
    labels: string[];
    /** Birden çok işletme / kart verisi                       */
    series: RadarSeries[];
}

/* ------------------------------------------------------------------ */
/*  Yardımcı: otomatik renk paleti                                    */
/* ------------------------------------------------------------------ */
const palette = [
    '#3b82f6', // mavi
    '#10b981', // yeşil
    '#f59e0b', // turuncu
    '#ef4444', // kırmızı
    '#8b5cf6', // mor
    '#0ea5e9', // cyan
    '#f43f5e', // rose
];

function pickClr(i: number) {
    const c = palette[i % palette.length];
    return {
        borderColor: c,
        backgroundColor: c + '33', // %20 opak
        pointBackgroundColor: c,
        pointBorderColor: '#ffffff',
    };
}

/* ------------------------------------------------------------------ */
/*  Bileşen                                                            */
/* ------------------------------------------------------------------ */
export default function RadarMultiChart({ labels, series }: Props) {
    /* Chart.js dataset formatına dönüştür */
    const datasets = series.map((s, i) => ({
        label: s.name,
        data: s.values.map(v => Number((v * 100).toFixed(1))), // yüzdeye çevir
        ...pickClr(i),
        fill: true,
        tension: 0.3,
    }));

    const data = { labels, datasets };

    const options: ChartJS.ChartOptions<'radar'> = {
        responsive: true,
        plugins: {
            legend: { position: 'top' as const },
            tooltip: {
                callbacks: {
                    label: ({ dataset, dataIndex }) =>
                        `${dataset.label}: ${dataset.data[dataIndex]}%`,
                },
            },
        },
        scales: {
            r: {
                suggestedMin: 0,
                suggestedMax: 100,
                ticks: {
                    callback: (v) => v + '%',
                    backdropColor: 'transparent',
                },
                pointLabels: {
                    font: { size: 11 },
                },
                grid: { circular: true },
            },
        },
    };

    return <Radar data={data} options={options} />;
}
