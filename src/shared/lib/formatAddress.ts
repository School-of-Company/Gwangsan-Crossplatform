// 카카오 로컬 API가 광주/전남 통합 이후 행정구역명을 주소 맨 앞에 붙여서 반환해서
// ("전남광주통합특별시 광산구 ...") 화면에 너무 길게 나온다. 이미 다들 아는 상위
// 행정구역명이니, 그 뒤의 구/동 이하만 보여준다.
const REDUNDANT_ADDRESS_PREFIX = '전남광주통합특별시';

export const formatDisplayAddress = (address: string): string => {
  if (!address.startsWith(REDUNDANT_ADDRESS_PREFIX)) return address;
  return address.slice(REDUNDANT_ADDRESS_PREFIX.length).trim();
};
