'use client';

import type { InsertPosition } from '@/lib/write-insert-position';
import { INSERT_POSITION_LABEL } from '@/lib/write-insert-position';

const POSITIONS: InsertPosition[] = ['top', 'inline', 'bottom'];

interface Props {
  position: InsertPosition;
  onChange: (position: InsertPosition) => void;
  onResizeStart: (e: React.MouseEvent) => void;
  onSendToDraft: () => void;
}

export function WriteInsertRail({ position, onChange, onResizeStart, onSendToDraft }: Props) {
  return (
    <div className="nfw-insert-rail" aria-label="본문 삽입 위치">
      <div className="nfw-insert-rail__pos">
        <span className="nfw-insert-rail__label">
          <span>위치</span>
          <span>지정</span>
        </span>
        <div className="nfw-insert-rail__toggles">
          {POSITIONS.map(p => (
            <button
              key={p}
              type="button"
              className={`nfw-insert-rail__toggle${position === p ? ' is-on' : ''}`}
              onClick={() => onChange(p)}
              aria-pressed={position === p}
              title={`${INSERT_POSITION_LABEL[p]}에 추가`}
            >
              {INSERT_POSITION_LABEL[p]}
            </button>
          ))}
          <button
            type="button"
            className="nfw-insert-rail__send"
            onClick={onSendToDraft}
            aria-label="일반명령문을 우측 본문에 반영"
            title="일반명령문 전송 후 우측 본문에 반영"
          >
            →
          </button>
        </div>
      </div>
      <div
        className="nfw-insert-rail__resize"
        onMouseDown={onResizeStart}
        role="separator"
        aria-orientation="vertical"
        aria-label="좌우 너비 조절"
      />
    </div>
  );
}
