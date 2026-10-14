import { measureAnchor } from '../measureAnchor';

describe('measureAnchor', () => {
  it('말풍선의 화면상 위치를 재서 돌려준다', () => {
    const onMeasured = jest.fn();
    const node = { measureInWindow: (cb: (...args: number[]) => void) => cb(10, 20, 30, 40) };

    measureAnchor(node as never, onMeasured);

    expect(onMeasured).toHaveBeenCalledWith({ x: 10, y: 20, width: 30, height: 40 });
  });

  it('잴 수 없으면 빈 위치로라도 메뉴를 열 수 있게 돌려준다', () => {
    const onMeasured = jest.fn();

    measureAnchor(null, onMeasured);

    expect(onMeasured).toHaveBeenCalledWith({ x: 0, y: 0, width: 0, height: 0 });
  });
});
