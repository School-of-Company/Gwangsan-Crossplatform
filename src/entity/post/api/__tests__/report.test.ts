import { report } from '../report';
import { instance } from '~/shared/lib/axios';

jest.mock('~/shared/lib/axios', () => ({
  instance: { post: jest.fn() },
}));

const mockPost = instance.post as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('report', () => {
  describe('PRODUCT 신고', () => {
    const productReportData = {
      targetType: 'PRODUCT' as const,
      productId: 5,
      memberId: 42,
      reason: 'SPAM_AD' as const,
      content: '스팸 게시글입니다.',
      imageIds: [1, 2],
    };

    it('POST /report를 올바른 payload로 호출한다', async () => {
      mockPost.mockResolvedValue({});

      await report(productReportData);

      expect(mockPost).toHaveBeenCalledWith('/report', {
        sourceId: 42,
        reportType: 'SPAM_AD',
        content: '스팸 게시글입니다.',
        imageIds: [1, 2],
      });
    });

    it('이미지 없는 신고도 빈 배열로 전송한다', async () => {
      mockPost.mockResolvedValue({});

      await report({ ...productReportData, imageIds: [] });

      expect(mockPost).toHaveBeenCalledWith('/report', expect.objectContaining({ imageIds: [] }));
    });
  });

  describe('MEMBER 신고', () => {
    const memberReportData = {
      targetType: 'MEMBER' as const,
      memberId: 99,
      reason: 'ABUSE_HATE_HARASSMENT' as const,
      content: '욕설을 사용했습니다.',
      imageIds: [],
    };

    it('POST /report를 올바른 payload로 호출한다', async () => {
      mockPost.mockResolvedValue({});

      await report(memberReportData);

      expect(mockPost).toHaveBeenCalledWith('/report', {
        sourceId: 99,
        reportType: 'ABUSE_HATE_HARASSMENT',
        content: '욕설을 사용했습니다.',
        imageIds: [],
      });
    });
  });

  describe('모든 ReportReason 타입', () => {
    const reasons = [
      'SEXUAL',
      'ABUSE_HATE_HARASSMENT',
      'SPAM_AD',
      'IMPERSONATION',
      'SELF_HARM_DANGER',
      'ETC',
    ] as const;

    it.each(reasons)('%s 사유로 신고할 수 있다', async (reason) => {
      mockPost.mockResolvedValue({});

      await report({
        targetType: 'MEMBER',
        memberId: 1,
        reason,
        content: '신고 내용',
        imageIds: [],
      });

      expect(mockPost).toHaveBeenCalledWith('/report', expect.objectContaining({ reportType: reason }));
    });
  });

  describe('에러 처리', () => {
    it('API 실패 시 에러를 throw한다', async () => {
      mockPost.mockRejectedValue(new Error('서버 오류'));

      await expect(
        report({ targetType: 'MEMBER', memberId: 1, reason: 'ETC', content: '내용', imageIds: [] })
      ).rejects.toThrow();
    });

    it('네트워크 에러도 throw한다', async () => {
      mockPost.mockRejectedValue(new Error('Network Error'));

      await expect(
        report({ targetType: 'MEMBER', memberId: 1, reason: 'ETC', content: '내용', imageIds: [] })
      ).rejects.toThrow('Network Error');
    });
  });
});
