/**
 * FSD 레이어 경계를 강제하는 로컬 ESLint 규칙(#741).
 *
 * 레이어: app → view → widget → entity → shared (위에서 아래로만 import할 수 있다)
 * - 위 레이어를 import하면 안 된다. 예: entity가 widget/view를, shared가 entity를 import
 * - view·widget·entity는 같은 레이어의 다른 슬라이스를 import하면 안 된다. 예: widget/chat → widget/write
 *
 * `~/`, `@/` 별칭과 상대경로를 모두 실제 경로로 풀어서 판단한다.
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

const describe = (segments) => {
  if (!segments || !(segments[0] in LAYER_RANK)) return null;
  return { layer: segments[0], slice: segments[1] ?? '' };
};

const resolveTarget = (source, filename) => {
  if (source.startsWith('~/') || source.startsWith('@/')) {
    return describe(source.slice(2).split('/'));
  }
  if (source.startsWith('.')) {
    return describe(toSrcSegments(path.resolve(path.dirname(filename), source)));
  }
  return null;
};

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'FSD 레이어 경계(아래 방향 import, 같은 레이어 슬라이스 간 import 금지)를 강제한다',
    },
    schema: [],
    messages: {
      upward: '{{from}} 레이어에서 위 레이어인 {{to}}를 import할 수 없습니다. ({{source}})',
      crossSlice:
        '{{layer}}/{{fromSlice}}에서 같은 레이어의 다른 슬라이스 {{layer}}/{{toSlice}}를 import할 수 없습니다. ({{source}})',
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    const current = describe(toSrcSegments(path.resolve(filename)));
    if (!current) return {};

    const check = (node) => {
      if (!node.source || typeof node.source.value !== 'string') return;
      const source = node.source.value;
      const target = resolveTarget(source, filename);
      if (!target) return;

      if (LAYER_RANK[target.layer] > LAYER_RANK[current.layer]) {
        context.report({
          node: node.source,
          messageId: 'upward',
          data: { from: current.layer, to: target.layer, source },
        });
        return;
      }

      if (
        target.layer === current.layer &&
        SLICED_LAYERS.has(current.layer) &&
        target.slice !== current.slice
      ) {
        context.report({
          node: node.source,
          messageId: 'crossSlice',
          data: { layer: current.layer, fromSlice: current.slice, toSlice: target.slice, source },
        });
      }
    };

    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
    };
  },
};
