const path = require('path');
const { RuleTester } = require('eslint');
const rule = require('../slice-public-api');

const file = (relative) => path.join('/project/src', relative);

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

ruleTester.run('slice-public-api', rule, {
  valid: [
    // 다른 슬라이스는 barrel로
    {
      code: "import { useChatRooms } from '~/entity/chat';",
      filename: file('widget/chat/ui/a.tsx'),
    },
    {
      code: "import { ChatRoomPage } from '~/view/chat';",
      filename: file('app/chatting/[id].tsx'),
    },
    { code: "import { useChatEntry } from '~/entity/chat';", filename: file('app/_layout.tsx') },
    // 같은 슬라이스 안은 상대경로·깊은 경로 모두 허용
    {
      code: "import { chatRoomKeys } from './useChatRooms';",
      filename: file('entity/chat/model/a.ts'),
    },
    { code: "import { x } from '~/entity/chat/lib/x';", filename: file('entity/chat/model/a.ts') },
    // barrel 파일은 자기 슬라이스 내부를 다시 내보낸다
    { code: "export { x } from './model/x';", filename: file('entity/chat/index.ts') },
    // shared는 슬라이스가 아니므로 내부 경로 허용
    {
      code: "import { Button } from '~/shared/ui/Button';",
      filename: file('entity/chat/ui/a.tsx'),
    },
    { code: "import React from 'react';", filename: file('entity/chat/ui/a.tsx') },
    { code: "import x from '~/entity/chat/model/x';", filename: '/project/scripts/a.js' },
  ],
  invalid: [
    {
      code: "import { useChatRooms } from '~/entity/chat/model/useChatRooms';",
      filename: file('widget/chat/ui/a.tsx'),
      errors: [{ messageId: 'deepImport' }],
    },
    {
      code: "import ChatRoomPage from '~/view/chat/ui/ChatRoomPage';",
      filename: file('app/chatting/[id].tsx'),
      errors: [{ messageId: 'deepImport' }],
    },
    {
      code: "import { getItem } from '../../../../entity/post/api/getItem';",
      filename: file('view/post/ui/PostView/index.tsx'),
      errors: [{ messageId: 'deepImport' }],
    },
    {
      code: "export { MODE } from '~/entity/post/model/mode';",
      filename: file('widget/post/model/a.ts'),
      errors: [{ messageId: 'deepImport' }],
    },
    {
      code: "import { useChatRooms } from '~/entity/chat';",
      filename: file('entity/chat/model/a.ts'),
      errors: [{ messageId: 'selfBarrel' }],
    },
    {
      code: "import { useChatRooms } from '..';",
      filename: file('entity/chat/model/a.ts'),
      errors: [{ messageId: 'selfBarrel' }],
    },
  ],
});
