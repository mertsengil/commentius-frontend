import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    BarChart as RCBarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'

type DataPoint = { id: number; name: string; value: number }

type Props = {
    data: DataPoint[]
    onBarClick?: (id: number, datum: DataPoint) => void
}

export default function BarChart({ data, onBarClick }: Props) {
    const router = useRouter()
    const handleClick = useCallback((d: any) => {
        const { id, name, value } = d.payload as DataPoint
        if (onBarClick) {
            return onBarClick(id, { id, name, value })
        }
        router.push(`kartlarim/${id}`)
    }, [onBarClick, router])

    return (
        <ResponsiveContainer width="100%" height={300}>
            <RCBarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                    wrapperClassName="rounded-md border bg-background px-2 py-1 text-xs shadow"
                    wrapperStyle={{ pointerEvents: 'auto' }}
                />
                <Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={handleClick}
                />
            </RCBarChart>
        </ResponsiveContainer>
    )
}
