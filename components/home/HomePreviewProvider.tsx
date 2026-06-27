'use client';

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PreviewPost } from '@/lib/home-posts';

type PostsMap = Record<string, PreviewPost[]>;

const Ctx = createContext<{
  postsBySlug: PostsMap;
  setPostsBySlug: (m: PostsMap) => void;
}>({ postsBySlug: {}, setPostsBySlug: () => {} });

export function HomePreviewProvider({ children }: { children: ReactNode }) {
  const [postsBySlug, setPostsBySlug] = useState<PostsMap>({});
  const value = useMemo(() => ({ postsBySlug, setPostsBySlug }), [postsBySlug]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHomePreviewPosts() {
  return useContext(Ctx);
}

export function HomePreviewData({ postsBySlug }: { postsBySlug: PostsMap }) {
  const { setPostsBySlug } = useHomePreviewPosts();
  useLayoutEffect(() => {
    setPostsBySlug(postsBySlug);
  }, [postsBySlug, setPostsBySlug]);
  return null;
}