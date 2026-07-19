'use client'

import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'

const TESTIMONIALS = [
  {
    quote: "As a busy international speaker, my reputation is dependent upon reliable logistics. I have used Simon's services for a number of years, and have been absolutely delighted on every occasion. Simon is extremely professional, 100% reliable, and balances all this with a friendly and personable manner.",
    name: 'Jamil Qureshi',
    role: 'International Speaker',
  },
  {
    quote: "We have been using T&L Executive Cars both for family trips to London and airport transfers, for some years. Their service has always been friendly and reliable. It does take some of the pressure off any journey when you know that the car you have organised will arrive in plenty of time.",
    name: 'Ken Spry',
    role: 'Client',
  },
  {
    quote: "I have been a client of Simon Burns and T&L Executive Cars for many years, initially for my personal executive car needs but then after experiencing their extraordinarily professional service, I began using them for my business requirements as well.",
    name: 'Peter Joarder',
    role: 'Chapman Freeborn',
  },
]

const VEHICLES = [
  { name: 'Mercedes E Class', passengers: 4, bags: 3, desc: 'Our executive saloon. Perfect for airport transfers and business travel.', image: '/car-eclass.jpg' },
  { name: 'Mercedes S Class', passengers: 4, bags: 3, desc: 'The ultimate in luxury. First class comfort for VIP and corporate clients.', image: '/car-sclass.jpg' },
  { name: 'Mercedes V Class', passengers: 7, bags: 7, desc: 'Spacious and comfortable. Ideal for families and small groups.', image: '/car-vclass.jpg' },
  { name: 'Tourneo Custom Executive Spec', passengers: 8, bags: 8, desc: 'Our executive minibus. Perfect for larger groups and events.', image: '/car-tourneo.jpg' },
]

const AIRPORTS = ['Heathrow', 'Gatwick', 'London City', 'Luton', 'Stansted', 'Southend']

const JOURNEYS = [
  { label: 'Airport Transfers', serviceIdx: 0, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg> },
  { label: 'Theatre Trips', serviceIdx: 4, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M2 4h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4z"/><path d="M2 4l10 8 10-8"/><circle cx="8" cy="14" r="1.5"/><circle cx="16" cy="14" r="1.5"/></svg> },
  { label: 'Business Meetings', serviceIdx: 1, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M20 7H4a2 2 0 0 0-2 2v10h20V9a2 2 0 0 0-2-2z"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="2" y1="13" x2="22" y2="13"/></svg> },
  { label: 'Special Occasions', serviceIdx: 2, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M8 22h8l-4-10L8 22z"/><path d="M12 12V2"/><path d="M7 7c3-3 8 0 5 5"/><path d="M17 7c-3-3-8 0-5 5"/></svg> },
  { label: 'Weddings', serviceIdx: 3, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> },
  { label: 'Race Days', serviceIdx: 5, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> },
  { label: 'Sporting Events', serviceIdx: 6, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><line x1="2" y1="12" x2="22" y2="12"/></svg> },
  { label: 'Cruise Terminals', serviceIdx: 7, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M2 20l2-2h16l2 2"/><path d="M4 18V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10"/><path d="M12 6V3"/><path d="M8 6V4"/><path d="M16 6V4"/><line x1="4" y1="12" x2="20" y2="12"/></svg> },
  { label: 'Restaurant Evenings', serviceIdx: 8, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg> },
  { label: 'Long Distance', serviceIdx: 9, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg> },
  { label: 'Concerts & Gigs', serviceIdx: 10, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> },
  { label: 'Hospital Visits', serviceIdx: 11, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M3 3h18v18H3z"/><path d="M12 8v8"/><path d="M8 12h8"/></svg> },
]

const AREAS = ['Theydon Bois', 'Loughton', 'Epping', 'Abridge', 'Ongar', 'Buckhurst Hill', 'Chigwell', 'Woodford Green']

const SERVICES = [
  { title: 'Airport Transfers', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>, desc: 'Reliable transfers to and from all major London airports including Heathrow, Gatwick, London City, Luton, Stansted and Southend.', details: ['Flight tracking as standard — we monitor delays', 'Meet & greet service available', 'Fixed prices — no surge or hidden charges', 'Early morning and late night availability'] },
  { title: 'Corporate Travel', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M20 7H4a2 2 0 0 0-2 2v10h20V9a2 2 0 0 0-2-2z"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="2" y1="13" x2="22" y2="13"/></svg>, desc: 'Professional and discreet service for businesses of all sizes. We understand the importance of punctuality and presentation.', details: ['Corporate account billing available', 'Confidential and discreet vehicles', 'Multi-stop and full-day hire options', 'Regular commute packages'] },
  { title: 'Special Occasions', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M8 22h8l-4-10L8 22z"/><path d="M12 12V2"/><path d="M7 7c3-3 8 0 5 5"/><path d="M17 7c-3-3-8 0-5 5"/></svg>, desc: 'Make every journey part of the celebration. From birthdays to anniversaries, we ensure you arrive in style.', details: ['Celebration packages available', 'Chilled refreshments on request', 'Flexible scheduling for long events', 'Red carpet drop-off service'] },
  { title: 'Weddings', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>, desc: 'Your special day deserves a special journey. We provide elegant, reliable transport for the entire wedding party.', details: ['Bridal car with ribbons and decoration', 'Guest shuttle service available', 'Venue-to-venue transfers', 'Flexible timing for photos and delays'] },
  { title: 'Theatre Trips', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>, desc: 'Door-to-door service for West End shows and London entertainment. No parking stress, no last-minute rush.', details: ['Drop-off at the venue door', 'Waiting service or scheduled pick-up', 'Dinner and show packages', 'Group bookings for parties'] },
  { title: 'Race Days', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>, desc: 'Arrive at Ascot, Cheltenham or Newmarket in style. We handle the driving so you can enjoy the day.', details: ['All major UK racecourses covered', 'Full-day hire with flexible pick-up', 'Group transport for up to 8 guests', 'Post-event patience — we wait for you'] },
  { title: 'Sporting Events', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><line x1="2" y1="12" x2="22" y2="12"/></svg>, desc: 'From Wembley to Twickenham, the O2 to Lords — we get you there and back without the hassle of parking or public transport.', details: ['Coverage for all major London & UK venues', 'Pre-match drop-off, post-match pick-up', 'Group bookings for up to 8 supporters', 'No surge pricing after the final whistle'] },
  { title: 'Cruise Terminals', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M2 20l2-2h16l2 2"/><path d="M4 18V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10"/><path d="M12 6V3"/><path d="M8 6V4"/><path d="M16 6V4"/><line x1="4" y1="12" x2="20" y2="12"/></svg>, desc: 'Start your cruise holiday stress-free. We provide comfortable transfers to Southampton, Tilbury, Dover and Harwich.', details: ['All major UK cruise ports covered', 'Luggage space for extended trips', 'Early morning departures — no problem', 'Return transfers when your ship docks'] },
  { title: 'Restaurant Evenings', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>, desc: 'Enjoy your evening without worrying about driving. Door-to-door service so everyone can relax and enjoy themselves.', details: ['No designated driver needed', 'Wait or scheduled return pick-up', 'Perfect for dinner parties and celebrations', 'London restaurant transfers a speciality'] },
  { title: 'Long Distance', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>, desc: 'Going further afield? We cover journeys across the UK. Sit back and relax while we handle the miles.', details: ['Nationwide coverage — anywhere in the UK', 'Comfortable vehicles for longer journeys', 'Competitive rates for distance travel', 'Regular routes to Midlands, North & beyond'] },
  { title: 'Concert & Gigs', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>, desc: 'From the O2 to Wembley Arena, we take the stress out of live music. No parking queues, no night buses home.', details: ['All major London & UK music venues', 'Drop-off at the door, pick-up after the show', 'Late night availability — no curfew', 'Group bookings for up to 8 guests'] },
  { title: 'Hospital Visits', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M3 3h18v18H3z"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>, desc: 'Reliable and compassionate transport for hospital appointments and visits. We understand these journeys matter.', details: ['Punctual — we know timing is critical', 'Patient and caring service', 'Door-to-door assistance available', 'Regular appointment bookings welcome'] },
]

export default function Home() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', pickup: '', destination: '', date: '', returnDate: '', passengers: '1', bags: '1', vehicle: '', message: '' })
  const [tripType, setTripType] = useState<'one-way' | 'return'>('one-way')
  const [selectedCar, setSelectedCar] = useState<number | null>(null)
  const [activeService, setActiveService] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function submitEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitState === 'sending') return
    setSubmitState('sending')

    const journey = [
      `${tripType === 'return' ? 'Return journey' : 'One-way journey'} from ${formData.pickup} to ${formData.destination}`,
      `Travel date: ${formData.date}${tripType === 'return' && formData.returnDate ? `; return: ${formData.returnDate}` : ''}`,
      `${formData.passengers} passenger(s), ${formData.bags} checked bag(s)`,
      formData.vehicle ? `Preferred vehicle: ${formData.vehicle}` : '',
      `Phone: ${formData.phone}`,
      formData.message,
    ].filter(Boolean).join('\n')

    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, message: journey, website: '' }),
      })
      if (!response.ok) throw new Error('Could not send enquiry')
      setSubmitState('sent')
      setFormData({ name: '', email: '', phone: '', pickup: '', destination: '', date: '', returnDate: '', passengers: '1', bags: '1', vehicle: '', message: '' })
    } catch {
      setSubmitState('error')
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-[#171717]">
      {/* Nav */}
      <nav className={`fixed left-0 right-0 top-0 z-50 border-b transition-all duration-300 ${scrolled ? 'border-black/10 bg-white/95 shadow-sm backdrop-blur-xl' : 'border-black/5 bg-white/88 backdrop-blur-md'}`}>
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between px-4 py-2.5 md:px-6">
          <a href="/" className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-white shadow-sm md:h-14 md:w-14">
              <img src="/logo.jpg" alt="T&L Executive Cars" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h1 data-anyos="brand.name" className="text-[13px] font-semibold leading-tight tracking-wide text-[#171717] md:text-base">Theydon & Loughton Executive Cars</h1>
              <p data-anyos="brand.strapline" className="mt-0.5 text-[9px] uppercase tracking-[0.16em] text-[#667085] md:text-[10px]">Theydon Bois &middot; Est. 2008</p>
            </div>
          </a>
          <div className="flex items-center gap-4 md:gap-6 flex-shrink-0 ml-3">
            <a href="#fleet" className="hidden text-sm text-[#667085] transition hover:text-[#171717] md:block">Our Fleet</a>
            <a href="#testimonials" className="hidden text-sm text-[#667085] transition hover:text-[#171717] md:block">Reviews</a>
            <a href="#quote" className="whitespace-nowrap rounded-full bg-[#171717] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-black md:px-6 md:text-sm">
              Get a Quote
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pb-0 pt-0">
        <div className="tl-hero relative flex min-h-[76vh] items-center border-b border-black/10">
          <div className="mx-auto w-full max-w-7xl px-6 pb-36 pt-40 md:pb-32 md:pt-44">
            <div className="max-w-2xl">
              <p data-anyos="hero.eyebrow" className="-mt-2.5 mb-6 text-xs uppercase tracking-[0.32em] text-[#667085]">Theydon Bois &middot; Essex &middot; London</p>
              <h2
                className="mb-8 text-[clamp(2.65rem,6.2vw,6.3rem)] leading-[0.95] text-[#171717]"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}
              >
                <span data-anyos="hero.title">Anywhere You Need,</span><br />
                <span data-anyos="hero.titleAccent" className="italic text-[#8d7345]">Whenever the Time.</span>
              </h2>
              <p data-anyos="hero.intro" className="mb-10 max-w-xl text-base leading-relaxed text-[#475467] md:text-lg">
                Based in Theydon Bois, we take you wherever you need to go. Airports, the city, nationwide — professional, reliable, always on time.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#quote" className="rounded-full bg-[#171717] px-8 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-black">
                  Book Now
                </a>
                <a href="tel:+447904428896" className="rounded-full border border-black/15 bg-white/75 px-8 py-3 text-sm font-medium text-[#171717] backdrop-blur-sm transition hover:border-black/30 hover:bg-white">
                  Call Us
                </a>
              </div>
            </div>
          </div>

          {/* Airport badges */}
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden border-t border-black/10 bg-white/88 backdrop-blur-xl">
            <div className="py-3">
              <div className="flex" style={{ width: 'max-content', animation: 'airportScroll 25s linear infinite' }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-6 px-4">
                    {JOURNEYS.map(j => (
                      <button
                        key={`${i}-${j.label}`}
                        onClick={() => setActiveService(j.serviceIdx!)}
                        className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border border-black/10 bg-white/60 px-3 py-1.5 text-xs text-[#667085] transition hover:border-black/25 hover:text-[#171717]"
                      >
                        <span className="text-[#8d7345]" aria-hidden="true">{j.icon}</span>
                        {j.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar — Real Numbers */}
      <section className="border-b border-black/10 bg-[#f1ece3] py-0">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { num: '17+', label: 'Years of Service', sub: 'Est. 2008' },
              { num: '15,000+', label: 'Journeys Completed', sub: 'And counting' },
              { num: '100%', label: 'Reliability Rate', sub: 'Never late' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-[#171717] md:text-3xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{s.num}</div>
                <div className="text-sm font-medium text-[#171717]">{s.label}</div>
                <div className="mt-0.5 text-xs text-[#667085]">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services — Grid of 6 with modals */}
      <section className="px-6 py-20 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p data-anyos="services.eyebrow" className="mb-3 text-xs uppercase tracking-[0.3em] text-[#667085]">What We Offer</p>
            <h3
              data-anyos="services.title"
              className="text-3xl text-[#171717] md:text-4xl"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              We Are Tailored to Your Needs
            </h3>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {SERVICES.map((s, idx) => (
              <button
                key={s.title}
                onClick={() => setActiveService(idx)}
                className="group cursor-pointer rounded-xl border border-black/10 bg-white p-4 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:-translate-y-0.5 hover:border-black/20 hover:shadow-md md:p-5"
              >
                <div className="flex justify-center mb-3 text-black/40 group-hover:text-black/70 transition">
                  {s.icon}
                </div>
                <p data-anyos={`services.${idx}.title`} className="text-[11px] font-medium leading-tight text-[#475467] md:text-xs">{s.title}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Service Modal */}
      {activeService !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          onClick={() => setActiveService(null)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setActiveService(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/40 hover:text-black hover:bg-black/10 transition"
            >
              ✕
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4 text-black/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#171717]">
                <div className="text-white [&>svg]:w-5 [&>svg]:h-5">
                  {SERVICES[activeService].icon}
                </div>
              </div>
            </div>

            {/* Title */}
            <h4
              data-anyos={`services.${activeService}.title`}
              className="text-2xl text-center text-black mb-3"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {SERVICES[activeService].title}
            </h4>

            {/* Description */}
            <p data-anyos={`services.${activeService}.description`} className="mb-6 text-center text-sm leading-relaxed text-[#667085]">
              {SERVICES[activeService].desc}
            </p>

            {/* Details list */}
            <ul className="space-y-3 mb-8">
              {SERVICES[activeService].details.map(d => (
                <li key={d} className="flex items-start gap-3 text-sm text-black/60">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#c9a96e' }} />
                  {d}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <a
              href="#quote"
              onClick={() => setActiveService(null)}
              className="block w-full py-3 rounded-xl text-sm font-semibold text-white text-center transition hover:scale-[1.01]"
              style={{ background: '#171717' }}
            >
              Get a Quote
            </a>
          </div>
        </div>
      )}

      {/* Fleet — Scrolling like testimonials */}
      <section id="fleet" className="tl-surface-grid overflow-hidden border-y border-black/5 py-20 md:py-24">
        <div className="px-6 mb-12">
          <div className="max-w-6xl mx-auto text-center">
            <p data-anyos="fleet.eyebrow" className="mb-3 text-xs uppercase tracking-[0.3em] text-[#667085]">Our Fleet</p>
            <h3
              data-anyos="fleet.title"
              className="text-3xl text-[#171717] md:text-4xl"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Licensed & Discreet
            </h3>
            <p data-anyos="fleet.intro" className="mx-auto mt-3 max-w-lg text-sm text-[#667085]">
              All vehicles are licensed and exempt from displaying private hire plates.
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="flex gap-4 md:gap-6 fleet-scroll" style={{ width: 'max-content', animation: 'fleetScroll 20s linear infinite' }}>
            {[...Array(3)].map((_, setIdx) => (
              <div key={setIdx} className="flex gap-4 md:gap-6 pl-4 md:pl-6">
                {VEHICLES.map(v => (
                  <div key={`${setIdx}-${v.name}`} className="w-[300px] flex-shrink-0 overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm md:w-[380px]">
                    <div className="aspect-[16/10] relative overflow-hidden">
                      <img src={v.image} alt={v.name} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <p data-anyos={`fleet.${v.name.toLowerCase().replaceAll(' ', '-')}.name`} className="mb-2 text-sm font-semibold text-white">{v.name}</p>
                        <div className="flex gap-2">
                          <span className="flex items-center gap-1.5 bg-white/95 text-[#171717] text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                            👤 {v.passengers} Passengers
                          </span>
                          <span className="flex items-center gap-1.5 bg-white/95 text-[#171717] text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                            🧳 {v.bags} Bags
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <p data-anyos={`fleet.${v.name.toLowerCase().replaceAll(' ', '-')}.description`} className="text-sm leading-relaxed text-[#667085]">{v.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>


      </section>

      {/* Clients — Scrolling logos */}
      <section className="py-16 md:py-20 border-t border-black/5 overflow-hidden bg-white">
        <div className="px-6 mb-10">
          <div className="max-w-5xl mx-auto text-center">
            <p data-anyos="clients.eyebrow" className="mb-3 text-xs uppercase tracking-[0.3em] text-[#667085]">Trusted By</p>
            <h3
              data-anyos="clients.title"
              className="text-3xl text-[#171717] md:text-4xl"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Some of Our Clients
            </h3>
          </div>
        </div>

        <div className="relative bg-white">
          <div className="flex items-center client-marquee">
            {[...Array(4)].map((_, setIdx) => (
              <div key={setIdx} className="flex items-center gap-14 md:gap-20 px-10 flex-shrink-0" aria-hidden={setIdx > 0}>
                {[
                  { name: 'London Speaker Bureau', src: '/clients/londonspeakerbureau.jpg' },
                  { name: 'Speakers Corner', src: '/clients/speakerscorner.jpg' },
                  { name: 'Jamil Qureshi', src: '/clients/jamilqureshi.jpg' },
                  { name: 'The Jockey Club', src: '/clients/jockeyclub.jpg' },
                  { name: 'EndemolShine Group', src: '/clients/endemolshine.jpg' },
                  { name: 'Chapman Freeborn', src: '/clients/chapmanfreeborn.jpg' },
                  { name: 'JLA', src: '/clients/jla.jpg' },
                  { name: 'GB Helicopters', src: '/clients/gbhelicopters.jpg' },
                  { name: 'Fresh Partners', src: '/clients/freshpartners.jpg' },
                  { name: 'Precision', src: '/clients/precision.jpg' },
                ].map(c => (
                  <div
                    key={`${setIdx}-${c.name}`}
                    className="flex-shrink-0 flex items-center justify-center h-24"
                  >
                    <img src={c.src} alt={c.name} className="h-16 md:h-24 w-auto max-w-[280px] object-contain" loading="eager" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials — Scrolling */}
      <section id="testimonials" className="py-20 md:py-28 border-t border-black/5 overflow-hidden">
        <div className="px-6 mb-12">
          <div className="max-w-5xl mx-auto text-center">
            <p data-anyos="testimonials.eyebrow" className="mb-3 text-xs uppercase tracking-[0.3em] text-[#667085]">What Our Clients Say</p>
            <h3
              data-anyos="testimonials.title"
              className="text-3xl text-[#171717] md:text-4xl"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Trusted Since 2008
            </h3>
          </div>
        </div>

        <div className="relative">
          <div className="flex gap-4 md:gap-6 testimonial-scroll" style={{ width: 'max-content', animation: 'testimonialScroll 30s linear infinite' }}>
            {[...Array(2)].map((_, setIdx) => (
              <div key={setIdx} className="flex gap-4 md:gap-6 pl-4 md:pl-6">
                {TESTIMONIALS.map(t => (
                  <div key={`${setIdx}-${t.name}`} className="w-[320px] flex-shrink-0 rounded-xl border border-black/10 bg-white p-6 shadow-sm md:w-[380px] md:p-8">
                    <p data-anyos={`testimonials.${t.name.toLowerCase().replaceAll(' ', '-')}.quote`} className="mb-6 text-sm italic leading-relaxed text-[#667085]">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div>
                      <p data-anyos={`testimonials.${t.name.toLowerCase().replaceAll(' ', '-')}.name`} className="text-sm font-semibold text-[#171717]">{t.name}</p>
                      <p data-anyos={`testimonials.${t.name.toLowerCase().replaceAll(' ', '-')}.role`} className="text-xs text-[#667085]">{t.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / Simon */}
      <section className="border-t border-black/5 bg-[#f1ece3] px-6 py-20 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <p data-anyos="about.eyebrow" className="mb-6 text-xs uppercase tracking-[0.35em] text-[#667085]">About Us</p>
          <h3
            data-anyos="about.title"
            className="mb-8 text-3xl text-[#171717] md:text-4xl"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            A Personal Guarantee
          </h3>
          <div className="space-y-4 text-sm leading-relaxed text-[#475467] md:text-base">
            <p data-anyos="about.story">
              I founded Theydon & Loughton Executive Cars in 2008 to look after local individuals
              and businesses. Over the years I have established a very loyal client base by providing
              a friendly and professional service.
            </p>
            <p data-anyos="about.promise">
              This is something that I am committed to continuing and personally guarantee all my customers.
            </p>
            <p data-anyos="about.signoff" className="pt-4 font-medium text-[#171717]">— Simon Burns, Founder</p>
          </div>
        </div>
      </section>

      {/* Areas */}
      <section className="py-16 px-6 border-t border-black/5 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center">
          <p data-anyos="areas.title" className="mb-6 text-xs uppercase tracking-[0.3em] text-[#667085]">Areas We Cover</p>
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
            {AREAS.map(a => (
              <span key={a} className="px-3 py-1.5 rounded-full text-xs border border-black/10 text-black/60">
                {a}
              </span>
            ))}
            <span className="px-3 py-1.5 rounded-full text-xs border border-black/10 text-black/60">
              + All London Airports
            </span>
          </div>
        </div>
      </section>

      {/* Quote Form */}
      <section id="quote" className="tl-surface-grid border-t border-black/5 px-6 py-20 md:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p data-anyos="quote.eyebrow" className="mb-3 text-xs uppercase tracking-[0.3em] text-[#667085]">Get in Touch</p>
            <h3 data-anyos="quote.title" className="mb-3 text-3xl text-[#171717] md:text-4xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Request a Quote
            </h3>
            <p data-anyos="quote.intro" className="text-sm text-[#667085]">Tell us about your journey and we&apos;ll get back to you promptly.</p>
          </div>

          <form className="space-y-6" onSubmit={submitEnquiry}>

            {/* Trip Type Toggle */}
            <div className="flex justify-center">
              <div className="inline-flex rounded-full p-1 border border-black/10 bg-white">
                <button type="button" onClick={() => setTripType('one-way')}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${tripType === 'one-way' ? 'bg-[#171717] text-white shadow-md' : 'text-black/50 hover:text-black/70'}`}>
                  One Way
                </button>
                <button type="button" onClick={() => setTripType('return')}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${tripType === 'return' ? 'bg-[#171717] text-white shadow-md' : 'text-black/50 hover:text-black/70'}`}>
                  Round Trip
                </button>
              </div>
            </div>

            {/* Journey Details Card */}
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 md:p-6 space-y-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 font-semibold mb-1">Journey Details</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-black/40 font-medium mb-1.5 uppercase tracking-wider">Pick-up</label>
                  <input type="text" placeholder="Address, airport, hotel..." aria-label="Pick-up location" required
                    className="w-full px-4 py-3 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e]/20 transition bg-gray-50/50"
                    value={formData.pickup} onChange={e => setFormData({...formData, pickup: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[11px] text-black/40 font-medium mb-1.5 uppercase tracking-wider">Destination</label>
                  <input type="text" placeholder="Address, airport, hotel..." aria-label="Destination" required
                    className="w-full px-4 py-3 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e]/20 transition bg-gray-50/50"
                    value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} />
                </div>
              </div>
              <div className={`grid gap-4 ${tripType === 'return' ? 'md:grid-cols-2' : ''}`}>
                <div>
                  <label className="block text-[11px] text-black/40 font-medium mb-1.5 uppercase tracking-wider">{tripType === 'return' ? 'Outbound Date' : 'Date of Travel'}</label>
                  <input type="date" aria-label="Date of travel" required
                    className="w-full px-4 py-3 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e]/20 transition bg-gray-50/50"
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                {tripType === 'return' && (
                  <div>
                    <label className="block text-[11px] text-black/40 font-medium mb-1.5 uppercase tracking-wider">Return Date</label>
                    <input type="date" aria-label="Return date"
                      className="w-full px-4 py-3 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e]/20 transition bg-gray-50/50"
                      value={formData.returnDate} onChange={e => setFormData({...formData, returnDate: e.target.value})} />
                  </div>
                )}
              </div>
            </div>

            {/* Passengers & Bags */}
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 md:p-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 font-semibold mb-4">Passengers & Luggage</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-black/40 font-medium mb-1.5 uppercase tracking-wider">Passengers</label>
                  <div className="flex items-center gap-3 bg-gray-50/50 rounded-xl border border-black/10 px-4 py-2.5">
                    <button type="button" onClick={() => setFormData({...formData, passengers: String(Math.max(1, Number(formData.passengers) - 1))})}
                      className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-black/50 font-medium transition">−</button>
                    <span className="text-lg font-semibold text-black flex-1 text-center">{formData.passengers}</span>
                    <button type="button" onClick={() => setFormData({...formData, passengers: String(Math.min(8, Number(formData.passengers) + 1))})}
                      className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-black/50 font-medium transition">+</button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-black/40 font-medium mb-1.5 uppercase tracking-wider">Checked Bags</label>
                  <div className="flex items-center gap-3 bg-gray-50/50 rounded-xl border border-black/10 px-4 py-2.5">
                    <button type="button" onClick={() => setFormData({...formData, bags: String(Math.max(0, Number(formData.bags) - 1))})}
                      className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-black/50 font-medium transition">−</button>
                    <span className="text-lg font-semibold text-black flex-1 text-center">{formData.bags}</span>
                    <button type="button" onClick={() => setFormData({...formData, bags: String(Math.min(10, Number(formData.bags) + 1))})}
                      className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-black/50 font-medium transition">+</button>
                  </div>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[11px] text-black/40 font-medium mb-1.5 uppercase tracking-wider">Hand Luggage</label>
                  <div className="flex items-center gap-2 bg-gray-50/50 rounded-xl border border-black/10 px-4 py-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-black/30"><rect x="6" y="3" width="12" height="18" rx="2" /><path d="M6 8h12M6 16h12M10 3v2M14 3v2" /></svg>
                    <span className="text-sm text-black/50">Included with every journey</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ideal Vehicle — Visual Picker */}
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 md:p-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 font-semibold mb-4">Ideal Vehicle</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {VEHICLES.map(v => (
                  <button type="button" key={v.name} onClick={() => setFormData({...formData, vehicle: v.name})}
                    className={`rounded-xl border-2 p-3 transition-all text-center group ${formData.vehicle === v.name ? 'border-[#c9a96e] bg-[#c9a96e]/5 shadow-md' : 'border-black/5 hover:border-black/15 bg-gray-50/30'}`}>
                    <div className="h-16 md:h-20 rounded-lg overflow-hidden mb-2">
                      <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                    </div>
                    <p className={`text-xs font-semibold mb-0.5 transition-colors ${formData.vehicle === v.name ? 'text-[#171717]' : 'text-black/70'}`}>{v.name}</p>
                    <p className="text-[10px] text-black/40">{v.passengers} pax · {v.bags} bags</p>
                    {formData.vehicle === v.name && (
                      <div className="mt-1.5">
                        <span className="inline-block w-5 h-5 rounded-full bg-[#c9a96e] text-white text-[10px] leading-5">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-black/30 text-center mt-3">Not sure? Leave blank and we&apos;ll recommend the best option for your group.</p>
            </div>

            {/* Contact Details Card */}
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 md:p-6 space-y-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 font-semibold mb-1">Your Details</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-black/40 font-medium mb-1.5 uppercase tracking-wider">Name</label>
                  <input type="text" placeholder="Full name" aria-label="Your name" required
                    className="w-full px-4 py-3 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e]/20 transition bg-gray-50/50"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[11px] text-black/40 font-medium mb-1.5 uppercase tracking-wider">Email</label>
                  <input type="email" placeholder="your@email.com" aria-label="Email address" required
                    className="w-full px-4 py-3 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e]/20 transition bg-gray-50/50"
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-black/40 font-medium mb-1.5 uppercase tracking-wider">Phone</label>
                <input type="tel" placeholder="07..." aria-label="Phone number" required
                  className="w-full px-4 py-3 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e]/20 transition bg-gray-50/50"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-[11px] text-black/40 font-medium mb-1.5 uppercase tracking-wider">Anything else?</label>
                <textarea placeholder="Flight number, special requests, accessibility needs..." aria-label="Additional details"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e]/20 transition h-20 resize-none bg-gray-50/50"
                  value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} />
              </div>
            </div>

            <button type="submit" disabled={submitState === 'sending'}
              className="w-full rounded-xl bg-[#171717] py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-black disabled:cursor-wait disabled:opacity-60">
              {submitState === 'sending' ? 'Sending enquiry...' : submitState === 'sent' ? 'Enquiry sent' : 'Request Quote'}
            </button>
            <p aria-live="polite" className={`text-center text-xs ${submitState === 'error' ? 'font-medium text-red-600' : submitState === 'sent' ? 'font-medium text-emerald-700' : 'text-[#667085]'}`}>
              {submitState === 'error' ? 'We could not send that just now. Please call 07904 428 896.' : submitState === 'sent' ? 'Thank you. Simon will be in touch shortly.' : 'We typically respond within 30 minutes during business hours.'}
            </p>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 bg-white text-[#171717]">
        <div className="px-6 py-20 md:py-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border border-black/10 bg-white shadow-sm">
                <img src="/logo.jpg" alt="T&L Executive Cars" className="w-full h-full object-cover" />
              </div>
              <h4
                data-anyos="footer.title"
                className="mb-2 text-3xl md:text-4xl"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}
              >
                Theydon & Loughton Executive Cars
              </h4>
              <p data-anyos="footer.strapline" className="text-[10px] uppercase tracking-[0.4em] text-[#667085]">Theydon Bois &middot; Est. 2008</p>
              <div className="flex items-center justify-center gap-4 mt-5">
                {[
                  { name: 'Visa', card: <svg viewBox="0 0 48 32" className="h-7 w-auto"><rect width="48" height="32" rx="4" fill="#1a1f71"/><path d="M19.5 21h-3l1.9-10h3l-1.9 10zm12.4-9.7c-.6-.2-1.5-.5-2.7-.5-3 0-5.1 1.5-5.1 3.7 0 1.6 1.5 2.5 2.6 3.1 1.2.6 1.5.9 1.5 1.4 0 .8-.9 1.1-1.8 1.1-1.2 0-1.8-.2-2.8-.6l-.4-.2-.4 2.5c.7.3 2 .6 3.3.6 3.2 0 5.2-1.5 5.2-3.8 0-1.3-.8-2.2-2.5-3-1-.5-1.7-.9-1.7-1.4 0-.5.5-1 1.7-1 1 0 1.7.2 2.2.4l.3.1.4-2.4zm7.9-.3h-2.3c-.7 0-1.3.2-1.6.9l-4.4 10.1h3.2s.5-1.4.6-1.7h3.8c.1.4.4 1.7.4 1.7h2.8l-2.5-11zm-3.7 7.1c.2-.6 1.2-3.1 1.2-3.1s.2-.7.4-1.1l.2 1s.6 2.7.7 3.2h-2.5zM17.2 11l-2.8 6.8-.3-1.5c-.5-1.7-2.1-3.6-3.9-4.5l2.7 9.2h3.2l4.8-10h-3.7z" fill="#fff"/><path d="M12.1 11H7.1l-.1.3c3.8.9 6.3 3.2 7.3 5.9l-1.1-5.3c-.2-.7-.7-.9-1.1-.9z" fill="#f9a51a"/></svg> },
                  { name: 'Mastercard', card: <svg viewBox="0 0 48 32" className="h-7 w-auto"><rect width="48" height="32" rx="4" fill="#252525"/><circle cx="19" cy="16" r="9" fill="#eb001b"/><circle cx="29" cy="16" r="9" fill="#f79e1b"/><path d="M24 9.3a9 9 0 0 0-3.4 6.7 9 9 0 0 0 3.4 6.7 9 9 0 0 0 3.4-6.7 9 9 0 0 0-3.4-6.7z" fill="#ff5f00"/></svg> },
                  { name: 'Amex', card: <svg viewBox="0 0 48 32" className="h-7 w-auto"><rect width="48" height="32" rx="4" fill="#016fd0"/><text x="24" y="18" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold" fontFamily="Arial,sans-serif">AMEX</text></svg> },
                  { name: 'Apple Pay', card: <svg viewBox="0 0 48 32" className="h-7 w-auto"><rect width="48" height="32" rx="4" fill="#000"/><path d="M15.2 11.8c-.4.5-1 .9-1.6.8-.1-.6.2-1.3.5-1.7.4-.5 1-.8 1.5-.8.1.6-.2 1.2-.4 1.7zm.4.9c-.9 0-1.6.5-2 .5s-1-.5-1.7-.5c-.9 0-1.7.5-2.1 1.2-.9 1.5-.2 3.8.6 5.1.4.6.9 1.3 1.6 1.3.6 0 .9-.4 1.6-.4.7 0 .9.4 1.6.4s1.1-.7 1.5-1.3c.5-.7.7-1.4.7-1.4-.8-.3-1-1.1-1-2.1 0-.8.4-1.5.9-1.9-.5-.7-1.3-1-2.1-.9h-.1zm7.1-.7v7.9h1.2v-2.7h1.7c1.5 0 2.6-1 2.6-2.6s-1-2.6-2.5-2.6h-3zm1.2 1h1.4c1 0 1.6.6 1.6 1.5 0 1-.6 1.6-1.6 1.6h-1.4V13zm6.6 7c.8 0 1.5-.4 1.8-1h0v.9h1.1v-3.9c0-1.1-.9-1.9-2.3-1.9-1.2 0-2.2.7-2.2 1.8h1.1c.1-.6.6-.9 1.1-.9.7 0 1.2.4 1.2 1v.4l-1.5.1c-1.4.1-2.2.7-2.2 1.7 0 1.1.8 1.8 1.9 1.8zm.3-.9c-.6 0-1-.3-1-1 0-.5.4-.9 1.2-1l1.4-.1v.5c0 .9-.7 1.6-1.6 1.6zm4.1 2.8c1.1 0 1.7-.4 2.1-1.6l2-5.6h-1.2l-1.3 4.3h0l-1.3-4.3h-1.3l1.9 5.3-.1.3c-.2.5-.4.7-.9.7h-.4v.9h.5z" fill="#fff"/></svg> },
                  { name: 'Cash', card: <svg viewBox="0 0 48 32" className="h-7 w-auto"><rect width="48" height="32" rx="4" fill="#2d8a4e"/><text x="24" y="18.5" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" fontFamily="Arial,sans-serif">£</text></svg> },
                ].map(p => (
                  <div key={p.name}>{p.card}</div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-12 mb-16">
              <div className="text-center md:text-left">
                <h5 className="mb-4 text-[10px] uppercase tracking-[0.25em] text-[#98a2b3]">Contact</h5>
                <div className="space-y-2 text-sm text-[#667085]">
                  <a href="tel:+447904428896" className="block transition hover:text-[#171717]">07904 428 896</a>
                  <a href="mailto:simonemburns@gmail.com" className="block transition hover:text-[#171717]">simonemburns@gmail.com</a>
                  <p data-anyos="footer.location">Theydon Bois, Essex</p>
                </div>
              </div>
              <div className="text-center">
                <h5 className="mb-4 text-[10px] uppercase tracking-[0.25em] text-[#98a2b3]">Services</h5>
                <div className="space-y-2 text-sm text-[#667085]">
                  <p>Airport Transfers</p>
                  <p>Corporate Travel</p>
                  <p>Special Occasions</p>
                </div>
              </div>
              <div className="text-center md:text-right">
                <h5 className="mb-4 text-[10px] uppercase tracking-[0.25em] text-[#98a2b3]">Legal</h5>
                <div className="space-y-2 text-sm text-[#667085]">
                  <a href="/privacy" className="block transition hover:text-[#171717]">Privacy Policy</a>
                  <a href="/cookies" className="block transition hover:text-[#171717]">Cookies Policy</a>
                </div>
              </div>
            </div>

            <div className="border-t border-black/10 pt-8 text-center">
              <p className="text-[11px] text-[#98a2b3]">
                © {new Date().getFullYear()} Theydon & Loughton Executive Cars. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
