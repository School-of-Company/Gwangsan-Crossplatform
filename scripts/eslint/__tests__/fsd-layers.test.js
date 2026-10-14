const path = require('path');
const { RuleTester } = require('eslint');
const rule = require('../fsd-layers');

const file = (relative) => path.join('/project/src', relative);

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

ruleTester.run('fsd-layers', rule, {
  valid: [
    // 아래 레이어 import
    {
      code: "import { instance } from '~/shared/lib/axios';",
      filename: file('entity/chat/api/a.ts'),
    },
    {
      code: "import { useChatRooms } from '~/entity/chat';",
      filename: file('widget/chat/ui/a.tsx'),
    },
    { code: "import { ChatInput } from '@/widget/chat';", filename: file('view/chat/ui/a.tsx') },
    {
      code: "import Page from '~/view/chat/ui/ChatRoomPage';",
      filename: file('app/chatting/[id].tsx'),
    },
    // 같은 슬라이스 안
    {
      code: "import { chatRoomKeys } from './useChatRooms';",
      filename: file('entity/chat/model/a.ts'),
    },
    { code: "import { x } from '~/entity/chat/lib/x';", filename: file('entity/chat/model/a.ts') },
    // shared 하위 폴더끼리는 허용
    {
      code: "import { logger } from '../lib/logger';",
      filename: file('shared/ui/Button/index.tsx'),
    },
    // 외부 패키지는 검사하지 않음
    { code: "import React from 'react';", filename: file('shared/ui/a.tsx') },
    // src 밖 파일은 검사하지 않음
    { code: "import x from '~/view/chat';", filename: '/project/scripts/a.js' },
  ],
  invalid: [
    {
      code: "import { getChatRooms } from '@/entity/chat';",
      filename: file('shared/lib/a.ts'),
      errors: [{ messageId: 'upward' }],
    },
    {
      code: "import { getMyInformation } from '../../../view/main/api/getMyInformation';",
      filename: file('entity/main/model/a.ts'),
      errors: [{ messageId: 'upward' }],
    },
    {
      code: "export { Category } from '~/view/post/model/category';",
      filename: file('widget/post/ui/a.tsx'),
      errors: [{ messageId: 'upward' }],
    },
    {
      code: "import { MODE } from '~/widget/write/model/mode';",
      filename: file('widget/chat/model/a.ts'),
      errors: [{ messageId: 'crossSlice' }],
    },
    {
      code: "import { getTossReview } from '~/view/reviews/api/getReviews';",
      filename: file('view/chat/ui/a.tsx'),
      errors: [{ messageId: 'crossSlice' }],
    },
    {
      code: "import { useGetMyInformation } from '../../main/model/useGetMyInformation';",
      filename: file('entity/reviews/model/a.ts'),
      errors: [{ messageId: 'crossSlice' }],
    },
  ],
});
