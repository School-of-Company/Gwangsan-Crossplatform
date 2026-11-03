/**
 * import 경로(`~/` 별칭·상대경로)를 src 기준 경로 조각으로 푸는 FSD lint 규칙 공용 헬퍼.
 */
const path = require('path');

const LAYER_RANK = { shared: 1, entity: 2, widget: 3, view: 4, app: 5 };
const SLICED_LAYERS = new Set(['entity', 'widget', 'view']);

const toSrcSegments = (absolutePath) => {
  const normalized = absolutePath.split(path.sep).join('/');
  const index = normalized.lastIndexOf('/src/');
  if (index === -1) return null;
  return normalized.slice(index + '/src/'.length).split('/');
};

// 외부 패키지면 null, src 안이면 ['entity', 'chat', 'model', ...] 형태
const resolveImportSegments = (source, filename) => {
  if (source.startsWith('~/')) return source.slice(2).split('/');
  if (source.startsWith('.')) return toSrcSegments(path.resolve(path.dirname(filename), source));
  return null;
};

const describe = (segments) => {
  if (!segments || !(segments[0] in LAYER_RANK)) return null;
  return { layer: segments[0], slice: segments[1] ?? '' };
};

module.exports = { LAYER_RANK, SLICED_LAYERS, toSrcSegments, resolveImportSegments, describe };
