'use client';

import { clampMediaFontSize } from '@/lib/media-font-size';

interface Props {
  value: number;
  onChange: (value: number) => void;
  id?: string;
}

export function MediaFontSizeSlider({ value, onChange, id = 'nfw-media-font-size' }: Props) {
  const level = clampMediaFontSize(value);

  return (
    <div className="nfw-media-font-size" title="설명 글자 크기 (1=크게, 10=작게)">
      <div className="nfw-media-font-size__labels">
        <span>크게</span>
        <span className="nfw-media-font-size__value" aria-hidden="true">{level}</span>
        <span>작게</span>
      </div>
      <input
        id={id}
        className="nfw-media-font-size__range"
        type="range"
        min={1}
        max={10}
        step={1}
        value={level}
        aria-label="설명 폰트 크기"
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuenow={level}
        onChange={e => onChange(clampMediaFontSize(Number(e.target.value)))}
      />
    </div>
  );
}
