export function DottedBackground() {
    return(
        <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
                backgroundImage: `radial-gradient(circle, oklch(0.343 0.07 252.435 / 0.15) 1px, transparent 2px)`,
                backgroundSize: '24px 24px',
            }}
        />
    )
}