import type { Metadata } from 'next';
import './write.css';
import { WriteEditor } from '@/components/write/WriteEditor';

export const metadata: Metadata = {
  title: 'AI 글쓰기 — 탁월한 찬사',
  description: 'AI 어시스턴트를 활용한 스마트 글쓰기 에디터',
};

export default function WritePage() {
  return <WriteEditor />;
}
