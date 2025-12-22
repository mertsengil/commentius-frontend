'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    Loader2, ArrowUpRight, Star, ExternalLink, Pencil, Save, X
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import {
    requestAiReply,
    selectReviewsState,
} from '@/features/reviews/reviewsSlice'
import { updateAiReply } from '@/features/reviews/reviewsSlice'
import { selectAuthUser } from '@/features/auth/authSlice'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    HoverCard, HoverCardTrigger, HoverCardContent,
} from '@/components/ui/hover-card'
import { highlightAspects, catEmoji } from './helpers'

/* ------------- tipler ------------- */
type Review = { /* …aynı… */ }
interface Props { review: Review }

/* ------------- bileşen ------------- */
export default function ReviewCard({ review }: Props) {
    const dispatch = useAppDispatch()
    const { generating, updating } = useAppSelector(selectReviewsState)
    const tokens = useAppSelector(selectAuthUser)?.reviewReplyTokens ?? 0

    const latest = review.replies?.[0]
    const genDisable = generating.includes(review.id) || tokens === 0
    const updDisable = updating?.includes(latest?.id ?? -1)

    /* -------- edit mode state -------- */
    const [editMode, setEditMode] = useState(false)
    const [editText, setEditText] = useState(latest?.content ?? '')

    /* --------- avatar vs. --------- */
    const [imgErr, setImgErr] = useState(false)
    const displayName = review.name?.trim() || 'Anonim'
    const initials = displayName.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)

    const Stars = ({ v }: { v: number | null }) => (
        <div className="flex items-center space-x-0.5 pt-1">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} strokeWidth={1.5}
                    fill={i < (v ?? 0) ? 'currentColor' : 'none'}
                    className={i < (v ?? 0) ? 'text-yellow-500' : 'text-muted-foreground'}
                />
            ))}
        </div>
    )

    const Platform = () => review.type
        ? <Badge variant="outline" className="text-[10px]">{review.type[0].toUpperCase() + review.type.slice(1)}</Badge>
        : null

    const CategoryBadge = (c?: string) => c ? (
        <Link href={`/dashboard/categories/${encodeURIComponent(c)}`} key={c}>
            <Badge variant="secondary" className="hover:bg-muted">
                {(catEmoji[c.toLowerCase()] ?? '') + ' ' + c}
            </Badge>
        </Link>
    ) : null

    const cats = [...new Set((review.aspects ?? []).map(a => a.category).filter(Boolean))]

    /* ------------- render ------------- */
    return (
        <Card key={review.id} className="shadow-sm">
            {/* Header */}
            <CardHeader className="flex justify-between">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center space-x-3">
                        {/* avatar */}
                        <div className="relative w-10 h-10">
                            {!imgErr && review.reviewerPhotoUrl
                                ? <img src={review.reviewerPhotoUrl} alt={review.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                    onError={() => setImgErr(true)} />
                                : <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                                    {initials}
                                </div>}
                        </div>
                        {/* name/date */}
                        <div>
                            <p className="font-medium">{displayName}</p>
                            <p className="text-xs text-muted-foreground">
                                {new Date(review.publishedAtDate).toLocaleString('tr-TR', {
                                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                                })}
                            </p>
                        </div>
                        <Stars v={review.stars} />
                        <Platform />
                    </div>

                    {/* AI reply button */}
                    <Button size="sm" variant="secondary"
                        disabled={genDisable}
                        onClick={() => dispatch(requestAiReply(review.id))}
                        className="w-max bg-amber-400 hover:bg-amber-600 text-blue-800 disabled:bg-gray-300 disabled:text-gray-500">
                        {generating.includes(review.id)
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : latest ? <>Kolay AI Yanıtı Değiştir&nbsp;<AiCost /></>
                                : <>Kolay AI Yanıtı İste&nbsp;<AiCost /></>}
                    </Button>
                </div>

                {/* categories */}
                <div className="flex flex-wrap gap-1 justify-end">
                    {cats.map(CategoryBadge)}
                </div>
            </CardHeader>

            {/* Content */}
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed">
    {highlightAspects(
        review.textTranslated?.trim() || review.text || '',
        review.aspects ?? []
    )}
</p>

                {/* --- EDIT MODE START --- */}
                {latest && !editMode && (
                    <div className="border-l-2 pl-3 italic text-sm space-y-1">
                        <div className="flex justify-between">
                            <p className="font-semibold">Kolay AI Önerilen Yanıt:</p>
                            <Button variant="ghost" size="icon" onClick={() => {
                                setEditText(latest.content); setEditMode(true)
                            }}>
                                <Pencil className="w-4 h-4" />
                            </Button>
                        </div>
                        <p>{latest.content}</p>
                    </div>
                )}

                {latest && editMode && (
                    <div className="border-l-2 pl-3 italic text-sm space-y-2">
                        <textarea
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            className="w-full p-2 border rounded-md text-sm"
                            rows={3}
                        />
                        <div className="flex gap-2">
                            <Button size="sm" disabled={updDisable}
                                onClick={() => {
                                    dispatch(updateAiReply({
                                        reviewId: review.id,        // ✅
                                        replyId: latest.id,
                                        content: editText
                                    }))
                                    setEditMode(false)
                                }}>
                                {updDisable ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" />Kaydet</>}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>
                                <X className="h-4 w-4 mr-1" /> Vazgeç
                            </Button>
                        </div>
                    </div>
                )}
                {/* --- EDIT MODE END --- */}

                {review.reviewImageUrls?.length && (
                    <div className="mt-2 flex gap-2 overflow-x-auto">
                        {review.reviewImageUrls.map((u, i) => (
                            <img key={i} src={u} alt={`review-${i}`}
                                className="w-24 h-24 object-cover rounded-md" />
                        ))}
                    </div>
                )}

                {review.reviewUrl && (
                    <Button size="sm" variant="outline" asChild className="mt-2">
                        <a href={review.reviewUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1">
                            Yorumu Gör <ExternalLink size={14} />
                        </a>
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}

function AiCost({ n = 1 }: { n?: number }) {
    return (
        <span className="inline-flex items-center gap-0.5">
            <Image src="/images/ai.svg" alt="" width={12} height={12} /> {n}
        </span>
    )
}
