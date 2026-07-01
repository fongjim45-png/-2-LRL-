import { useRef, type ReactNode, type MouseEvent } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'
import './TiltedCard.css'

const springValues = {
  damping: 30,
  stiffness: 100,
  mass: 2,
}

type TiltedCardProps = {
  imageSrc?: string
  altText?: string
  captionText?: string
  containerHeight?: string
  containerWidth?: string
  imageHeight?: string
  imageWidth?: string
  rotateAmplitude?: number
  scaleOnHover?: number
  showTooltip?: boolean
  displayOverlayContent?: boolean
  overlayContent?: ReactNode
  children?: ReactNode
  className?: string
}

export default function TiltedCard({
  imageSrc,
  altText = 'Tilted card image',
  captionText = '',
  containerHeight = '100%',
  containerWidth = '100%',
  imageHeight = '100%',
  imageWidth = '100%',
  rotateAmplitude = 8,
  scaleOnHover = 1.025,
  showTooltip = false,
  overlayContent = null,
  displayOverlayContent = false,
  children,
  className = '',
}: TiltedCardProps) {
  const ref = useRef<HTMLElement | null>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useMotionValue(0), springValues)
  const rotateY = useSpring(useMotionValue(0), springValues)
  const scale = useSpring(1, springValues)
  const opacity = useSpring(0)
  const rotateFigcaption = useSpring(0, {
    stiffness: 350,
    damping: 30,
    mass: 1,
  })
  const lastYRef = useRef(0)

  function handleMouse(e: MouseEvent<HTMLElement>) {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const offsetX = e.clientX - rect.left - rect.width / 2
    const offsetY = e.clientY - rect.top - rect.height / 2

    rotateX.set((offsetY / (rect.height / 2)) * -rotateAmplitude)
    rotateY.set((offsetX / (rect.width / 2)) * rotateAmplitude)
    x.set(e.clientX - rect.left)
    y.set(e.clientY - rect.top)
    rotateFigcaption.set(-(offsetY - lastYRef.current) * 0.42)
    lastYRef.current = offsetY
  }

  function handleMouseEnter() {
    scale.set(scaleOnHover)
    opacity.set(1)
  }

  function handleMouseLeave() {
    opacity.set(0)
    scale.set(1)
    rotateX.set(0)
    rotateY.set(0)
    rotateFigcaption.set(0)
    lastYRef.current = 0
  }

  return (
    <figure
      className={`tilted-card-figure ${className}`.trim()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouse}
      ref={ref}
      style={{ height: containerHeight, width: containerWidth }}
    >
      <motion.div
        className="tilted-card-inner"
        style={{
          width: imageWidth,
          height: imageHeight,
          rotateX,
          rotateY,
          scale,
        }}
      >
        {imageSrc && <motion.img alt={altText} className="tilted-card-img" src={imageSrc} />}
        {children && <motion.div className="tilted-card-content">{children}</motion.div>}
        {displayOverlayContent && overlayContent && <motion.div className="tilted-card-overlay">{overlayContent}</motion.div>}
      </motion.div>

      {showTooltip && captionText && (
        <motion.figcaption
          className="tilted-card-caption"
          style={{
            x,
            y,
            opacity,
            rotate: rotateFigcaption,
          }}
        >
          {captionText}
        </motion.figcaption>
      )}
    </figure>
  )
}
