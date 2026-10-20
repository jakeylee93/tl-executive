'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

// One continuous shot, played by native scroll. The section pins a
// full-screen stage; scroll position 0 → 1 across its track is the video's
// time 0 → end, so scrolling back rewinds it exactly. Phones (portrait) get
// the native 9:16 file, everything else the 16:9 file. With `end` < 1 the
// video reaches its last frame at that point of the track and holds it for
// the rest (room for closing copy). With `overlap` the section starts that
// far up inside the previous one and, with `fadeIn`, its stage cross-fades in
// over the first part of its own track (transparent before), so one shot
// dissolves into the next while both are pinned. Copy blocks carry
// data-in / data-out (progress) and fade in place. With reduced motion, in
// the anyOS editor, or if the video cannot play, the poster frame and the
// copy stand still and nothing is pinned. `timeline` ([progress, fraction]
// pairs, piecewise linear) replaces the straight progress → time mapping, so
// a section can hold on chosen frames (the fleet stops on each car), and
// `onProgress` reports the pinned progress to the section's own UI.

// wide/tall omitted = a still scene: the poster is pinned with its copy, no video
export type FilmSource = { wide?: string; tall?: string; posterWide: string; posterTall: string; posterWideSet?: string; posterTallSet?: string }

const PORTRAIT = '(max-aspect-ratio: 4/5)'
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

export function FilmScene({
  id, film, track = '230svh', end = 1, overlap, fadeIn = 0, timeline, onProgress, label, children, priority = false, className = '',
}: {
  id: string; film: FilmSource; track?: string; end?: number; overlap?: string; fadeIn?: number
  timeline?: number[][]; onProgress?: (p: number) => void
  label?: string; children: ReactNode; priority?: boolean; className?: string
}) {
  const root = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const report = useRef(onProgress)
  report.current = onProgress
  const tl = timeline ? JSON.stringify(timeline) : ''

  useEffect(() => {
    const el = root.current
    if (!el) return
    const section: HTMLElement = el
    const vid = videoRef.current // null for a still scene
    const trackEl = section.querySelector<HTMLElement>('[data-film-track]')!
    const stage = section.querySelector<HTMLElement>('[data-film-stage]')!
    const copies = Array.from(section.querySelectorAll<HTMLElement>('[data-in]'))
    const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mqPortrait = window.matchMedia(PORTRAIT)
    let raf = 0
    let target = 0
    let ready = false
    let seeking = false
    let near = false
    let src = ''

    const still = () => mqReduce.matches || document.documentElement.classList.contains('anyos-editing')

    // H.264 where it plays (Safari, Chrome, Edge); the VP9 twin elsewhere
    const mp4 = !vid || vid.canPlayType('video/mp4; codecs="avc1.640028"') !== ''
    function choose() {
      if (!vid || !film.wide || !film.tall) return
      const base = mqPortrait.matches ? film.tall : film.wide
      const want = mp4 ? base : base.replace(/\.mp4$/, '.webm')
      if (want === src) return
      src = want
      ready = false
      section.dataset.ready = 'off'
      vid.src = want
      vid.load()
    }

    function progress() {
      const r = trackEl.getBoundingClientRect()
      const span = Math.max(1, trackEl.offsetHeight - stage.clientHeight)
      return clamp(-r.top / span)
    }

    function paintCopy(p: number) {
      copies.forEach(c => {
        const a = parseFloat(c.dataset.in || '0')
        const b = parseFloat(c.dataset.out || '1')
        const f = 0.06
        const o = (a <= 0 ? 1 : smooth(a, a + f, p)) * (b >= 1 ? 1 : 1 - smooth(b - f, b, p))
        c.style.opacity = String(o)
        c.style.transform = `translate3d(0, ${(1 - o) * 14}px, 0)`
        if (o < 0.5) c.setAttribute('inert', '')
        else c.removeAttribute('inert')
      })
    }

    function paintFade(p: number) {
      if (!fadeIn) return
      const o = smooth(0, fadeIn, p)
      stage.style.opacity = String(o)
      stage.style.pointerEvents = o < 0.5 ? 'none' : ''
    }

    const keys: number[][] = tl ? JSON.parse(tl) : []
    function fraction(p: number) {
      if (!keys.length) return Math.min(1, p / end)
      if (p <= keys[0][0]) return keys[0][1]
      for (let i = 1; i < keys.length; i++) {
        const [p0, f0] = keys[i - 1]
        const [p1, f1] = keys[i]
        if (p <= p1) return p1 > p0 ? f0 + ((p - p0) / (p1 - p0)) * (f1 - f0) : f1
      }
      return keys[keys.length - 1][1]
    }

    function tick() {
      raf = 0
      if (section.dataset.pin !== 'on') return
      const p = progress()
      paintCopy(p)
      paintFade(p)
      report.current?.(p)
      if (vid && ready && vid.duration) {
        target = fraction(p) * Math.max(0, vid.duration - 0.04)
        if (!seeking && Math.abs(vid.currentTime - target) > 1 / 60) {
          seeking = true
          vid.currentTime = target
        }
      }
      // keep easing towards the target while it moves
      if (vid && near && ready && Math.abs(vid.currentTime - target) > 1 / 60) raf = requestAnimationFrame(tick)
    }
    const request = () => { if (!raf) raf = requestAnimationFrame(tick) }

    function decide() {
      const pin = !still()
      section.dataset.pin = pin ? 'on' : 'off'
      if (!pin) {
        copies.forEach(c => { c.style.opacity = ''; c.style.transform = ''; c.removeAttribute('inert') })
        stage.style.opacity = ''
        stage.style.pointerEvents = ''
        return
      }
      paintFade(progress())
      if (priority || near) choose()
      request()
    }

    const onSeeked = () => { seeking = false; request() }
    const onReady = () => {
      if (!vid) return
      const v = vid
      ready = true
      section.dataset.ready = 'on'
      // some mobile browsers only decode frames after a play() call
      const pr = v.play()
      if (pr && typeof pr.then === 'function') pr.then(() => { v.pause(); request() }).catch(() => request())
      else { v.pause(); request() }
    }
    const onError = () => { section.dataset.ready = 'off' }
    if (vid) {
      vid.addEventListener('seeked', onSeeked)
      vid.addEventListener('loadeddata', onReady)
      vid.addEventListener('error', onError)
    } else {
      section.dataset.ready = 'on'
    }

    // load a shot shortly before it is reached
    const io = new IntersectionObserver(([e]) => {
      near = e.isIntersecting
      if (near && section.dataset.pin === 'on' && !src) choose()
      if (near) request()
    }, { rootMargin: '120% 0px 120% 0px' })
    io.observe(section)

    decide()
    window.addEventListener('scroll', request, { passive: true })
    window.addEventListener('resize', request)
    mqReduce.addEventListener?.('change', decide)
    mqPortrait.addEventListener?.('change', () => { if (section.dataset.pin === 'on') { choose(); request() } })
    return () => {
      io.disconnect()
      vid?.removeEventListener('seeked', onSeeked)
      vid?.removeEventListener('loadeddata', onReady)
      vid?.removeEventListener('error', onError)
      window.removeEventListener('scroll', request)
      window.removeEventListener('resize', request)
      mqReduce.removeEventListener?.('change', decide)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [film, priority, end, fadeIn, tl])

  return (
    <section
      ref={root}
      id={id}
      data-film
      data-pin="on"
      data-ready="off"
      data-overlap={overlap ? '' : undefined}
      className={`film on-photo relative text-white ${overlap ? '' : 'bg-[#08090a]'} ${className}`}
      style={overlap ? { marginTop: `calc(-1 * ${overlap})` } : undefined}
      aria-label={label}
    >
      <div className="film-track" data-film-track style={{ height: track }}>
        <div className="film-stage" data-film-stage>
          <picture>
            <source media={PORTRAIT} srcSet={film.posterTallSet || film.posterTall} sizes="100vw" type="image/webp" />
            <img
              src={film.posterWide}
              srcSet={film.posterWideSet}
              sizes="100vw"
              alt=""
              width={1920}
              height={1080}
              className="film-poster"
              decoding="async"
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
            />
          </picture>
          {film.wide && <video ref={videoRef} className="film-video" muted playsInline preload="auto" aria-hidden="true" tabIndex={-1} disablePictureInPicture />}
          <div className="film-shade" aria-hidden="true" />
          {children}
        </div>
      </div>
    </section>
  )
}
