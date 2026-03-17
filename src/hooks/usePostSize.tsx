import { useState, useEffect } from 'react';

export type PostSize = 'compact' | 'standard' | 'large';

export const usePostSize = () => {
  const [size, setSize] = useState<PostSize>(() => {
    return (localStorage.getItem('postSize') as PostSize) || 'standard';
  });

  useEffect(() => {
    localStorage.setItem('postSize', size);
  }, [size]);

  return { size, setSize };
};
