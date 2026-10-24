import type { MetadataRoute } from 'next';

// ホーム画面に追加すると、アプリのように全画面で起動できます
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GoalDeck',
    short_name: 'GoalDeck',
    description: '目標までの毎日を、迷わず進める学習・目標管理',
    start_url: '/',
    display: 'standalone',
    background_color: '#090b16',
    theme_color: '#4f46e5',
    lang: 'ja',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
