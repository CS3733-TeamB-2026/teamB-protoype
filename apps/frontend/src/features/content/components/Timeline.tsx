import { formatDistanceToNow, format, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns"

interface ContentTimelineProps {
    uploaded: string | Date
    expiration: string | Date | null
    lastModified?: string | Date
}

export function Timeline({ uploaded, expiration, lastModified }: ContentTimelineProps) {
    const start = new Date(uploaded)
    const end = expiration ? new Date(expiration) : null
    const now = new Date()

    const totalMs = end ? end.getTime() - start.getTime() : null
    const elapsedMs = now.getTime() - start.getTime()

    const progressPct = totalMs
        ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100))
        : null

    const isExpired = end ? now > end : false
    const daysLeft = end ? differenceInDays(end, now) : null

    const events = end
        ? [
            { label: "Last Modified", date: start, pct: 0 },
            ...(lastModified &&
            new Date(lastModified).getTime() !== start.getTime()
                ? [
                    {
                        label: "Modified",
                        date: new Date(lastModified),
                        pct: totalMs
                            ? Math.min(
                                100,
                                Math.max(
                                    0,
                                    ((new Date(lastModified).getTime() -
                                            start.getTime()) /
                                        totalMs) *
                                    100
                                )
                            )
                            : 30,
                    },
                ]
                : []),
            { label: "Expires", date: end, pct: 100 },
        ]
        : [{ label: "Uploaded", date: start, pct: 50 }]

    return (
        <div className="py-6 px-1 select-none ml-20 mr-20">
            <div className="relative h-10 flex items-center">

                {/* Status (centered above timeline) */}
                {end ? (
                    <p
                        className={`absolute -top-5 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap ${
                            isExpired
                                ? "text-destructive"
                                : "text-muted-foreground"
                        }`}>
                        {isExpired
                            ? `Expired ${formatDistanceToNow(end)} ago`
                            : daysLeft! >= 1
                                ? `Expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`
                                : differenceInHours(end, now) >= 1
                                    ? `Expires in ${differenceInHours(end, now)} hour${differenceInHours(end, now) !== 1 ? "s" : ""}`
                                    : `Expires in ${differenceInMinutes(end, now)} minute${differenceInMinutes(end, now) !== 1 ? "s" : ""}`}
                    </p>
                ) : (
                    <p className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
                        No expiration set
                    </p>
                )}

                {/* Track */}
                {end && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-primary/10 rounded-full" />
                )}

                {/* Progress */}
                {end && (
                    <div
                        className={`absolute top-1/2 -translate-y-1/2 h-1 rounded-full transition-all ${
                            isExpired ? "bg-destructive/40 right-0" : "bg-primary/40 left-0"
                        }`}
                        style={
                            isExpired
                                ? { width: "100%", right: 0 }   // always full when expired
                                : progressPct !== null
                                    ? { width: `${progressPct}%`, left: 0 }
                                    : undefined
                        }
                    />
                )}

                {/* Dots */}
                {events.map((ev) => (
                    <div
                        key={ev.label}
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                        style={{ left: `${ev.pct}%` }}>
                        <div
                            className={`w-3 h-3 rounded-full border-2 z-10 ${
                                ev.label === "Expires" && isExpired
                                    ? "bg-destructive border-destructive"
                                    : ev.label === "Expires"
                                        ? "bg-background border-border"
                                        : "bg-primary border-primary"
                            }`}/>
                    </div>
                ))}

                {/* Today marker */}
                {progressPct !== null &&
                    end &&
                    !isExpired &&
                    progressPct > 0 &&
                    progressPct < 100 && (
                        <div
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
                            style={{ left: `${progressPct}%` }}>
                            <div className="w-2.5 h-2.5 rounded-full bg-foreground ring-2 ring-background" />
                        </div>
                    )}
            </div>

            {/* Labels */}
            <div className="relative h-6 mt-1">
                {events.map((ev) => (
                    <div
                        key={ev.label}
                        className="absolute -translate-x-1/2 text-[11px] text-muted-foreground text-center whitespace-nowrap"
                        style={{ left: `${ev.pct}%` }}>
                        <span className="font-medium text-foreground">
                            {ev.label}
                        </span>
                        <br />
                        {format(ev.date, "MMM d, yyyy")}
                    </div>
                ))}
            </div>
        </div>
    )
}