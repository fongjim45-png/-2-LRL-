import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'
import BorderGlow from './BorderGlow'
import './Carousel.css'

export type CarouselItemData = {
  id: string | number
  title: string
  description: string
  image: string
  video: string
}

type CarouselProps = {
  items: CarouselItemData[]
  baseWidth?: number
  autoplay?: boolean
  autoplayDelay?: number
  pauseOnHover?: boolean
  loop?: boolean
  round?: boolean
  onSelect?: (item: CarouselItemData) => void
}

const DRAG_BUFFER = 0
const VELOCITY_THRESHOLD = 500
const GAP = 16
const SPRING_OPTIONS = { type: 'spring', stiffness: 300, damping: 30 } as const

function CarouselItem({
  item,
  index,
  itemWidth,
  round,
  trackItemOffset,
  x,
  transition,
  onSelect,
}: {
  item: CarouselItemData
  index: number
  itemWidth: number
  round: boolean
  trackItemOffset: number
  x: ReturnType<typeof useMotionValue<number>>
  transition: typeof SPRING_OPTIONS | { duration: number }
  onSelect?: (item: CarouselItemData) => void
}) {
  const range = [-(index + 1) * trackItemOffset, -index * trackItemOffset, -(index - 1) * trackItemOffset]
  const rotateY = useTransform(x, range, [90, 0, -90], { clamp: false })

  return (
    <BorderGlow
      animated={index === 1}
      borderRadius={18}
      className={`carousel-glow ${round ? 'round' : ''}`}
      glowRadius={30}
      style={{
        width: itemWidth,
        height: round ? itemWidth : '100%',
        ...(round && { borderRadius: '50%' }),
      }}
    >
      <motion.button
        className={`carousel-item ${round ? 'round' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          rotateY,
          ...(round && { borderRadius: '50%' }),
        }}
        transition={transition}
        type="button"
        onClick={() => onSelect?.(item)}
      >
        <img src={item.image} alt="" loading="lazy" decoding="async" draggable={false} />
        <div className={`carousel-item-header ${round ? 'round' : ''}`}>
          <span className="carousel-icon-container">{String(index).padStart(2, '0')}</span>
        </div>
        <div className="carousel-item-content">
          <div className="carousel-item-title">{item.title}</div>
          <p className="carousel-item-description">{item.description}</p>
        </div>
      </motion.button>
    </BorderGlow>
  )
}

export default function Carousel({
  items,
  baseWidth = 300,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  loop = false,
  round = false,
  onSelect,
}: CarouselProps) {
  const containerPadding = 16
  const itemWidth = baseWidth - containerPadding * 2
  const trackItemOffset = itemWidth + GAP
  const itemsForRender = useMemo(() => {
    if (!loop || items.length === 0) {
      return items
    }
    return [items[items.length - 1], ...items, items[0]]
  }, [items, loop])

  const [position, setPosition] = useState(loop ? 1 : 0)
  const x = useMotionValue(-(loop ? 1 : 0) * trackItemOffset)
  const [isHovered, setIsHovered] = useState(false)
  const [isJumping, setIsJumping] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!pauseOnHover || !containerRef.current) {
      return
    }

    const container = containerRef.current
    const handleMouseEnter = () => setIsHovered(true)
    const handleMouseLeave = () => setIsHovered(false)
    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [pauseOnHover])

  useEffect(() => {
    if (!autoplay || itemsForRender.length <= 1 || (pauseOnHover && isHovered)) {
      return
    }

    const timer = window.setInterval(() => {
      setPosition((current) => Math.min(current + 1, itemsForRender.length - 1))
    }, autoplayDelay)

    return () => window.clearInterval(timer)
  }, [autoplay, autoplayDelay, isHovered, itemsForRender.length, pauseOnHover])

  const effectiveTransition = isJumping ? { duration: 0 } : SPRING_OPTIONS

  const handleAnimationComplete = () => {
    if (!loop || itemsForRender.length <= 1) {
      setIsAnimating(false)
      return
    }

    const lastCloneIndex = itemsForRender.length - 1
    if (position === lastCloneIndex) {
      setIsJumping(true)
      setPosition(1)
      x.set(-trackItemOffset)
      requestAnimationFrame(() => {
        setIsJumping(false)
        setIsAnimating(false)
      })
      return
    }

    if (position === 0) {
      setIsJumping(true)
      const target = items.length
      setPosition(target)
      x.set(-target * trackItemOffset)
      requestAnimationFrame(() => {
        setIsJumping(false)
        setIsAnimating(false)
      })
      return
    }

    setIsAnimating(false)
  }

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const direction =
      info.offset.x < -DRAG_BUFFER || info.velocity.x < -VELOCITY_THRESHOLD
        ? 1
        : info.offset.x > DRAG_BUFFER || info.velocity.x > VELOCITY_THRESHOLD
          ? -1
          : 0

    if (direction === 0) {
      return
    }

    setPosition((current) => {
      const next = current + direction
      return Math.max(0, Math.min(next, itemsForRender.length - 1))
    })
  }

  const dragProps = loop
    ? {}
    : {
        dragConstraints: {
          left: -trackItemOffset * Math.max(itemsForRender.length - 1, 0),
          right: 0,
        },
      }

  const activeIndex =
    items.length === 0 ? 0 : loop ? (position - 1 + items.length) % items.length : Math.min(position, items.length - 1)

  return (
    <div
      className={`carousel-container ${round ? 'round' : ''}`}
      ref={containerRef}
      style={{
        width: `${baseWidth}px`,
        ...(round && { height: `${baseWidth}px`, borderRadius: '50%' }),
      }}
    >
      <motion.div
        className="carousel-track"
        drag={isAnimating ? false : 'x'}
        {...dragProps}
        style={{
          width: itemWidth,
          gap: `${GAP}px`,
          perspective: 1000,
          perspectiveOrigin: `${position * trackItemOffset + itemWidth / 2}px 50%`,
          x,
        }}
        animate={{ x: -(position * trackItemOffset) }}
        transition={effectiveTransition}
        onAnimationStart={() => setIsAnimating(true)}
        onAnimationComplete={handleAnimationComplete}
        onDragEnd={handleDragEnd}
      >
        {itemsForRender.map((item, index) => (
          <CarouselItem
            item={item}
            index={index}
            itemWidth={itemWidth}
            key={`${item.id}-${index}`}
            round={round}
            trackItemOffset={trackItemOffset}
            transition={effectiveTransition}
            x={x}
            onSelect={onSelect}
          />
        ))}
      </motion.div>
      <div className={`carousel-indicators-container ${round ? 'round' : ''}`}>
        <div className="carousel-indicators">
          {items.map((_, index) => (
            <motion.button
              aria-current={activeIndex === index}
              aria-label={`Go to slide ${index + 1}`}
              animate={{ scale: activeIndex === index ? 1.2 : 1 }}
              className={`carousel-indicator ${activeIndex === index ? 'active' : 'inactive'}`}
              key={index}
              onClick={() => setPosition(loop ? index + 1 : index)}
              transition={{ duration: 0.15 }}
              type="button"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
