'use client';

import { AiCommandManager } from './AiCommandManager';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** (레거시) 모달 — 신규는 openAiCommandsWindow() 팝업 사용 */
export function AiCommandManagerDialog({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="nfw-cmdmgr-backdrop" role="presentation" onClick={onClose}>
      <div role="dialog" aria-labelledby="nfw-cmdmgr-title" onClick={e => e.stopPropagation()}>
        <AiCommandManager onClose={onClose} />
      </div>
    </div>
  );
}
