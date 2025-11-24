'use client';

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
    fetchReports,
    fetchReportDetail,
    selectReportsState,
} from '@/features/reports/reportsSlice';
import { Button } from '@/components/ui/button';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportsDocument } from '@/components/reports/ReportsDocument';

export default function ReportsPage() {
    const dispatch = useAppDispatch();
    const { list } = useAppSelector(selectReportsState);

    useEffect(() => {
        dispatch(fetchReports());
    }, [dispatch]);

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">Raporlar</h1>
            {list.map((r) => (
                <div key={r.id} className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="font-semibold">{r.meta.reportType}</h2>
                        <p className="text-sm">
                            Hafta: {r.meta.weekInfo.dateRange}
                        </p>
                    </div>

                    {/* Detail fetch & PDFDownloadLink */}
                    <PDFDownloadLink
                        document={<ReportsDocument detail={r} />}
                        fileName={`rapor-${r.id}.pdf`}
                        className="inline-block"
                    >
                        {({ loading }) =>
                            loading ? (
                                <Button disabled>Hazırlanıyor...</Button>
                            ) : (
                                <Button>PDF İndir</Button>
                            )
                        }
                    </PDFDownloadLink>
                </div>
            ))}
        </div>
    );
}
