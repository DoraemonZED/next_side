"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import "./carousel.css"

interface CarouselProps {
  children: React.ReactNode
  className?: string
  autoPlay?: boolean
  autoPlayInterval?: number
  showDots?: boolean
  showArrows?: boolean
  paused?: boolean
}

interface CarouselItemProps {
  children: React.ReactNode
  className?: string
}

function relativePosition(slideIndex: number, activeIndex: number, total: number) {
  let distance = slideIndex - activeIndex
  if (distance > total / 2) distance -= total
  if (distance < -total / 2) distance += total
  if (distance < -1) return -2
  if (distance > 1) return 2
  return distance
}

export function Carousel({
  children,
  className,
  autoPlay = false,
  autoPlayInterval = 6000,
  showDots = true,
  showArrows = true,
  paused = false,
}: CarouselProps) {
  const slides = React.Children.toArray(children)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [interactionPaused, setInteractionPaused] = React.useState(false)
  const touchStart = React.useRef<number | null>(null)
  const total = slides.length

  const goTo = React.useCallback((nextIndex: number) => {
    if (total > 0) setActiveIndex((nextIndex + total) % total)
  }, [total])
  const previous = React.useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo])
  const next = React.useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo])

  React.useEffect(() => {
    if (!autoPlay || paused || interactionPaused || total < 2) return
    const timer = window.setInterval(next, autoPlayInterval)
    return () => window.clearInterval(timer)
  }, [autoPlay, autoPlayInterval, interactionPaused, next, paused, total])

  if (total === 0) return null

  return (
    <section
      aria-label="代表项目"
      aria-roledescription="carousel"
      className={cn("carousel-3d", className)}
      onBlurCapture={() => setInteractionPaused(false)}
      onFocusCapture={() => setInteractionPaused(true)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") previous()
        if (event.key === "ArrowRight") next()
      }}
      onMouseEnter={() => setInteractionPaused(true)}
      onMouseLeave={() => setInteractionPaused(false)}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return
        const delta = event.changedTouches[0].clientX - touchStart.current
        if (Math.abs(delta) > 44) {
          if (delta > 0) previous()
          else next()
        }
        touchStart.current = null
      }}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null
      }}
      tabIndex={0}
    >
      <div className="carousel-3d__stage">
        <div className="carousel-3d__floor" />
        {slides.map((slide, slideIndex) => {
          const position = relativePosition(slideIndex, activeIndex, total)
          const isActive = position === 0
          return (
            <div
              aria-hidden={!isActive}
              className="carousel-3d__slide"
              data-position={position}
              key={slideIndex}
              onClick={() => {
                if (position === -1) previous()
                if (position === 1) next()
              }}
            >
              <div className="carousel-3d__frame">
                {slide}
                {!isActive && <div className="carousel-3d__shade" />}
              </div>
            </div>
          )
        })}

        {showArrows && total > 1 && (
          <div className="carousel-3d__arrows">
            <button aria-label="上一个项目" onClick={previous} type="button">
              <ArrowLeft />
            </button>
            <span><strong>{String(activeIndex + 1).padStart(2, "0")}</strong> / {String(total).padStart(2, "0")}</span>
            <button aria-label="下一个项目" onClick={next} type="button">
              <ArrowRight />
            </button>
          </div>
        )}
      </div>

      {showDots && total > 1 && (
        <div aria-label="选择项目" className="carousel-3d__dots" role="tablist">
          {slides.map((_, slideIndex) => (
            <button
              aria-label={"查看项目 " + (slideIndex + 1)}
              aria-selected={slideIndex === activeIndex}
              className={slideIndex === activeIndex ? "is-active" : ""}
              key={slideIndex}
              onClick={() => goTo(slideIndex)}
              role="tab"
              type="button"
            />
          ))}
        </div>
      )}
    </section>
  )
}

export function CarouselItem({ children, className }: CarouselItemProps) {
  return <article className={cn("h-full w-full", className)}>{children}</article>
}
