// src/types/reports.ts

export interface ReportSummary {
    id: number;
    meta: {
        generatedAt: string;
        generatedDate: string;
        totalReviews: number;
        reportType: string;
        weekInfo: {
            weekNumber: number;
            dateRange: string;
            startDate: string;
            endDate: string;
        };
    };
}

export interface ReportDetail extends ReportSummary {
    summary: {
        description: string;
        content: string;
    };
    aspectAnalysis: {
        description: string;
        aspects: Record<
            string,
            { positive: number; negative: number; neutral: number; totalMentions: number }
        >;
    };
    sentimentDistribution: {
        description: string;
        stats: { positive: number; negative: number; neutral: number };
    };
    recommendations: {
        description: string;
        items: string[];
    };
    originalData: Array<{
        id: number;
        text: string;
        publishedAtDate: string;
        sentiment: Array<{ aspect: string; sentiment: 'Positive' | 'Negative' | 'Neutral' }>;
    }>;
    aiGeneratedReport: string;
}
