/**
 * 슬라이스(entity·widget·view의 각 폴더)의 공개 API를 강제하는 로컬 ESLint 규칙.
 *
 * - 다른 슬라이스는 그 슬라이스의 index.ts(barrel)로만 import한다. 예: `~/entity/chat` (O), `~/entity/chat/model/useChatRooms` (X)
 * - 같은 슬라이스 안에서는 자기 barrel을 import하지 않는다. barrel이 그 파일을 다시 불러와 순환 import가 된다
 * - 같은 슬라이스 안의 상대경로·깊은 경로 import는 자유롭다
 */
const path = require('path');
const { SLICED_LAYERS, toSrcSegments, resolveImportSegments, describe } = require('./srcPath');

const isBarrelPath = (segments) =>
  segments.length === 2 || (segments.length === 3 && segments[2] === 'index');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        '다른 슬라이스는 index.ts(barrel)로만 import하고, 자기 슬라이스 barrel은 import하지 않는다',
    },
    schema: [],
    messages: {
      deepImport:
        '다른 슬라이스 {{target}}의 내부 경로를 import할 수 없습니다. `~/{{target}}`(index.ts)에서 import하세요. ({{source}})',
      selfBarrel:
        '같은 슬라이스의 barrel({{target}})을 import하면 순환 import가 됩니다. 상대경로로 직접 import하세요. ({{source}})',
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    const currentSegments = toSrcSegments(path.resolve(filename));
    const current = describe(currentSegments);
    if (!current) return {};
    const currentSlice = SLICED_LAYERS.has(current.layer)
      ? `${current.layer}/${current.slice}`
      : null;
    const isBarrelFile =
      currentSlice !== null &&
      isBarrelPath(currentSegments.slice(0, 3).map((s) => s.replace(/\.tsx?$/, '')));

    const check = (node) => {
      if (!node.source || typeof node.source.value !== 'string') return;
      const source = node.source.value;
      const segments = resolveImportSegments(source, filename);
      const target = describe(segments);
      if (!target || !SLICED_LAYERS.has(target.layer)) return;
      const targetSlice = `${target.layer}/${target.slice}`;

      if (targetSlice === currentSlice) {
        if (!isBarrelFile && isBarrelPath(segments)) {
          context.report({
            node: node.source,
            messageId: 'selfBarrel',
            data: { target: targetSlice, source },
          });
        }
        return;
      }
      if (!isBarrelPath(segments)) {
        context.report({
          node: node.source,
          messageId: 'deepImport',
          data: { target: targetSlice, source },
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
