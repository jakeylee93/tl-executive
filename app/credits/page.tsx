import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { PLATES, type PlateName } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Photo credits',
  description: 'Credits and licences for the photographs used on this website.',
  alternates: { canonical: '/credits' },
}

const USES: Record<PlateName, string> = {
  day: 'Opening scene: Epping Forest by day',
  night: 'Opening scene: the M25 at night',
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
          The photographs of Epping Forest, Theydon Bois, the M25, Heathrow and Tower Bridge are by the photographers below, used under
          Creative Commons licences. Each has been cropped, resized and colour-graded for this website; those adapted versions are shared
          under the same licence as the original.
        </p>
      </section>
      <section>
        <h2>Photographs</h2>
        <ul>
          {(Object.keys(PLATES) as PlateName[]).map(name => {
            const c = PLATES[name].credit
            return (
              <li key={name}>
                <a href={c.source}>{c.title}</a> by {c.author}, {c.license}. {USES[name]}.
              </li>
            )
          })}
        </ul>
        <p>
          Licences: <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA 2.0</a> and{' '}
          <a href="https://creativecommons.org/licenses/by/2.0/">CC BY 2.0</a>.
        </p>
      </section>
      <section>
        <h2>Brand and vehicles</h2>
        <p>
          The Theydon &amp; Loughton Executive Cars badge is the business’s own logo. The vehicle pictures show each model in the fleet and
          are not photographs of our own cars.
        </p>
      </section>
    </LegalPage>
  )
}
