'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    useDraggable,
    useDroppable,
    closestCenter,
} from '@dnd-kit/core';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);
const Radar = dynamic(() => import('react-chartjs-2').then(m => m.Radar), { ssr: false });

// Kategori ve veri tanımları
const ALL_CATEGORIES = ['Genel', 'Yiyecek', 'Içecek', 'Hijyen', 'Servis', 'Değer', 'Ambiyans', 'Sunum', 'Atmosfer'] as const;
type Category = typeof ALL_CATEGORIES[number];
const aspects = ['Servis', 'Lezzet', 'Ambiyans', 'Temizlik', 'Değer', 'Hız', 'Sunum', 'Sıcaklık'];
const categoryData: Record<Category, number[]> = {
    Genel: [4.2, 4.5, 4.0, 4.7, 4.1, 4.3, 4.4, 4.0],
    Yiyecek: [4.0, 4.7, 3.8, 4.2, 4.1, 4.3, 4.6, 4.0],
    Içecek: [3.8, 4.2, 3.5, 4.3, 4.0, 4.1, 3.9, 3.7],
    Hijyen: [4.5, 4.2, 4.8, 4.9, 4.6, 4.3, 4.1, 4.4],
    Servis: [4.8, 4.5, 4.6, 4.5, 4.3, 4.7, 4.2, 4.4],
    Değer: [4.1, 4.0, 4.2, 4.1, 3.9, 4.0, 4.3, 4.2],
    Ambiyans: [4.3, 4.1, 4.4, 4.0, 4.2, 4.1, 4.0, 4.3],
    Sunum: [4.1, 4.3, 4.0, 4.4, 4.2, 4.0, 4.5, 4.1],
    Atmosfer: [4.1, 4.2, 4.4, 4.0, 4.1, 4.3, 4.2, 4.0],
};
const COLORS = [
    '54,162,235', '255,99,132', '255,206,86', '75,192,192',
    '153,102,255', '255,159,64', '99,255,132', '132,99,255',
];

interface Group {
    id: string;
    categories: Category[];
}

export default function MergeableRadar() {
    // Başlangıçta sadece “Genel” kartı
    const [groups, setGroups] = useState<Group[]>([
        { id: 'Genel', categories: ['Genel'] },
    ]);

    const sensors = useSensors(useSensor(PointerSensor));

    // Yeni kategori kartı eklemek için
    const addCategory = (cat: Category) => {
        if (groups.some(g => g.id === cat)) return;
        setGroups(g => [...g, { id: cat, categories: [cat] }]);
    };

    // Kartı başka bir kartın üstüne bırakınca merge, "split-zone" a bırakınca split
    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over) return;

        const srcId = active.id as string;
        const overId = over.id as string;

        // Split-zone'a bırakıldıysa parçala
        if (overId === 'split-zone') {
            setGroups(g => {
                const grp = g.find(x => x.id === srcId);
                if (!grp) return g;
                const remaining = g.filter(x => x.id !== srcId);
                const restored = grp.categories
                    .filter(cat => !remaining.some(x => x.id === cat))
                    .map(cat => ({ id: cat, categories: [cat] as Category[] }));
                return [...remaining, ...restored];
            });
            return;
        }

        // Aynı karta bırakılmadıysa merge et
        if (srcId !== overId && groups.some(x => x.id === overId)) {
            setGroups(g => {
                const src = g.find(x => x.id === srcId)!;
                return g
                    .filter(x => x.id !== srcId)
                    .map(x =>
                        x.id === overId
                            ? { ...x, categories: Array.from(new Set([...x.categories, ...src.categories])) }
                            : x
                    );
            });
        }
    };

    // Kartları render eder
    const renderGroups = () =>
        groups.map((grp, gi) => (
            <Droppable key={grp.id} id={grp.id}>
                <Draggable id={grp.id}>
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle className="truncate">{grp.categories.join(' + ')}</CardTitle>
                        </CardHeader>
                        <CardContent className="h-64">
                            <Radar
                                data={{
                                    labels: aspects,
                                    datasets: grp.categories.map((cat, ci) => ({
                                        label: cat,
                                        data: categoryData[cat],
                                        fill: true,
                                        backgroundColor: `rgba(${COLORS[ci % COLORS.length]},0.2)`,
                                        borderColor: `rgba(${COLORS[ci % COLORS.length]},1)`,
                                        pointBackgroundColor: `rgba(${COLORS[ci % COLORS.length]},1)`,
                                    })),
                                }}
                                options={{
                                    maintainAspectRatio: false,
                                    scales: {
                                        r: { suggestedMin: 0, suggestedMax: 5, ticks: { stepSize: 1 } },
                                    },
                                    plugins: { legend: { position: 'top' as const } },
                                }}
                            />
                        </CardContent>
                    </Card>
                </Draggable>
            </Droppable>
        ));

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            {/* Kategori seçim butonları */}
            <div className="flex flex-wrap gap-2 mb-4">
                {ALL_CATEGORIES.map(cat => (
                    <Button
                        key={cat}
                        size="sm"
                        variant={groups.some(g => g.id === cat) ? undefined : 'outline'}
                        onClick={() => addCategory(cat)}
                    >
                        {cat}
                    </Button>
                ))}
            </div>

            {/* Kartlar: 2 sütun layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderGroups()}
            </div>

            {/* Ayırma bölgesi */}
            <div className="mt-16 p-16 text-gray-500">
                <Droppable id="split-zone">
                    <div className="mt-16 p-16 text-center border-2 border-dashed rounded text-gray-500">
                        Kartı buraya sürükleyerek "ayır" işlemi yapabilirsiniz
                    </div>
                </Droppable>
            </div >
        </DndContext >
    );
}

// Draggable bileşeni
function Draggable({ id, children }: { id: string; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
    const style = transform
        ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` }
        : undefined;
    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            {children}
        </div>
    );
}

// Droppable bileşeni
function Droppable({ id, children }: { id: string; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            style={{
                padding: isOver ? 4 : 0,
                border: isOver ? '2px dashed #4A90E2' : undefined,
                borderRadius: isOver ? 4 : undefined,
            }}
        >
            {children}
        </div>
    );
}
