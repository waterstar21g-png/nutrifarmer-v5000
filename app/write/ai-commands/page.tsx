import type { Metadata } from 'next';
import '../write.css';
import { WriteGate } from '@/components/auth/WriteGate';
import { AiCommandsPageClient } from './AiCommandsPageClient';

export const metadata: Metadata = {
  title: 'AI 버튼 — 명령문 조회/변경',
  description: '글쓰기 AI 버튼 명령문을 조회·수정합니다.',
};

export default function AiCommandsPage() {
  return (
    <WriteGate redirectTo="/write/ai-commands">
      <AiCommandsPageClient />
    </WriteGate>
  );
}
