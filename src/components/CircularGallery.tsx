import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform, type OGLRenderingContext } from 'ogl'
import { useEffect, useRef } from 'react'
import './CircularGallery.css'

export type CircularGalleryItem = {
  image: string
  text: string
  video?: string
}

type CircularGalleryProps = {
  items?: CircularGalleryItem[]
  bend?: number
  textColor?: string
  borderRadius?: number
  font?: string
  scrollSpeed?: number
  scrollEase?: number
  onSelect?: (item: CircularGalleryItem, index: number) => void
}

type ScrollState = {
  current: number
  target: number
  last: number
  ease: number
  position?: number
}

type Size = {
  width: number
  height: number
}

type GalleryTitleOptions = {
  gl: OGLRenderingContext
  plane: Mesh
  text: string
  textColor: string
  font: string
}

type GalleryMediaOptions = {
  geometry: Plane
  gl: OGLRenderingContext
  image: string
  index: number
  length: number
  scene: Transform
  screen: Size
  text: string
  viewport: Size
  bend: number
  textColor: string
  borderRadius: number
  font: string
}

const defaultItems: CircularGalleryItem[] = [
  { image: '/portfolio/project-ai-video.png', text: 'Episode 01' },
  { image: '/portfolio/project-storyboard.png', text: 'Episode 02' },
  { image: '/portfolio/project-visual-system.png', text: 'Episode 03' },
  { image: '/portfolio/creator-avatar.png', text: 'Episode 04' },
  { image: '/portfolio/project-ai-video.png', text: 'Episode 05' },
]

const imageCache = new Map<string, HTMLImageElement>()

function loadCachedImage(src: string, onLoad: (image: HTMLImageElement) => void) {
  const cachedImage = imageCache.get(src)
  if (cachedImage) {
    if (cachedImage.complete && cachedImage.naturalWidth > 0) {
      onLoad(cachedImage)
    } else {
      cachedImage.addEventListener('load', () => onLoad(cachedImage), { once: true })
    }
    return
  }

  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.decoding = 'async'
  imageCache.set(src, image)
  image.addEventListener('load', () => onLoad(image), { once: true })
  image.src = src
}

function debounce<T extends (...args: never[]) => void>(func: T, wait: number) {
  let timeout: number | undefined
  return (...args: Parameters<T>) => {
    window.clearTimeout(timeout)
    timeout = window.setTimeout(() => func(...args), wait)
  }
}

function lerp(p1: number, p2: number, t: number) {
  return p1 + (p2 - p1) * t
}

function autoBind(instance: object) {
  const proto = Object.getPrototypeOf(instance)
  Object.getOwnPropertyNames(proto).forEach((key) => {
    const value = (instance as Record<string, unknown>)[key]
    if (key !== 'constructor' && typeof value === 'function') {
      ;(instance as Record<string, unknown>)[key] = value.bind(instance)
    }
  })
}

function getFontSize(font: string) {
  const match = font.match(/(\d+)px/)
  return match ? Number.parseInt(match[1], 10) : 30
}

function createTextTexture(gl: OGLRenderingContext, text: string, font: string, color: string) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) {
    const texture = new Texture(gl)
    return { texture, width: 1, height: 1 }
  }

  context.font = font
  const metrics = context.measureText(text)
  const textWidth = Math.ceil(metrics.width)
  const textHeight = Math.ceil(getFontSize(font) * 1.2)
  canvas.width = textWidth + 24
  canvas.height = textHeight + 24
  context.font = font
  context.fillStyle = color
  context.textBaseline = 'middle'
  context.textAlign = 'center'
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillText(text, canvas.width / 2, canvas.height / 2)

  const texture = new Texture(gl, { generateMipmaps: false })
  texture.image = canvas
  return { texture, width: canvas.width, height: canvas.height }
}

class GalleryTitle {
  gl: OGLRenderingContext
  plane: Mesh
  text: string
  textColor: string
  font: string
  mesh?: Mesh

  constructor({ gl, plane, text, textColor, font }: GalleryTitleOptions) {
    autoBind(this)
    this.gl = gl
    this.plane = plane
    this.text = text
    this.textColor = textColor
    this.font = font
    this.createMesh()
  }

  createMesh() {
    const { texture, width, height } = createTextTexture(this.gl, this.text, this.font, this.textColor)
    const geometry = new Plane(this.gl)
    const program = new Program(this.gl, {
      vertex: `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tMap, vUv);
          if (color.a < 0.1) discard;
          gl_FragColor = color;
        }
      `,
      transparent: true,
      uniforms: { tMap: { value: texture } },
    })
    this.mesh = new Mesh(this.gl, { geometry, program })
    const aspect = width / height
    const textHeight = this.plane.scale.y * 0.13
    const textWidth = textHeight * aspect
    this.mesh.scale.set(textWidth, textHeight, 1)
    this.mesh.position.y = -this.plane.scale.y * 0.5 - textHeight * 0.5 - 0.05
    this.mesh.setParent(this.plane)
  }
}

class GalleryMedia {
  bend: number
  extra = 0
  font: string
  geometry: Plane
  gl: OGLRenderingContext
  image: string
  index: number
  length: number
  plane!: Mesh
  program!: Program
  scene: Transform
  screen: Size
  text: string
  textColor: string
  viewport: Size
  width = 0
  widthTotal = 0
  x = 0
  speed = 0

  constructor({ geometry, gl, image, index, length, scene, screen, text, viewport, bend, textColor, borderRadius, font }: GalleryMediaOptions) {
    this.geometry = geometry
    this.gl = gl
    this.image = image
    this.index = index
    this.length = length
    this.scene = scene
    this.screen = screen
    this.text = text
    this.viewport = viewport
    this.bend = bend
    this.textColor = textColor
    this.font = font
    this.createShader(borderRadius)
    this.createMesh()
    this.createTitle()
    this.onResize()
  }

  createShader(borderRadius: number) {
    const texture = new Texture(this.gl, { generateMipmaps: false })
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      transparent: true,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.018 + uSpeed * 0.18);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        varying vec2 vUv;

        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }

        void main() {
          vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
          );
          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );
          vec4 color = texture2D(tMap, uv);
          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          float alpha = 1.0 - smoothstep(-0.002, 0.002, d);
          gl_FragColor = vec4(color.rgb, alpha);
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [1, 1] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: borderRadius },
      },
    })

    loadCachedImage(this.image, (img) => {
      texture.image = img
      this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight]
    })
  }

  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program,
    })
    this.plane.setParent(this.scene)
  }

  createTitle() {
    new GalleryTitle({
      gl: this.gl,
      plane: this.plane,
      text: this.text,
      textColor: this.textColor,
      font: this.font,
    })
  }

  update(scroll: ScrollState, direction: 'left' | 'right') {
    this.plane.position.x = this.x - scroll.current - this.extra

    const x = this.plane.position.x
    const halfViewport = this.viewport.width / 2

    if (this.bend === 0) {
      this.plane.position.y = 0
      this.plane.rotation.z = 0
    } else {
      const bendAbs = Math.abs(this.bend)
      const radius = (halfViewport * halfViewport + bendAbs * bendAbs) / (2 * bendAbs)
      const effectiveX = Math.min(Math.abs(x), halfViewport)
      const arc = radius - Math.sqrt(radius * radius - effectiveX * effectiveX)
      if (this.bend > 0) {
        this.plane.position.y = -arc
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / radius)
      } else {
        this.plane.position.y = arc
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / radius)
      }
    }

    const nextSpeed = Math.max(-0.18, Math.min(0.18, scroll.current - scroll.last))
    this.speed = lerp(this.speed, nextSpeed, 0.22)
    this.program.uniforms.uTime.value += 0.04
    this.program.uniforms.uSpeed.value = Math.abs(this.speed)

    const planeOffset = this.plane.scale.x / 2
    const viewportOffset = this.viewport.width / 2
    const isBefore = this.plane.position.x + planeOffset < -viewportOffset
    const isAfter = this.plane.position.x - planeOffset > viewportOffset
    if (direction === 'right' && isBefore) {
      this.extra -= this.widthTotal
    }
    if (direction === 'left' && isAfter) {
      this.extra += this.widthTotal
    }
  }

  onResize({ screen, viewport }: { screen?: Size; viewport?: Size } = {}) {
    if (screen) this.screen = screen
    if (viewport) this.viewport = viewport
    const scale = this.screen.height / 1100
    this.plane.scale.y = (this.viewport.height * (760 * scale)) / this.screen.height
    this.plane.scale.x = (this.viewport.width * (580 * scale)) / this.screen.width
    this.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y]
    const padding = 1.2
    this.width = this.plane.scale.x + padding
    this.widthTotal = this.width * this.length
    this.x = this.width * this.index
  }
}

class GalleryApp {
  bend
  boundOnKeyDown
  boundOnResize
  boundOnTouchDown
  boundOnTouchMove
  boundOnTouchUp
  boundOnWheel
  camera!: Camera
  container: HTMLDivElement
  galleryItems: CircularGalleryItem[]
  geometry!: Plane
  gl!: OGLRenderingContext
  isDown = false
  isDragging = false
  isVisible = true
  medias?: GalleryMedia[]
  onCheckDebounce
  onSelect?: (item: CircularGalleryItem, index: number) => void
  pointer = { x: 0, y: 0 }
  raf = 0
  renderer!: Renderer
  scene!: Transform
  screen = { width: 1, height: 1 }
  scroll: ScrollState
  scrollSpeed
  start = 0
  textColor
  borderRadius
  font
  viewport = { width: 1, height: 1 }
  visibilityObserver?: IntersectionObserver

  constructor(container: HTMLDivElement, options: Required<Omit<CircularGalleryProps, 'items' | 'onSelect'>> & {
    items: CircularGalleryItem[]
    onSelect?: (item: CircularGalleryItem, index: number) => void
  }) {
    this.container = container
    this.galleryItems = options.items
    this.bend = options.bend
    this.textColor = options.textColor
    this.borderRadius = options.borderRadius
    this.font = options.font
    this.scrollSpeed = options.scrollSpeed
    this.scroll = { ease: options.scrollEase, current: 0, target: 0, last: 0 }
    this.onSelect = options.onSelect
    this.onCheckDebounce = debounce(this.onCheck.bind(this), 180)

    this.createRenderer()
    this.createCamera()
    this.createScene()
    this.onResize()
    this.createGeometry()
    this.createMedias()
    this.update()

    this.boundOnResize = this.onResize.bind(this)
    this.boundOnWheel = this.onWheel.bind(this)
    this.boundOnTouchDown = this.onTouchDown.bind(this)
    this.boundOnTouchMove = this.onTouchMove.bind(this)
    this.boundOnTouchUp = this.onTouchUp.bind(this)
    this.boundOnKeyDown = this.onKeyDown.bind(this)
    this.addEventListeners()
    this.createVisibilityObserver()
  }

  createRenderer() {
    this.renderer = new Renderer({
      alpha: true,
      antialias: false,
      dpr: 1,
    })
    this.gl = this.renderer.gl
    this.gl.clearColor(0, 0, 0, 0)
    this.container.appendChild(this.gl.canvas)
  }

  createCamera() {
    this.camera = new Camera(this.gl)
    this.camera.fov = 45
    this.camera.position.z = 20
  }

  createScene() {
    this.scene = new Transform()
  }

  createGeometry() {
    this.geometry = new Plane(this.gl, {
      heightSegments: 18,
      widthSegments: 34,
    })
  }

  createMedias() {
    const mediasImages = this.galleryItems.concat(this.galleryItems)
    this.medias = mediasImages.map((data, index) => new GalleryMedia({
      geometry: this.geometry,
      gl: this.gl,
      image: data.image,
      index,
      length: mediasImages.length,
      scene: this.scene,
      screen: this.screen,
      text: data.text,
      viewport: this.viewport,
      bend: this.bend,
      textColor: this.textColor,
      borderRadius: this.borderRadius,
      font: this.font,
    }))
  }

  createVisibilityObserver() {
    if (!('IntersectionObserver' in window)) {
      return
    }

    this.visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        this.isVisible = entry.isIntersecting
      },
      { root: null, rootMargin: '240px', threshold: 0 },
    )
    this.visibilityObserver.observe(this.container)
  }

  onTouchDown(e: MouseEvent | TouchEvent) {
    if ('button' in e && e.button !== 0) {
      return
    }

    const pointer = this.getPointer(e)
    this.isDown = true
    this.isDragging = false
    this.scroll.position = this.scroll.current
    this.pointer = pointer
    this.start = pointer.x
  }

  onTouchMove(e: MouseEvent | TouchEvent) {
    if (!this.isDown) return
    const pointer = this.getPointer(e)
    const distance = (this.start - pointer.x) * (this.scrollSpeed * 0.025)
    if (Math.abs(distance) > 0.05) this.isDragging = true
    this.scroll.target = (this.scroll.position ?? this.scroll.current) + distance
  }

  onTouchUp(e?: MouseEvent | TouchEvent) {
    if (!this.isDown) {
      return
    }

    if (!this.isDragging) {
      const pointer = e ? this.getPointer(e) : this.pointer
      this.selectAt(pointer.x, pointer.y)
    }
    this.isDown = false
    this.onCheck()
  }

  onWheel(e: WheelEvent) {
    const delta = e.deltaY || e.detail
    this.scroll.target += (delta > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.2
    this.onCheckDebounce()
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      this.scroll.target += this.scrollSpeed * 5
      this.onCheckDebounce()
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      this.scroll.target -= this.scrollSpeed * 5
      this.onCheckDebounce()
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      this.selectCurrent()
    }
  }

  selectCurrent() {
    if (!this.medias?.[0] || !this.onSelect) return
    const width = this.medias[0].width
    const index = Math.round(Math.abs(this.scroll.target) / width) % this.galleryItems.length
    this.onSelect(this.galleryItems[index], index)
  }

  getPointer(e: MouseEvent | TouchEvent) {
    if ('changedTouches' in e && e.changedTouches.length) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
    }

    if ('touches' in e && e.touches.length) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }

    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY }
  }

  selectAt(clientX: number, clientY: number) {
    if (!this.medias?.length || !this.onSelect) return

    const rect = this.container.getBoundingClientRect()
    const sceneX = ((clientX - rect.left) / rect.width - 0.5) * this.viewport.width
    const sceneY = (0.5 - (clientY - rect.top) / rect.height) * this.viewport.height
    let selectedIndex = -1
    let selectedScore = Number.POSITIVE_INFINITY

    this.medias.forEach((media, mediaIndex) => {
      const halfWidth = media.plane.scale.x / 2
      const halfHeight = media.plane.scale.y / 2
      const dx = Math.max(Math.abs(sceneX - media.plane.position.x) - halfWidth, 0)
      const dy = Math.max(Math.abs(sceneY - media.plane.position.y) - halfHeight, 0)
      const isInside = dx === 0 && dy === 0
      const score = Math.hypot(dx, dy) + (isInside ? 0 : 100)

      if (score < selectedScore) {
        selectedScore = score
        selectedIndex = mediaIndex
      }
    })

    if (selectedIndex < 0 || selectedScore > 100) {
      return
    }

    const itemIndex = selectedIndex % this.galleryItems.length
    this.onSelect(this.galleryItems[itemIndex], itemIndex)
  }

  onCheck() {
    if (!this.medias?.[0]) return
    const width = this.medias[0].width
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width)
    const item = width * itemIndex
    this.scroll.target = this.scroll.target < 0 ? -item : item
  }

  onResize() {
    this.screen = {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    }
    this.renderer.setSize(this.screen.width, this.screen.height)
    this.camera.perspective({
      aspect: this.screen.width / this.screen.height,
    })
    const fov = (this.camera.fov * Math.PI) / 180
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z
    const width = height * this.camera.aspect
    this.viewport = { width, height }
    this.medias?.forEach((media) => media.onResize({ screen: this.screen, viewport: this.viewport }))
  }

  update() {
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease)
    const direction = this.scroll.current > this.scroll.last ? 'right' : 'left'
    if (this.isVisible && !document.hidden) {
      this.medias?.forEach((media) => media.update(this.scroll, direction))
      this.renderer.render({ scene: this.scene, camera: this.camera })
    }
    this.scroll.last = this.scroll.current
    this.raf = window.requestAnimationFrame(this.update.bind(this))
  }

  addEventListeners() {
    window.addEventListener('resize', this.boundOnResize)
    this.container.addEventListener('wheel', this.boundOnWheel, { passive: true })
    this.container.addEventListener('mousedown', this.boundOnTouchDown)
    window.addEventListener('mousemove', this.boundOnTouchMove)
    window.addEventListener('mouseup', this.boundOnTouchUp)
    this.container.addEventListener('touchstart', this.boundOnTouchDown, { passive: true })
    this.container.addEventListener('touchmove', this.boundOnTouchMove, { passive: true })
    this.container.addEventListener('touchend', this.boundOnTouchUp)
    this.container.addEventListener('keydown', this.boundOnKeyDown)
  }

  destroy() {
    window.cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.boundOnResize)
    this.container.removeEventListener('wheel', this.boundOnWheel)
    this.container.removeEventListener('mousedown', this.boundOnTouchDown)
    window.removeEventListener('mousemove', this.boundOnTouchMove)
    window.removeEventListener('mouseup', this.boundOnTouchUp)
    this.container.removeEventListener('touchstart', this.boundOnTouchDown)
    this.container.removeEventListener('touchmove', this.boundOnTouchMove)
    this.container.removeEventListener('touchend', this.boundOnTouchUp)
    this.container.removeEventListener('keydown', this.boundOnKeyDown)
    this.visibilityObserver?.disconnect()
    this.renderer.gl.canvas.parentNode?.removeChild(this.renderer.gl.canvas)
  }
}

export default function CircularGallery({
  items = defaultItems,
  bend = 1.4,
  textColor = '#ffffff',
  borderRadius = 0.06,
  font = '900 28px Arial',
  scrollSpeed = 2,
  scrollEase = 0.045,
  onSelect,
}: CircularGalleryProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return undefined
    const app = new GalleryApp(containerRef.current, {
      items,
      bend,
      textColor,
      borderRadius,
      font,
      scrollSpeed,
      scrollEase,
      onSelect,
    })

    return () => app.destroy()
  }, [items, bend, textColor, borderRadius, font, scrollSpeed, scrollEase, onSelect])

  return (
    <div
      aria-label="Circular image gallery. Drag or use arrow keys to browse; click or press Enter to play."
      className="circular-gallery"
      ref={containerRef}
      role="region"
      tabIndex={0}
    />
  )
}
