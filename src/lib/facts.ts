// Bandfakten und offizielle Links. Das CMS (Collection "facts") liefert dieselben
// Werte; diese Datei ist der Fallback, falls das CMS nicht erreichbar ist.
export const bandFacts = {
  name: 'SCTTRD',
  url: 'https://scttrd.de',
  description: 'SCTTRD ist ein elektronisches Live-Projekt aus Augsburg zwischen Post-Punk, Techno und Trance. Dani produziert, Babsi singt und Nate spielt Drums. Die Texte sind auf Deutsch und Englisch.',
  city: 'Augsburg',
  country: 'Deutschland',
  founded: '2023',
  email: 'info@scttrd.de',
  genres: ['Post-Punk', 'Techno', 'Trance'],
  members: [
    { name: 'Dani', role: 'Produktion' },
    { name: 'Babsi', role: 'Vocals' },
    { name: 'Nate', role: 'Drums' },
  ],
  profiles: [
    { label: 'Spotify', url: 'https://open.spotify.com/artist/3MCQLvQUU8ayzroe9gBaui' },
    { label: 'SoundCloud', url: 'https://soundcloud.com/scttrd-live' },
    { label: 'Instagram', url: 'https://www.instagram.com/scttrd_ofc/' },
  ],
  title: 'SCTTRD – Fakten und offizielle Links',
  intro: 'Diese Seite bündelt die Angaben der Band als Referenz für Redaktionen, Veranstalter:innen und KI-Suchsysteme.',
  facts: [
    { label: 'Name', value: 'SCTTRD' },
    { label: 'Projekt', value: 'Elektronisches Live-Projekt' },
    { label: 'Herkunft', value: 'Augsburg, Deutschland' },
    { label: 'Seit', value: '2023' },
    { label: 'Musik', value: 'Post-Punk, Techno, Trance' },
    { label: 'Textsprachen', value: 'Deutsch und Englisch' },
    { label: 'Besetzung', value: 'Dani (Produktion), Babsi (Vocals), Nate (Drums)' },
  ],
  sections: [
    {
      heading: 'Was bedeutet SCTTRD?',
      body: 'SCTTRD ist „scattered“ ohne Vokale. Das englische Wort bedeutet verstreut oder zersplittert. Der Name wird in Großbuchstaben und ohne zusätzliche Vokale geschrieben.',
      links: [],
    },
    {
      heading: 'Wie spielt SCTTRD live?',
      body: 'Bei SCTTRD treffen elektronische Produktion, Vocals und Live-Drums aufeinander. Die Band spielt eigene Musik zwischen Post-Punk, Techno und Trance und tritt als Live-Projekt auf, nicht als DJ-Act.\n\nAktuelle Termine und vergangene Auftritte stehen unter Shows. Persönliche Rückblicke, Fotos und Mitschnitte finden sich in den News und Live-Recaps.',
      links: [
        { label: 'Shows', url: '/#shows' },
        { label: 'News und Live-Recaps', url: '/news/' },
      ],
    },
    {
      heading: 'Offizielle Profile',
      body: 'Die offizielle Website ist scttrd.de. Die oben genannten Profile gehören zum elektronischen Live-Projekt aus Augsburg.',
      links: [
        { label: 'SCTTRD auf Spotify', url: 'https://open.spotify.com/artist/3MCQLvQUU8ayzroe9gBaui' },
        { label: 'SCTTRD auf SoundCloud', url: 'https://soundcloud.com/scttrd-live' },
        { label: 'SCTTRD auf Instagram', url: 'https://www.instagram.com/scttrd_ofc/' },
        { label: 'scttrd.de', url: 'https://scttrd.de' },
      ],
    },
    {
      heading: 'Booking und Presse',
      body: 'Anfragen gehen an info@scttrd.de. Fotos, Logos und weitere Unterlagen gibt es im Pressebereich.',
      links: [
        { label: 'info@scttrd.de', url: 'mailto:info@scttrd.de' },
        { label: 'Pressebereich', url: '/styleguide/#presse' },
      ],
    },
    {
      heading: 'Quellen und Einordnung',
      body: 'Die Projektbeschreibung und Angaben zur Besetzung stammen von SCTTRD und entsprechen der Bandvorstellung auf der Startseite. Diese Seite ist eine Selbstauskunft der Band.\n\nEine externe Veranstaltungsquelle ist die Ankündigung von Radio free FM zu Sperrstunde 2.0. Sie führt SCTTRD als Act aus Augsburg im Bereich Post-Punk / Techno.',
      links: [
        { label: 'Bandvorstellung auf der Startseite', url: '/#about' },
        { label: 'Ankündigung von Radio free FM', url: 'https://www.freefm.de/artikel/sperrstunde-20-der-tiefgarage' },
      ],
    },
  ],
  researchSources: [
    { url: 'https://www.freefm.de/artikel/sperrstunde-20-der-tiefgarage' },
    { url: 'https://scttrd.de/#about' },
  ],
}

export const musicGroupSchema = {
  '@type': 'MusicGroup',
  '@id': `${bandFacts.url}/#scttrd`,
  name: bandFacts.name,
  url: bandFacts.url,
  description: bandFacts.description,
  genre: bandFacts.genres,
  foundingDate: bandFacts.founded,
  address: { '@type': 'PostalAddress', addressLocality: bandFacts.city, addressCountry: 'DE' },
  email: `mailto:${bandFacts.email}`,
  member: bandFacts.members.map(({ name, role }) => ({ '@type': 'Person', name, jobTitle: role })),
  sameAs: bandFacts.profiles.map(({ url }) => url),
}

export const footerGroupsFallback = [
  { label: 'Seiten', links: [
    { label: 'shows', url: '/#shows' },
    { label: 'news', url: '/news/' },
    { label: 'gallery', url: '/gallery/' },
  ] },
  { label: 'Material', links: [
    { label: 'press pack', url: '/styleguide/#presse' },
    { label: 'fakten', url: '/facts/' },
  ] },
  { label: 'Kontakt', links: [
    { label: 'info@scttrd.de', url: 'mailto:info@scttrd.de?subject=STTRD%20Reqzest' },
  ] },
]
