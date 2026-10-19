import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { PLATES, type PlateName } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Photo credits',
  description: 'Credits and licences for the photographs used on this website.',
  alternates: { canonical: '/credits' },
}

// Photographs in use outside the opening scene ('day' and 'night' are retired).
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
          The opening film (a black Mercedes-Benz S-Class on a hilltop road as night falls over London) is generated, not filmed. Its
          frames were made with Nano Banana Pro and GPT Image, and the motion with Kling 3.0, all through OpenArt, starting from a
          picture of the model. It shows a representative car, not our own, and its “TLE” number plate is illustrative.
        </p>
      </section>
      <section>
        <h2>Brand and vehicles</h2>
        <p>
          The Theydon &amp; Loughton Executive Cars badge is the business’s own logo. The vehicle pictures show each model in the fleet and
          are not photographs of our own cars. The E-Class, S-Class and Tourneo Custom studio pictures were generated from the
          manufacturers’ model pictures; the V-Class picture is the model render. All four are shown together in one studio, at
          their true relative size.
        </p>
      </section>
    </LegalPage>
  )
}
