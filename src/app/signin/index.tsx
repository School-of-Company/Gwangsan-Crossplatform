import { Redirect } from 'expo-router';

// 별칭/비밀번호가 각자 실제 라우트(/signin/nickname, /signin/password)로 분리되면서
// /signin 자체는 더 이상 화면을 직접 렌더링하지 않는다. 앱 내부 이동은 모두
// /signin/nickname을 직접 가리키도록 이미 바꿔뒀지만, 과거 알림/딥링크 등으로 이 경로에
// 그대로 진입하는 경우를 위한 안전장치로 남겨둔다.
export default function Signin() {
  return <Redirect href="/signin/nickname" />;
}
