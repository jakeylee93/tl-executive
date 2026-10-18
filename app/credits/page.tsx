import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { JOURNEY } from '@/lib/journey'
import { PLATES, type PlateName } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Photo credits',
  description: 'Credits and licences for the photographs used on this website.',
  alternates: { canonical: '/credits' },
}

const JOURNEY_USE: Record<(typeof JOURNEY)[number]['id'], string> = {
  arrival: 'Opening scene: the car',
  cabin: 'Opening scene: the cabin',
  road: 'Opening scene: the motorway at night',
}

// Plates still in use outside the opening scene ('day' is retired; 'night'
// is credited as the opening scene's road).
const USES: Partial<Record<PlateName, string>> = {
  airport: 'Services: airports and travel',
  london: 'Services: business and London',
  village: 'Services: occasions and events',
  forest: 'About: Epping Forest',
}

export default function Credits() {
  return (
    <LegalPage title="Photo credits" updated="October 2026">
      <section>
        <p>
          The photographs below are by the photographers named, used under Creative Commons licences or dedicated to the public domain.
          Each has been cropped, resized and colour-graded for this website, and the car’s registration plate has been blurred; adapted
          versions are shared under the same licence as the original.
        </p>
      </section>
      <section>
        <h2>Photographs</h2>
        <ul>
          {JOURNEY.map(s => (
            <li key={s.id}>
              <a href={s.credit.source}>{s.credit.title}</a> by {s.credit.author}, <a href={s.credit.licenseUrl}>{s.credit.license}</a>. {JOURNEY_USE[s.id]}.
            </li>
          ))}
          {(Object.keys(USES) as PlateName[]).map(name => {
            const c = PLATES[name].credit
            return (
              <li key={name}>
                <a href={c.source}>{c.title}</a> by {c.author}, {c.license}. {USES[name]}.
              </li>
            )
          })}
        </ul>
        <p>
          Licences: <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA 2.0</a>,{' '}
          <a href="https://creativecommons.org/licenses/by/2.0/">CC BY 2.0</a>, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> and{' '}
          <a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0</a>.
        </p>
      </section>
      <section>
        <h2>Brand and vehicles</h2>
        <p>
          The Theydon &amp; Loughton Executive Cars badge is the business’s own logo. The vehicle pictures show each model in the fleet and
          are not photographs of our own cars. The E-Class, S-Class and Tourneo Custom studio pictures were generated from the
          manufacturers’ model pictures; the V-Class picture is the model render.
        </p>
      </section>
    </LegalPage>
  )
}
