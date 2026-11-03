/**
 * FSD 레이어 경계를 강제하는 로컬 ESLint 규칙.
 *
 * 레이어: app → view → widget → entity → shared (위에서 아래로만 import할 수 있다)
 * - 위 레이어를 import하면 안 된다. 예: entity가 widget/view를, shared가 entity를 import
 * - view·widget·entity는 같은 레이어의 다른 슬라이스를 import하면 안 된다. 예: widget/chat → widget/write
 *
 * `~/` 별칭과 상대경로를 모두 실제 경로로 풀어서 판단한다.
 */
const path = require('path');
const {
  LAYER_RANK,
  SLICED_LAYERS,
  toSrcSegments,
  resolveImportSegments,
  describe,
} = require('./srcPath');

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
      const target = describe(resolveImportSegments(source, filename));
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
