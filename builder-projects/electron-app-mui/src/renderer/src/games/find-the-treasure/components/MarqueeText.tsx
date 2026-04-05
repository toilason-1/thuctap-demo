import { Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import Marquee from 'react-fast-marquee'

// MarqueeText.tsx
// MarqueeText.tsx

export function MarqueeText({
  text,
  isActive,
  isHovered = false
}: {
  text: string
  isActive: boolean
  isHovered?: boolean
}): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const [needsMarquee, setNeedsMarquee] = useState(false)

  // Separate "intent to animate" from "actually mounted"
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [isMarqueeMounted, setIsMarqueeMounted] = useState(false)

  // ── Detect if text overflows container ──
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const checkOverflow = (): void => {
      const hasOverflow = el.scrollWidth > el.clientWidth + 2
      setNeedsMarquee(hasOverflow)
    }

    checkOverflow()
    const ro = new ResizeObserver(checkOverflow)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text])

  // ── Control animation intent ──
  useEffect(() => {
    const wantToAnimate = needsMarquee && (isActive || isHovered)
    setShouldAnimate(wantToAnimate)
  }, [needsMarquee, isActive, isHovered])

  // ── Mount Marquee with 1-frame delay to avoid startup flicker ──
  useEffect(() => {
    if (shouldAnimate) {
      // Delay mount by 1 frame: lets browser layout settle first
      const raf = requestAnimationFrame(() => {
        setIsMarqueeMounted(true)
      })
      return () => cancelAnimationFrame(raf)
    } else {
      // Unmount immediately when stopping (no flicker on stop)
      setIsMarqueeMounted(false)
      return
    }
  }, [shouldAnimate])

  // ── Shared container style with right-side fade ──
  const containerStyle: React.CSSProperties = {
    overflow: 'hidden',
    width: '100%',
    maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
    WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)'
  }

  // ── Shared text style ──
  const textStyle = {
    fontSize: '0.75rem',
    color: isActive ? '#6384ff' : 'text.primary',
    fontWeight: isActive ? 600 : 400,
    whiteSpace: 'nowrap',
    display: 'inline-block',
    pr: 6
  }

  return (
    <div ref={containerRef} style={containerStyle}>
      {isMarqueeMounted ? (
        // ── Marquee: Mounted with delay for smooth start ──
        <Marquee
          play={true}
          speed={25}
          gradient={false}
          pauseOnHover={false}
          style={{
            overflow: 'visible',
            willChange: 'transform' // GPU hint for smoother animation
          }}
        >
          <Typography
            variant="caption"
            sx={{
              ...textStyle,
              willChange: 'transform' // GPU hint
            }}
          >
            {text}
          </Typography>
        </Marquee>
      ) : (
        // ── Static: Plain text with fade ──
        <Typography
          variant="caption"
          sx={{
            ...textStyle,
            display: 'block',
            pr: 0,
            // Smooth fade when switching to marquee
            transition: 'opacity 0.1s ease-out',
            opacity: shouldAnimate ? 0 : 1 // Fade out just before marquee appears
          }}
        >
          {text}
        </Typography>
      )}
    </div>
  )
}
