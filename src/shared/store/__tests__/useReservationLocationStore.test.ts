import { useReservationLocationStore } from '../useReservationLocationStore';

beforeEach(() => {
  useReservationLocationStore.getState().reset();
});

describe('초기 상태', () => {
  it('좌표, 주소, 장소명이 모두 초기값이다', () => {
    const state = useReservationLocationStore.getState();
    expect(state.latitude).toBeNull();
    expect(state.longitude).toBeNull();
    expect(state.address).toBe('');
    expect(state.placeName).toBe('');
  });
});

describe('setCoordinates', () => {
  it('위도, 경도, 주소를 설정한다', () => {
    useReservationLocationStore.getState().setCoordinates(35.1234, 126.5678, '광주 광산구');

    const state = useReservationLocationStore.getState();
    expect(state.latitude).toBe(35.1234);
    expect(state.longitude).toBe(126.5678);
    expect(state.address).toBe('광주 광산구');
  });

  it('placeName에는 영향을 주지 않는다', () => {
    useReservationLocationStore.getState().setPlaceName('상무역 2번 출구');
    useReservationLocationStore.getState().setCoordinates(35.1, 126.1, '주소');

    expect(useReservationLocationStore.getState().placeName).toBe('상무역 2번 출구');
  });

  it('여러 번 호출하면 마지막 값으로 갱신된다', () => {
    useReservationLocationStore.getState().setCoordinates(1, 2, '첫번째 주소');
    useReservationLocationStore.getState().setCoordinates(3, 4, '두번째 주소');

    const state = useReservationLocationStore.getState();
    expect(state.latitude).toBe(3);
    expect(state.longitude).toBe(4);
    expect(state.address).toBe('두번째 주소');
  });
});

describe('setPlaceName', () => {
  it('placeName을 설정한다', () => {
    useReservationLocationStore.getState().setPlaceName('상무역 2번 출구');
    expect(useReservationLocationStore.getState().placeName).toBe('상무역 2번 출구');
  });

  it('좌표/주소에는 영향을 주지 않는다', () => {
    useReservationLocationStore.getState().setCoordinates(35.1, 126.1, '주소');
    useReservationLocationStore.getState().setPlaceName('장소명');

    const state = useReservationLocationStore.getState();
    expect(state.latitude).toBe(35.1);
    expect(state.longitude).toBe(126.1);
    expect(state.address).toBe('주소');
  });
});

describe('reset', () => {
  it('모든 필드를 초기값으로 되돌린다', () => {
    useReservationLocationStore.getState().setCoordinates(35.1, 126.1, '주소');
    useReservationLocationStore.getState().setPlaceName('장소명');

    useReservationLocationStore.getState().reset();

    const state = useReservationLocationStore.getState();
    expect(state.latitude).toBeNull();
    expect(state.longitude).toBeNull();
    expect(state.address).toBe('');
    expect(state.placeName).toBe('');
  });
});
