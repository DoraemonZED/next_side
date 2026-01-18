"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CarouselProps {
  children: React.ReactNode
  className?: string
  autoPlay?: boolean
  autoPlayInterval?: number
  showDots?: boolean
  showArrows?: boolean
}

interface CarouselItemProps {
  children: React.ReactNode
  className?: string
}

// 小图相对主图的缩放比例
const SIDE_SCALE = 0.9

export function Carousel({
  children,
  className,
  autoPlay = false,
  autoPlayInterval = 4000,
  showDots = true,
  showArrows = true,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isHovered, setIsHovered] = React.useState(false)
  const [isAnimating, setIsAnimating] = React.useState(false)
  const [animateToIndex, setAnimateToIndex] = React.useState<number | null>(null)
  const [animationStarted, setAnimationStarted] = React.useState(false)
  const childrenArray = React.Children.toArray(children)
  const totalItems = childrenArray.length

  // 获取循环索引
  const getLoopIndex = (index: number) => {
    return ((index % totalItems) + totalItems) % totalItems
  }

  const goToNext = React.useCallback(() => {
    if (isAnimating || totalItems <= 1) return
    setIsAnimating(true)
    setAnimateToIndex(getLoopIndex(currentIndex + 1))
    // 延迟一帧后开始动画，让初始位置先渲染
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimationStarted(true)
      })
    })
    setTimeout(() => {
      setCurrentIndex((prev) => getLoopIndex(prev + 1))
      setAnimateToIndex(null)
      setIsAnimating(false)
      setAnimationStarted(false)
    }, 500)
  }, [isAnimating, totalItems, currentIndex])

  const goToPrev = React.useCallback(() => {
    if (isAnimating || totalItems <= 1) return
    setIsAnimating(true)
    setAnimateToIndex(getLoopIndex(currentIndex - 1))
    // 延迟一帧后开始动画，让初始位置先渲染
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimationStarted(true)
      })
    })
    setTimeout(() => {
      setCurrentIndex((prev) => getLoopIndex(prev - 1))
      setAnimateToIndex(null)
      setIsAnimating(false)
      setAnimationStarted(false)
    }, 500)
  }, [isAnimating, totalItems, currentIndex])

  const goToIndex = React.useCallback((index: number) => {
    if (isAnimating || index === currentIndex) return
    setCurrentIndex(index)
  }, [isAnimating, currentIndex])

  // Auto play
  React.useEffect(() => {
    if (!autoPlay || isHovered || totalItems <= 1 || isAnimating) return

    const interval = setInterval(goToNext, autoPlayInterval)
    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, isHovered, goToNext, totalItems, isAnimating])

  if (totalItems === 0) return null

  // 计算需要渲染的图片
  const prevIndex = getLoopIndex(currentIndex - 1)
  const nextIndex = getLoopIndex(currentIndex + 1)
  const prevPrevIndex = getLoopIndex(currentIndex - 2)
  const nextNextIndex = getLoopIndex(currentIndex + 2)

  // 位置类型
  type Position = 'leftOuter' | 'left' | 'center' | 'right' | 'rightOuter'

  // 根据动画方向决定渲染哪些图片
  const renderItems = () => {
    const items: { index: number; position: Position }[] = [
      { index: prevIndex, position: 'left' },
      { index: currentIndex, position: 'center' },
      { index: nextIndex, position: 'right' },
    ]
    
    // 向右滑动(显示上一张)时，需要左外的图片
    if (animateToIndex === prevIndex) {
      items.unshift({ index: prevPrevIndex, position: 'leftOuter' })
    }
    // 向左滑动(显示下一张)时，需要右外的图片
    if (animateToIndex === nextIndex) {
      items.push({ index: nextNextIndex, position: 'rightOuter' })
    }
    
    return items
  }

  // 计算每个位置的样式
  const getItemStyle = (itemIndex: number, position: Position) => {
    // 判断动画目标
    const isGoingNext = animateToIndex === nextIndex
    const isGoingPrev = animateToIndex === prevIndex

    // 计算当前item应该显示在什么位置
    // 只有当 animationStarted 为 true 时才移动到目标位置
    let targetPosition = position
    if (animationStarted) {
      if (isGoingNext) {
        // 向左滑动：所有图片左移一位
        if (position === 'left') targetPosition = 'leftOuter'
        else if (position === 'center') targetPosition = 'left'
        else if (position === 'right') targetPosition = 'center'
        else if (position === 'rightOuter') targetPosition = 'right'
      } else if (isGoingPrev) {
        // 向右滑动：所有图片右移一位
        if (position === 'leftOuter') targetPosition = 'left'
        else if (position === 'left') targetPosition = 'center'
        else if (position === 'center') targetPosition = 'right'
        else if (position === 'right') targetPosition = 'rightOuter'
      }
    }

    // 位置映射 - 使用left百分比定位
    // 主图宽度50%，间隔约1.5%
    const mainWidth = 50
    const gap = 1.5 // 约10px的间隔（百分比）
    
    // 缩放后的视觉宽度
    const scaledWidth = mainWidth * SIDE_SCALE // 45%
    // 缩放导致的边缘内缩（从中心缩放，每边缩小一半的差值）
    const scaleOffset = (mainWidth - scaledWidth) / 2 // 2.5%
    
    // 主图左边缘位置
    const mainLeft = (100 - mainWidth) / 2 // 25%
    // 主图右边缘位置
    const mainRight = mainLeft + mainWidth // 75%
    
    const positionStyles = {
      leftOuter: { 
        // 左外侧图片：在左侧小图的左边
        left: mainLeft - mainWidth - gap - scaleOffset,
        scale: SIDE_SCALE, 
        opacity: 0, 
        zIndex: 5,
        gradientDir: 'left' as const
      },
      left: { 
        // 左侧小图：紧贴主图左边，考虑缩放后右边缘内缩
        left: mainLeft - mainWidth - gap + scaleOffset,
        scale: SIDE_SCALE, 
        opacity: 1, 
        zIndex: 10,
        gradientDir: 'left' as const
      },
      center: { 
        left: mainLeft,
        scale: 1, 
        opacity: 1, 
        zIndex: 20,
        gradientDir: null
      },
      right: { 
        // 右侧小图：紧贴主图右边，考虑缩放后左边缘内缩
        left: mainRight + gap - scaleOffset,
        scale: SIDE_SCALE, 
        opacity: 1, 
        zIndex: 10,
        gradientDir: 'right' as const
      },
      rightOuter: { 
        // 右外侧图片：在右侧小图的右边
        left: mainRight + mainWidth + gap + scaleOffset,
        scale: SIDE_SCALE, 
        opacity: 0, 
        zIndex: 5,
        gradientDir: 'right' as const
      },
    }

    return positionStyles[targetPosition]
  }

  const items = renderItems()

  return (
    <div
      className={cn("relative group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main container - 使用固定的宽高比确保不同屏幕下比例一致 */}
      <div className="relative rounded-3xl overflow-hidden" style={{ aspectRatio: '2/1' }}>
        {/* 占位元素确定高度 - 基于50%宽度的主图，2:1 的容器比例可以容纳 16:9 的主图加两侧小图 */}
        <div className="absolute inset-0" />
        
        {/* 图片层 */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2" style={{ height: '85%' }}>
          {items.map(({ index, position }) => {
            const style = getItemStyle(index, position)
            const isCenter = style.zIndex === 20
            
            return (
              <div
                key={`item-${index}-${position}`}
                className="absolute top-1/2 transform-gpu will-change-transform transition-all duration-500 ease-out"
                style={{
                  width: '50%',
                  left: `${style.left}%`,
                  transform: `translateY(-50%) scale(${style.scale})`,
                  transformOrigin: 'center center',
                  opacity: style.opacity,
                  zIndex: style.zIndex,
                }}
              >
                <div
                  className={cn(
                    "relative w-full rounded-2xl overflow-hidden",
                    isCenter && !isAnimating && "shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)]",
                    !isCenter && "cursor-pointer"
                  )}
                  style={{ aspectRatio: "16/9" }}
                  onClick={() => {
                    if (position === 'left') goToPrev()
                    else if (position === 'right') goToNext()
                  }}
                >
                  <div className="absolute inset-0">
                    {childrenArray[index]}
                  </div>
                  
                  {/* 渐变遮罩 */}
                  {style.gradientDir && (
                    <div 
                      className={cn(
                        "absolute inset-0 pointer-events-none",
                        isAnimating ? "transition-opacity duration-500 ease-out" : ""
                      )}
                      style={{
                        // 左侧图片：左边0（完全遮挡）右边1（透明）-> 从左到右渐变，左边背景色，右边透明
                        // 右侧图片：左边1（透明）右边0（完全遮挡）-> 从左到右渐变，左边透明，右边背景色
                        background: style.gradientDir === 'left' 
                          ? "linear-gradient(to right, var(--background) 50%, transparent 100%)"
                          : "linear-gradient(to left, var(--background) 50%, transparent 100%)",
                        opacity: style.opacity
                      }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation arrows */}
      {showArrows && totalItems > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 hover:bg-card border border-border shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform-gpu z-40"
            onClick={goToPrev}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 hover:bg-card border border-border shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform-gpu z-40"
            onClick={goToNext}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </>
      )}

      {/* Dots indicator */}
      {showDots && totalItems > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-40">
          {childrenArray.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentIndex
                  ? "bg-primary w-6"
                  : "bg-foreground/30 hover:bg-foreground/50"
              )}
              onClick={() => goToIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CarouselItem({ children, className }: CarouselItemProps) {
  return <div className={cn("w-full h-full", className)}>{children}</div>
}
