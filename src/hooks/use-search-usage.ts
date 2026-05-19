
'use client';

import { useState, useEffect } from 'react';
import { getSearchCount, isPro, getRemainingSearches, incrementSearchCount as incCount } from '@/lib/usage';

export function useSearchUsage() {
  const [usage, setUsage] = useState(0);
  const [isProUser, setIsProUser] = useState(false);
  const [remaining, setRemaining] = useState(10);

  useEffect(() => {
    const update = () => {
      setUsage(getSearchCount());
      setIsProUser(isPro());
      setRemaining(getRemainingSearches());
    };
    
    update();
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, []);

  const incrementUsage = () => {
    incCount();
    setUsage(getSearchCount());
    setRemaining(getRemainingSearches());
  };

  return { usage, isProUser, remaining, incrementUsage };
}
