"""Write public/brand/tl-badge.svg: the static badge (default lighting) from
lib/badgePaths.ts. Mirrors components/Badge.tsx layer for layer."""
import re, sys
ts = open('lib/badgePaths.ts').read()
get = lambda k: re.search(k + r": '([^']+)'", ts).group(1)
num = lambda k: float(re.search(k + r': ([0-9.]+)', ts).group(1))
cx, cy, R, r = num('cx'), num('cy'), num('rim'), num('disc')
vb = sys.argv[1] if len(sys.argv) > 1 else get('viewBox')
LT = get('letterTransform')
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="Theydon &amp; Loughton Executive Cars">
<title>Theydon &amp; Loughton Executive Cars</title>
<defs>
<linearGradient id="rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8f8f8"/><stop offset="0.07" stop-color="#dcdcdc"/><stop offset="0.18" stop-color="#c4c4c4"/><stop offset="0.33" stop-color="#afafaf"/><stop offset="0.5" stop-color="#a6a6a6"/><stop offset="0.67" stop-color="#b6b6b6"/><stop offset="0.82" stop-color="#c3c3c3"/><stop offset="0.93" stop-color="#e0e0e0"/><stop offset="1" stop-color="#f8f8f8"/></linearGradient>
<linearGradient id="rimShade" x1="0" y1="0" x2="1" y2="0"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></linearGradient>
<linearGradient id="bevel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3a3a"/><stop offset="1" stop-color="#8d8d8d"/></linearGradient>
<radialGradient id="disc" cx="{cx}" cy="330" r="590" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#5e5e5e"/><stop offset="0.5" stop-color="#3d3d3d"/><stop offset="1" stop-color="#1b1b1b"/></radialGradient>
<linearGradient id="band" x1="35" y1="0" x2="1006" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#8a8a8a"/><stop offset="0.5" stop-color="#c8c8c8"/><stop offset="1" stop-color="#8a8a8a"/></linearGradient>
<linearGradient id="bandV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.45"/><stop offset="0.07" stop-color="#fff" stop-opacity="0"/><stop offset="0.86" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.14"/></linearGradient>
<linearGradient id="lip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a5a5a"/><stop offset="1" stop-color="#7c7c7c"/></linearGradient>
<linearGradient id="letters" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7f7f7"/><stop offset="1" stop-color="#d4d4d4"/></linearGradient>
<linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0.3" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.95"/><stop offset="0.7" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="gloss"><stop offset="0" stop-color="#fff" stop-opacity="0.5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<clipPath id="discClip"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath>
<filter id="soft" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>
<filter id="lift" x="-5%" y="-5%" width="110%" height="115%"><feDropShadow dx="1.5" dy="4" stdDeviation="2.2" flood-color="#000" flood-opacity="0.6"/></filter>
</defs>
<circle cx="{cx}" cy="{cy}" r="{R}" fill="url(#rim)"/>
<circle cx="{cx}" cy="{cy}" r="{R}" fill="url(#rimShade)"/>
<circle cx="{cx}" cy="{cy}" r="{R-0.8}" fill="none" stroke="#8a8a8a" stroke-width="1.6"/>
<circle cx="{cx}" cy="{cy}" r="{r+7}" fill="url(#bevel)"/>
<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#disc)"/>
<g clip-path="url(#discClip)"><ellipse cx="{cx-120}" cy="{cy-210}" rx="360" ry="230" fill="url(#gloss)" opacity="0.35"/></g>
<path d="{get('lightLetters')}" transform="{LT}" fill="url(#letters)" filter="url(#lift)"/>
<path d="{get('ribbonFace')}" transform="translate(0 16)" fill="#000" opacity="0.5" filter="url(#soft)"/>
<path d="{get('ribbonLip')}" fill="url(#lip)"/>
<path d="{get('ribbonFace')}" fill="url(#band)"/>
<path d="{get('ribbonFace')}" fill="url(#bandV)"/>
<path d="{get('engravedLetters')}" transform="translate(0.7 1.3) {LT}" fill="#f4f4f4" opacity="0.55"/>
<path d="{get('engravedLetters')}" transform="{LT}" fill="#272727"/>
<g transform="rotate(-8 {cx} {cy})"><circle cx="{cx}" cy="{cy}" r="{R-13}" fill="none" stroke="url(#sheen)" stroke-width="20" opacity="0.85"/></g>
</svg>
'''
out = sys.argv[2] if len(sys.argv) > 2 else 'public/brand/tl-badge.svg'
open(out, 'w').write(svg)
print(out, len(svg), 'bytes')
