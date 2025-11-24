/* src/app/dashboard/categories/page.tsx */
'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
    fetchCategories,
    selectCategoriesState,
} from '@/features/categories/categoriesSlice';
import CategoryCard from '@/components/dashboard/cards/category-card';

export default function CategoriesPage() {
    const dispatch = useAppDispatch();
    const { list, loadingList, listError } = useAppSelector(selectCategoriesState);

    useEffect(() => { dispatch(fetchCategories()); }, [dispatch]);

    if (loadingList)
        return (
            <div className="p-6 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );

    if (listError)
        return <div className="p-6 text-red-600 font-medium">{listError}</div>;

    if (!Array.isArray(list) || list.length === 0)
        return <div className="p-6 text-red-600 font-medium">Kategori verisi alınamadı</div>;

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-2xl font-semibold">Kategoriler</h1>

            {/* xs–lg: auto-fill, xl: tam 5 sütun */}
            <div
                className="
          grid gap-4
          grid-cols-[repeat(auto-fill,minmax(220px,1fr))]
          xl:grid-cols-5
        "
            >
                {list.map(cat => (
                    <CategoryCard key={cat.category} cat={cat} />
                ))}
            </div>
        </div>
    );
}
