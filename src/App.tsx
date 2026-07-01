import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type MouseEvent,
} from 'react'
import BorderGlow from './components/BorderGlow'
import ClickSpark from './components/ClickSpark'
import Carousel, { type CarouselItemData } from './components/Carousel'
import ShinyText from './components/ShinyText'
import TiltedCard from './components/TiltedCard'

const douyinSearchUrl =
  'https://www.douyin.com/search/%E7%A2%8E%E7%A2%8E%E5%BF%B5-AIGC'

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`

const cjEpisodes = [
  { image: assetUrl('/portfolio/covers/cj-01.jpg'), video: assetUrl('/portfolio/videos/cj-01.mp4') },
  { image: assetUrl('/portfolio/covers/cj-02.jpg'), video: assetUrl('/portfolio/videos/cj-02.mp4') },
  { image: assetUrl('/portfolio/covers/cj-03.jpg'), video: assetUrl('/portfolio/videos/cj-03.mp4') },
  { image: assetUrl('/portfolio/covers/cj-05.jpg'), video: assetUrl('/portfolio/videos/cj-05.mp4') },
  { image: assetUrl('/portfolio/covers/cj-06.jpg'), video: assetUrl('/portfolio/videos/cj-06.mp4') },
]

const visualEpisodes = [
  { image: assetUrl('/portfolio/covers/visual-01.jpg'), video: assetUrl('/portfolio/videos/visual-01.mp4') },
  { image: assetUrl('/portfolio/covers/visual-02.jpg'), video: assetUrl('/portfolio/videos/visual-02.mp4') },
  { image: assetUrl('/portfolio/covers/visual-03.jpg'), video: assetUrl('/portfolio/videos/visual-03.mp4') },
]

const streamEpisodes = [
  { image: assetUrl('/portfolio/covers/stream-01.jpg'), video: assetUrl('/portfolio/videos/stream-01.mp4') },
  { image: assetUrl('/portfolio/covers/stream-02.jpg'), video: assetUrl('/portfolio/videos/stream-02.mp4') },
  { image: assetUrl('/portfolio/covers/stream-03.jpg'), video: assetUrl('/portfolio/videos/stream-03.mp4') },
  { image: assetUrl('/portfolio/covers/stream-04.jpg'), video: assetUrl('/portfolio/videos/stream-04.mp4') },
  { image: assetUrl('/portfolio/covers/stream-05.jpg'), video: assetUrl('/portfolio/videos/stream-05.mp4') },
]

const videoQualities = ['AUTO', '1080P', '720P', '540P']

type ShineVariant = 'title' | 'body' | 'muted' | 'lime'

const shineTheme: Record<ShineVariant, { color: string; shineColor: string; speed: number; delay: number; className: string }> = {
  title: {
    color: '#f1f7f4',
    shineColor: '#b6ff2f',
    speed: 5.4,
    delay: 0.35,
    className: 'shiny-text-title',
  },
  body: {
    color: '#c7d0d1',
    shineColor: '#ffffff',
    speed: 6,
    delay: 0.6,
    className: 'shiny-text-flow shiny-text-soft',
  },
  muted: {
    color: '#8f9a9b',
    shineColor: '#d8f7ef',
    speed: 6.8,
    delay: 0.8,
    className: 'shiny-text-flow shiny-text-muted',
  },
  lime: {
    color: '#a9ff2d',
    shineColor: '#ffffff',
    speed: 4.8,
    delay: 0.25,
    className: 'shiny-text-soft',
  },
}

const Shine = ({ text, variant = 'body', className = '' }: { text: string; variant?: ShineVariant; className?: string }) => {
  const theme = shineTheme[variant]

  return (
    <ShinyText
      text={text}
      speed={theme.speed}
      delay={theme.delay}
      color={theme.color}
      shineColor={theme.shineColor}
      spread={118}
      className={`${theme.className} ${className}`.trim()}
    />
  )
}

const series = [
  {
    id: 'cj',
    title: 'CJ系列爆款合集',
    image: assetUrl('/portfolio/cj-main-cover.png'),
    items: cjEpisodes,
  },
  {
    id: 'visual',
    title: '视觉系',
    image: assetUrl('/portfolio/visual-main-cover.png'),
    items: visualEpisodes,
  },
  {
    id: 'stream',
    title: '意识流',
    image: assetUrl('/portfolio/stream-main-cover.png'),
    items: streamEpisodes,
  },
]

const heroCarouselGroups = series.map((item) => ({
  ...item,
  carouselItems: item.items.map((work, index) => ({
    id: `${item.id}-${index + 1}`,
    title: item.title,
    description: `分集 ${String(index + 1).padStart(2, '0')} / 点击播放`,
    image: work.image,
    video: work.video,
  })),
}))

const infoRows = [
  { label: '当前身份', value: '视觉设计师 / AI设计师 / AIGC创作者' },
  { label: '创作方向', value: 'AI影像 / 短视频 / 视觉叙事' },
  { label: '抖音号', value: '82660096353' },
  { label: '账号名', value: '碎碎念-AIGC' },
]

const selectedWorks = [
  {
    id: 'cj',
    title: 'CJ系列爆款合集',
    meta: '系列选题 / 爆款结构 / 视觉封面',
    image: assetUrl('/portfolio/cj-main-cover.png'),
    items: cjEpisodes,
    className: 'work-wide',
  },
  {
    id: 'visual',
    title: '视觉系',
    meta: '画面质感 / 影像美术 / 风格化生成',
    image: assetUrl('/portfolio/visual-main-cover.png'),
    items: visualEpisodes,
    className: 'work-small',
  },
  {
    id: 'stream',
    title: '意识流',
    meta: '情绪叙事 / 抽象镜头 / 概念表达',
    image: assetUrl('/portfolio/stream-main-cover.png'),
    items: streamEpisodes,
    className: 'work-tall',
  },
]

const strengths = [
  {
    title: '完整项目主导能力',
    tag: 'CORE',
    text: '能从主题、风格、脚本、分镜到发布包装推进完整创作链路。',
  },
  {
    title: '视觉体系搭建',
    tag: 'SYSTEM',
    text: '建立封面、色彩、字体、质感和系列化识别，让账号有稳定记忆点。',
  },
  {
    title: 'AI 设计提效',
    tag: 'AI',
    text: '把生成工具变成设计流程的一部分，快速试错并沉淀可复用方法。',
  },
  {
    title: '短视频内容判断',
    tag: 'VIDEO',
    text: '关注前三秒、节奏、视觉钩子和平台传播逻辑，让内容更适合被观看。',
  },
  {
    title: '审美与复盘',
    tag: 'REVIEW',
    text: '用视觉设计师的判断做取舍，让每次实验都能留下明确经验。',
  },
]

function App() {
  const rootRef = useRef<HTMLElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const activeVideoRef = useRef<string | null>(null)
  const autoplayRequestedRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const audioElementRef = useRef<HTMLVideoElement | null>(null)
  const audioAnalyserRef = useRef<AnalyserNode | null>(null)
  const audioDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const audioFrameRef = useRef<number | null>(null)
  const audioLevelRef = useRef(0.18)
  const glassConsoleRef = useRef<HTMLDivElement | null>(null)
  const [progress, setProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [activeWork, setActiveWork] = useState<string | null>(null)
  const [activeVideo, setActiveVideo] = useState<string | null>(null)
  const [activeVideoKey, setActiveVideoKey] = useState(0)
  const [videoProgress, setVideoProgress] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [videoVolume, setVideoVolume] = useState(1)
  const [videoQuality, setVideoQuality] = useState(videoQualities[0])
  const [isVideoPaused, setIsVideoPaused] = useState(true)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(current + Math.ceil((100 - current) / 9), 100)
        if (next >= 100) {
          window.clearInterval(timer)
          window.setTimeout(() => setLoaded(true), 420)
        }
        return next
      })
    }, 90)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!loaded || !rootRef.current) {
      return
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      return
    }

    let cancelled = false
    let context: { revert: () => void } | undefined

    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([gsapModule, scrollTriggerModule]) => {
      if (cancelled || !rootRef.current) {
        return
      }

      const gsap = gsapModule.default
      const { ScrollTrigger } = scrollTriggerModule

      gsap.registerPlugin(ScrollTrigger)

      context = gsap.context(() => {
        const sections = gsap.utils.toArray<HTMLElement>('.section-frame, .contact-section')
        sections.forEach((section) => {
          const heading = section.querySelector<HTMLElement>('.section-heading, .contact-copy h2')
          const subTitle = section.querySelector<HTMLElement>('.title-row p, .contact-copy p')
          const cards = section.querySelectorAll<HTMLElement>(
            '.portrait-card, .about-panel, .work-entry, .core-card, .contact-card, .brand-badge',
          )
          const images = section.querySelectorAll<HTMLImageElement>('.portrait-card img, .work-card img')
          const isEnglishHeading = heading?.classList.contains('english') || heading?.textContent?.match(/[A-Z]{3,}/)

          const timeline = gsap.timeline({
            defaults: { force3D: true },
            scrollTrigger: {
              trigger: section,
              start: 'top 70%',
              once: true,
            },
          })

          if (heading) {
            timeline.fromTo(
              heading,
              {
                yPercent: isEnglishHeading ? 128 : 92,
                xPercent: isEnglishHeading ? -14 : -7,
                scale: isEnglishHeading ? 1.16 : 1.08,
                scaleX: isEnglishHeading ? 0.48 : 0.66,
                clipPath: 'inset(0 100% 0 0)',
                opacity: 0,
                transformOrigin: 'left center',
              },
              {
                yPercent: 0,
                xPercent: 0,
                scale: 1,
                scaleX: 1,
                clipPath: 'inset(0 0% 0 0)',
                opacity: 1,
                duration: isEnglishHeading ? 1.75 : 1.45,
                ease: 'power4.out',
              },
              0,
            )
          }

          if (subTitle) {
            timeline.fromTo(
              subTitle,
              { y: 42, opacity: 0, clipPath: 'inset(0 0 100% 0)' },
              {
                y: 0,
                opacity: 1,
                clipPath: 'inset(0 0 0% 0)',
                duration: 1.05,
                ease: 'power3.out',
              },
              0.48,
            )
          }

          if (cards.length) {
            timeline.fromTo(
              cards,
              {
                y: 118,
                opacity: 0,
                scale: 0.9,
                clipPath: 'inset(24% 0 0 0 round 24px)',
              },
              {
                y: 0,
                opacity: 1,
                scale: 1,
                clipPath: 'inset(0% 0 0 0 round 24px)',
                duration: 1.32,
                stagger: 0.14,
                ease: 'power3.out',
              },
              0.78,
            )
          }

          images.forEach((image) => {
            gsap.fromTo(
              image,
              {
                clipPath: 'inset(0 0 28% 0)',
                opacity: 0.42,
                scale: 1.12,
                yPercent: -4,
              },
              {
                clipPath: 'inset(0 0 0% 0)',
                opacity: 0.86,
                scale: 1.04,
                yPercent: 0,
                duration: 1.45,
                ease: 'power3.out',
                force3D: true,
                scrollTrigger: {
                  trigger: image,
                  start: 'top 82%',
                  once: true,
                },
              },
            )

            gsap.fromTo(
              image,
              { yPercent: -3 },
              {
                yPercent: 4,
                ease: 'none',
                force3D: true,
                scrollTrigger: {
                  trigger: image,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 1.8,
                },
              },
            )
          })
        })

        ScrollTrigger.refresh()
      }, rootRef)
    })

    return () => {
      cancelled = true
      context?.revert()
    }
  }, [loaded])

  const playOnHeroScreen = useCallback((videoSrc: string) => {
    activeVideoRef.current = videoSrc
    autoplayRequestedRef.current = true
    setActiveVideo(videoSrc)
    setActiveVideoKey((key) => key + 1)
    setVideoProgress(0)
    setVideoDuration(0)
    setIsVideoPaused(false)
  }, [])

  useEffect(() => {
    if (!activeVideo) {
      return
    }

    const video = videoRef.current
    if (!video) {
      return
    }

    if (video.currentSrc !== new URL(activeVideo, window.location.href).href && video.src !== activeVideo) {
      video.src = activeVideo
      video.load()
    }

    video.muted = false
    video.volume = videoVolume
    if (!autoplayRequestedRef.current) {
      setIsVideoPaused(video.paused)
      return
    }

    autoplayRequestedRef.current = false
    const playPromise = video.play()
    if (playPromise) {
      void playPromise
        .then(() => setIsVideoPaused(false))
        .catch(() => setIsVideoPaused(video.paused))
    }
  }, [activeVideo, activeVideoKey, videoVolume])

  useEffect(() => {
    activeVideoRef.current = activeVideo
  }, [activeVideo])

  const applyAudioLevel = useCallback((level: number) => {
    const safeLevel = Math.min(1, Math.max(0.08, level))
    audioLevelRef.current = safeLevel

    const consoleNode = glassConsoleRef.current
    if (!consoleNode) {
      return
    }

    consoleNode.style.setProperty('--audio-level', String(safeLevel))
    consoleNode.style.setProperty('--audio-height', `${12 + safeLevel * 46}px`)
    consoleNode.style.setProperty('--audio-glow', `${12 + safeLevel * 24}px`)
    consoleNode.style.setProperty('--speaker-scale', String(1 + safeLevel * 0.055))
    consoleNode.style.setProperty('--tower-lift', `${(1 - safeLevel) * 3}px`)
  }, [])

  const startAudioReactiveLights = useCallback(() => {
    const video = videoRef.current
    if (!video) {
      return
    }

    video.muted = false
    video.volume = videoVolume
    setIsVideoPaused(video.paused)

    try {
      const context = audioContextRef.current ?? new AudioContext()
      audioContextRef.current = context

      if (context.state === 'suspended') {
        void context.resume()
      }

      if (audioElementRef.current !== video) {
        audioSourceRef.current?.disconnect()
        audioAnalyserRef.current?.disconnect()

        const source = context.createMediaElementSource(video)
        const analyser = context.createAnalyser()
        analyser.fftSize = 128
        analyser.smoothingTimeConstant = 0.82
        source.connect(analyser)
        analyser.connect(context.destination)

        audioSourceRef.current = source
        audioAnalyserRef.current = analyser
        audioElementRef.current = video
        audioDataRef.current = new Uint8Array(analyser.frequencyBinCount)
      }

      if (audioFrameRef.current) {
        cancelAnimationFrame(audioFrameRef.current)
      }

      const tick = () => {
        const analyser = audioAnalyserRef.current
        const data = audioDataRef.current
        if (!analyser || !data) {
          return
        }

        analyser.getByteFrequencyData(data)
        const lowEnd = data.slice(0, 12).reduce((sum, value) => sum + value, 0) / (12 * 255)
        const fullRange = data.reduce((sum, value) => sum + value, 0) / (data.length * 255)
        applyAudioLevel(lowEnd * 0.72 + fullRange * 0.52)
        audioFrameRef.current = requestAnimationFrame(tick)
      }

      tick()
    } catch {
      applyAudioLevel(0.34)
    }
  }, [applyAudioLevel, videoVolume])

  useEffect(() => {
    if (!activeVideo) {
      return
    }

    const timer = window.setTimeout(startAudioReactiveLights, 120)
    return () => window.clearTimeout(timer)
  }, [activeVideo, startAudioReactiveLights])

  useEffect(
    () => () => {
      if (audioFrameRef.current) {
        cancelAnimationFrame(audioFrameRef.current)
      }
      audioSourceRef.current?.disconnect()
      audioAnalyserRef.current?.disconnect()
      void audioContextRef.current?.close()
    },
    [],
  )

  const updateVideoProgress = () => {
    const video = videoRef.current
    if (!video) {
      return
    }

    video.muted = false
    video.volume = videoVolume
    setVideoProgress(video.currentTime)
    setVideoDuration(video.duration || 0)
    setIsVideoPaused(video.paused)
  }

  const handleVideoEnded = () => {
    const video = videoRef.current
    if (!video) {
      return
    }

    video.pause()
    setIsVideoPaused(true)
    setVideoProgress(video.duration || video.currentTime || 0)
  }

  const toggleHeroVideo = (event?: MouseEvent<HTMLElement>) => {
    event?.preventDefault()
    event?.stopPropagation()

    const video = videoRef.current
    if (!video) {
      return
    }

    video.muted = false
    video.volume = videoVolume
    if (video.paused) {
      void video.play()
      setIsVideoPaused(false)
    } else {
      video.pause()
      setIsVideoPaused(true)
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isEditable =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable

      if (event.code !== 'Space' || isEditable) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      if (videoRef.current) {
        toggleHeroVideo()
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space') {
        return
      }
      event.preventDefault()
      event.stopPropagation()
    }

    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('keyup', handleKeyUp, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('keyup', handleKeyUp, true)
    }
  })

  const changeVideoVolume = (event: ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation()
    const nextVolume = Number(event.target.value)
    setVideoVolume(nextVolume)
    const video = videoRef.current
    if (!video) {
      return
    }
    video.volume = nextVolume
    video.muted = nextVolume === 0
  }

  const changeVideoQuality = (event: ChangeEvent<HTMLSelectElement>) => {
    event.stopPropagation()
    setVideoQuality(event.target.value)
  }

  const enterHeroFullscreen = (event?: MouseEvent<HTMLElement>) => {
    event?.preventDefault()
    event?.stopPropagation()

    if (document.fullscreenElement) {
      void document.exitFullscreen()
      return
    }

    const screen = videoRef.current?.closest('.hero-cinema') as HTMLElement | null
    if (screen?.requestFullscreen) {
      void screen.requestFullscreen()
    }
  }

  const seekVideo = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const video = videoRef.current
    if (!video || !videoDuration) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1)
    video.currentTime = ratio * videoDuration
    setVideoProgress(video.currentTime)
  }

  return (
    <ClickSpark sparkColor="#b8ff2e" sparkSize={16} sparkRadius={28} sparkCount={10} duration={620} easing="ease-out" extraScale={1.15}>
      <main className="site-shell" ref={rootRef}>
      <div className={`loader-screen ${loaded ? 'loader-hidden' : ''}`} aria-hidden={loaded}>
        <p><Shine text="LOADING PORTFOLIO" variant="muted" /></p>
        <strong><Shine text={`${progress}%`} variant="lime" /></strong>
      </div>

      <section className="hero-page hero-clean" id="top">
        <div className="season-stage" aria-hidden="true">
          <div className="season season-spring" />
          <div className="season season-summer" />
          <div className="season season-autumn" />
          <div className="season season-winter" />
        </div>

        <header className="hero-nav hero-nav-text" aria-label="头屏导航">
          <a className="back-button" href="#top" aria-label="返回顶部">
            <span />
          </a>
          <a className="brand-nav" href={douyinSearchUrl} target="_blank" rel="noreferrer">
            <Shine text="碎碎念-AIGC" variant="lime" />
          </a>
          <nav aria-label="页面导航">
            <a href="#experience"><Shine text="个人经历" /></a>
            <a href="#projects"><Shine text="精选作品" /></a>
            <a href="#strengths"><Shine text="个人优势" /></a>
          </nav>
          <a className="contact-pill" href="#contact">
            <Shine text="联系我" />
          </a>
        </header>

        <div className="cinema-wall" aria-hidden="true" />

        <div
          className={activeVideo ? 'hero-cinema is-playing' : 'hero-cinema'}
          onClick={toggleHeroVideo}
          aria-label="头屏作品视频荧幕"
        >
          {activeVideo && (
            <>
              <video
                key={`${activeVideo}-${activeVideoKey}`}
                ref={videoRef}
                src={activeVideo}
                crossOrigin="anonymous"
                autoPlay
                playsInline
                preload="metadata"
                onPlay={startAudioReactiveLights}
                onPause={() => setIsVideoPaused(true)}
                onEnded={handleVideoEnded}
                onLoadedMetadata={updateVideoProgress}
                onTimeUpdate={updateVideoProgress}
              />
              <div className="hero-cinema-controls" onClick={(event) => event.stopPropagation()}>
                <button
                  className={isVideoPaused ? 'cinema-play-toggle' : 'cinema-play-toggle is-playing'}
                  type="button"
                  onClick={toggleHeroVideo}
                  aria-label="播放或暂停"
                >
                  <span />
                </button>
                <div className="cinema-progress" onClick={seekVideo} role="presentation">
                  <i style={{ transform: `scaleX(${videoDuration ? videoProgress / videoDuration : 0})` }} />
                </div>
                <select
                  className="cinema-quality"
                  value={videoQuality}
                  onClick={(event) => event.stopPropagation()}
                  onChange={changeVideoQuality}
                  aria-label="视频清晰度"
                >
                  {videoQualities.map((quality) => (
                    <option key={quality} value={quality}>
                      {quality}
                    </option>
                  ))}
                </select>
                <label className="cinema-volume">
                  <span />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={videoVolume}
                    onClick={(event) => event.stopPropagation()}
                    onChange={changeVideoVolume}
                    aria-label="音量"
                  />
                </label>
                <button className="cinema-fullscreen" type="button" onClick={enterHeroFullscreen} aria-label="全屏">
                  <span />
                </button>
              </div>
            </>
          )}
        </div>

        <div
          className="glass-console"
          ref={glassConsoleRef}
          style={
            {
              '--audio-level': audioLevelRef.current,
              '--audio-height': `${12 + audioLevelRef.current * 46}px`,
              '--audio-glow': `${12 + audioLevelRef.current * 24}px`,
              '--speaker-scale': 1 + audioLevelRef.current * 0.055,
              '--tower-lift': `${(1 - audioLevelRef.current) * 3}px`,
            } as CSSProperties
          }
          aria-hidden="true"
        >
          <div className="glass-console-surface" />
          {['left', 'right'].map((side) => (
            <div
              className={`audio-tower audio-tower-${side}`}
              key={side}
            >
              <div className="vertical-meter">
                {Array.from({ length: 18 }).map((_, index) => (
                  <i key={index} style={{ '--bar': index } as CSSProperties} />
                ))}
              </div>
              <div className="speaker-case">
                <div className="mini-driver" />
                <div className="main-driver" />
                <div className="led-strip">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <i key={index} style={{ '--bar': index } as CSSProperties} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hero-series-panel hero-carousel-panel" aria-label="头屏作品系列滑动选集">
          <div className="series-carousel-row">
            {heroCarouselGroups.map((item) => (
              <Carousel
                autoplay={false}
                baseWidth={300}
                items={item.carouselItems as CarouselItemData[]}
                key={item.id}
                loop
                onSelect={(work) => playOnHeroScreen(work.video)}
                pauseOnHover
              />
            ))}
          </div>
        </div>

      </section>

      <section className="experience-section section-frame" id="experience">
        <h2 className="section-heading"><Shine text="个人经历" variant="title" /></h2>
        <div className="about-grid">
          <BorderGlow className="portrait-card" borderRadius={28} glowRadius={42} animated>
            <TiltedCard rotateAmplitude={7} scaleOnHover={1.018}>
              <img src={assetUrl('/portfolio/profile-frame.jpg')} alt="碎碎念-AIGC画框图片" loading="lazy" decoding="async" draggable={false} />
            </TiltedCard>
          </BorderGlow>
          <BorderGlow className="about-panel" borderRadius={28} glowRadius={44} animated>
            <h3><Shine text="碎碎念-AIGC" variant="title" /></h3>
            <div className="info-table">
              {infoRows.map((item) => (
                <div className="info-row" key={item.label}>
                  <span><Shine text={item.label} variant="lime" /></span>
                  <strong><Shine text={item.value} variant="body" /></strong>
                </div>
              ))}
            </div>
            <div className="data-strip">
              <div>
                <strong><Shine text="3+" variant="lime" /></strong>
                <span><Shine text="内容方向" variant="muted" /></span>
              </div>
              <div>
                <strong><Shine text="30+" variant="lime" /></strong>
                <span><Shine text="可拓展选题" variant="muted" /></span>
              </div>
              <div>
                <strong><Shine text="500+" variant="lime" /></strong>
                <span><Shine text="视觉素材沉淀" variant="muted" /></span>
              </div>
            </div>
          </BorderGlow>
        </div>
      </section>

      <section className="works-section section-frame" id="projects">
        <div className="title-row">
          <div>
            <h2 className="section-heading english"><Shine text="SELECTED WORKS ↘" variant="title" /></h2>
            <p><Shine text="视觉作品" variant="muted" /></p>
          </div>
        </div>
        <div className="works-layout">
          {selectedWorks.map((work) => {
            const isActive = activeWork === work.id
            const isVerticalExpand = work.id === 'visual'

            return (
              <article
                className={`work-entry ${work.className} ${isActive ? 'is-open' : ''} ${
                  isVerticalExpand ? 'work-drop-entry' : 'work-push-entry'
                }`}
                id={work.id}
                key={work.title}
              >
                <BorderGlow className="work-card-glow" borderRadius={24} glowRadius={40} animated={work.id === 'cj'}>
                  <TiltedCard captionText={work.title} rotateAmplitude={7} scaleOnHover={1.018} showTooltip>
                  <button
                    className="work-card"
                    onClick={() => setActiveWork((current) => (current === work.id ? null : work.id))}
                    type="button"
                  >
                    <img src={work.image} alt={`${work.title}作品封面`} loading="lazy" decoding="async" draggable={false} />
                    <div>
                      <h3><Shine text={work.title} variant="title" /></h3>
                    </div>
                  </button>
                  </TiltedCard>
                </BorderGlow>
                <div className={isVerticalExpand ? 'work-detail work-detail-drop' : 'work-detail work-detail-push'}>
                  {work.items.map((item, index) => (
                    <BorderGlow
                      borderRadius={16}
                      className="work-square-glow"
                      glowRadius={28}
                      key={`${work.id}-detail-${index}`}
                      style={{ '--index': index } as CSSProperties}
                    >
                      <button className="work-square" onClick={() => playOnHeroScreen(item.video)} type="button">
                        <img
                          src={item.image}
                          alt={`${work.title}细分作品 ${index + 1}`}
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                        />
                      </button>
                    </BorderGlow>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="strength-section section-frame" id="strengths">
        <div className="title-row">
          <div>
            <h2 className="section-heading english"><Shine text="CORE STRENGTHS ↘" variant="title" /></h2>
            <p><Shine text="个人优势" variant="muted" /></p>
          </div>
        </div>
        <div className="strength-grid">
          {strengths.map((item, index) => (
            <BorderGlow
              animated={index < 2}
              borderRadius={28}
              className="core-card"
              glowRadius={44}
              key={item.title}
            >
              <TiltedCard captionText={item.title} rotateAmplitude={5.5} scaleOnHover={1.014} showTooltip>
                <div className="core-card-content">
              <div className="card-topline">
                <span><Shine text={String(index + 1).padStart(2, '0')} variant="lime" /></span>
                <em><Shine text={item.tag} variant="muted" /></em>
              </div>
              <h3><Shine text={item.title} variant="title" /><i /></h3>
              <p><Shine text={item.text} variant="muted" /></p>
                </div>
              </TiltedCard>
            </BorderGlow>
          ))}
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-copy">
          <p><Shine text="联系方式" variant="muted" /></p>
          <h2>
            <Shine text="LET'S BUILD" variant="title" />
            <span><Shine text="BETTER VISUAL" variant="title" /></span>
            <span><Shine text="SYSTEMS ↘" variant="title" /></span>
          </h2>
          <BorderGlow className="brand-badge-glow" borderRadius={999} glowRadius={22}>
            <a className="brand-badge" href={douyinSearchUrl} target="_blank" rel="noreferrer">
              <Shine text="碎碎念-AIGC" variant="lime" />
            </a>
          </BorderGlow>
        </div>
        <BorderGlow className="contact-card" borderRadius={28} glowRadius={46} animated>
          <h3><Shine text="CONTACT" variant="lime" /></h3>
          <dl>
            <div>
              <dt><Shine text="抖音号：" variant="muted" /></dt>
              <dd><Shine text="82660096353" variant="body" /></dd>
            </div>
            <div>
              <dt><Shine text="账号名：" variant="muted" /></dt>
              <dd><Shine text="碎碎念-AIGC" variant="body" /></dd>
            </div>
            <div>
              <dt><Shine text="方向：" variant="muted" /></dt>
              <dd><Shine text="Visual / AI Design" variant="body" /></dd>
            </div>
          </dl>
          <p><Shine text="Visual, Video & AIGC Design" variant="muted" /></p>
          <BorderGlow className="qr-box-glow" borderRadius={18} glowRadius={28}>
            <a className="qr-box" href={douyinSearchUrl} target="_blank" rel="noreferrer" aria-label="打开抖音搜索">
              {Array.from({ length: 49 }).map((_, index) => (
                <span key={index} />
              ))}
            </a>
          </BorderGlow>
        </BorderGlow>
      </section>
      </main>
    </ClickSpark>
  )
}

export default App
