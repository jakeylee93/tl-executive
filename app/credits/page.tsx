import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { PLATES, type PlateName } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Photo credits',
  description: 'Credits and licences for the photographs used on this website.',
  alternates: { canonical: '/credits' },
}

// Photographs still in use ('day', 'night', 'london' and 'village' are retired).
const USES: Partial<Record<PlateName, string>> = {
  airport: 'Airport transfers page',
  forest: 'About: Epping Forest',
}

export default function Credits() {
  return (
    <LegalPage title="Photo credits" updated="October 2026">
      <section>
        <p>
          The photographs below are by the photographers named, used under Creative Commons licences. Each has been cropped, resized and
          colour-graded for this website; adapted versions are shared under the same licence as the original.
        </p>
      </section>
      <section>
        <h2>Photographs</h2>
        <ul>
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
          Licences: <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA 2.0</a> and{' '}
          <a href="https://creativecommons.org/licenses/by/2.0/">CC BY 2.0</a>.
        </p>
      </section>
      <section>
        <h2>Opening scene</h2>
        <p>
          The opening film (a black Mercedes-Benz S-Class and a Ford Tourneo Custom on a hilltop road as night falls over London), the
          fleet film of all four vehicles on that road, and the Journeys photographs (an airport kerb, the drive into London, a
          country-house occasion) are generated, not photographed or filmed. Their frames were made with Nano Banana Pro and GPT Image,
          and the motion with Kling 3.0, all through OpenArt, starting from pictures of the models. They show representative vehicles
          and generic drivers, not our own, and the “TLE” number plates are illustrative.
        </p>
      </section>
      <section>
        <h2>Brand and vehicles</h2>
        <p>
          The Theydon &amp; Loughton Executive Cars badge is the business’s own logo. The vehicle pictures show each model in the fleet and
          are not photographs of our own cars; each was generated from the manufacturer’s model picture and placed on the same road.
        </p>
      </section>
    </LegalPage>
  )
}
