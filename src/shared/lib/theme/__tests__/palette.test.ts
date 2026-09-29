import fs from 'fs';
import path from 'path';
import { palette, THEME_COLOR_KEYS } from '../palette';

const css = fs.readFileSync(path.resolve(__dirname, '../../../../../global.css'), 'utf8');

const toRgbChannels = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ');

const readVariables = (block: string) =>
  Object.fromEntries(
    Array.from(block.matchAll(/--color-([\w-]+):\s*([\d ]+);/g)).map(([, key, value]) => [
      key,
      value.trim(),
    ])
  );

const [lightBlock, darkBlock] = css.split('@media (prefers-color-scheme: dark)');

describe('theme palette', () => {
  it.each(THEME_COLOR_KEYS)('라이트 %s 값이 global.css와 같다', (key) => {
    expect(readVariables(lightBlock)[key]).toBe(toRgbChannels(palette.light[key]));
  });

  it.each(THEME_COLOR_KEYS)('다크 %s 값이 global.css와 같다', (key) => {
    expect(readVariables(darkBlock)[key]).toBe(toRgbChannels(palette.dark[key]));
  });
});
