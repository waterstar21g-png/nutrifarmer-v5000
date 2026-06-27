'use client';

import { AiCommandManager } from '@/components/write/AiCommandManager';

export function AiCommandsPageClient() {
  return (
    <div className="nfw-cmdmgr-page-root">
      <AiCommandManager standalone />
    </div>
  );
}
