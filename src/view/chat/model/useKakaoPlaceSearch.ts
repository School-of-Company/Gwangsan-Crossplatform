import { useCallback, useEffect, useRef, useState } from 'react';
import { searchPlaces, type KakaoPlace } from '~/shared/api/kakaoLocalSearch';
import { logger } from '~/shared/lib/logger';

export const SEARCH_DEBOUNCE_MS = 300;

// 입력이 잠잠해진 뒤 한 번만 검색하고, 늦게 도착한 이전 검색 결과는 버린다
export const useKakaoPlaceSearch = () => {
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestIdRef = useRef(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<KakaoPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const changeSearchQuery = useCallback((text: string) => {
    setSearchQuery(text);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    const query = text.trim();
    if (!query) {
      setSuggestions([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      const requestId = (searchRequestIdRef.current += 1);
      setIsSearching(true);
      searchPlaces(query)
        .then((results) => {
          if (searchRequestIdRef.current === requestId) setSuggestions(results);
        })
        .catch((error) => {
          logger.error('searchPlaces failed', error);
          if (searchRequestIdRef.current === requestId) setSuggestions([]);
        })
        .finally(() => {
          if (searchRequestIdRef.current === requestId) setIsSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSuggestions([]);
  }, []);

  return {
    searchQuery,
    suggestions,
    isSearching,
    isSearchActive: searchQuery.trim().length > 0,
    changeSearchQuery,
    clearSearch,
  };
};
