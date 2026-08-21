export const BENTO_HARDCODED = [
  { id: 'radio-rudina', video: '/videos/radio-rudina/clip.mp4', label: 'Radio Rudina' },
  { id: 'komod-c0086', video: '/videos/reels/komod-c0086.web.mp4', label: 'Komod' },
  { id: 'komod-052', video: '/videos/reels/komod-052.web.mp4', label: 'Komod' },
];

export const bentoBottom = (reels) => reels.slice(0, 3).map((r) => ({ id: r.id, video: r.data.video, label: r.data.title }));

export const bentoTiles = (reels) => [...BENTO_HARDCODED, ...bentoBottom(reels)];
