const accentColors = [
  '#00d4ff',
  '#ff00ff',
  '#39ff14',
  '#ff6600',
  '#ffdd00',
  '#ff2040',
  '#8b5cf6',
  '#00ffcc',
  '#ff69b4',
  '#00bfff',
];

export function getChannelAccent(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return accentColors[Math.abs(hash) % accentColors.length];
}
