'use client';

import { useEffect, useRef, useState } from 'react';
import { ToolShell, ToolInput } from './ToolShell';
import { downloadBlob } from '@/lib/devkit/utils';
import QRCode from 'qrcode';

export function QrGenerator() {
  const [text, setText] = useState('https://github.com');
  const [size, setSize] = useState(256);
  const [errLevel, setErrLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [fg, setFg] = useState('#000000');
  const [bg, setBg] = useState('#ffffff');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!text) {
        setErr('Enter text to encode.');
        return;
      }
      try {
        await QRCode.toCanvas(canvasRef.current!, text, {
          width: size,
          margin: 1,
          color: { dark: fg, light: bg },
          errorCorrectionLevel: errLevel,
        });
        if (!cancelled) setErr(null);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      }
    })();
    return () => { cancelled = true; };
  }, [text, size, errLevel, fg, bg]);

  function download() {
    const c = canvasRef.current;
    if (!c) return;
    c.toBlob((blob) => {
      if (blob) downloadBlob('qr-code.png', blob);
    });
  }

  return (
    <ToolShell title="QR Code Generator" description="Generate a real QR code from text or a URL using the qrcode library.">
      <ToolInput value={text} onChange={setText} placeholder="Text or URL to encode" rows={4} />
      <div className="grid sm:grid-cols-4 gap-3">
        <div>
          <label className="text-sm">Size: {size}px</label>
          <input type="range" min={64} max={1024} step={32} value={size} onChange={(e) => setSize(+e.target.value)} className="w-full" />
        </div>
        <div>
          <label className="text-sm">Error correction</label>
          <select value={errLevel} onChange={(e) => setErrLevel(e.target.value as 'L' | 'M' | 'Q' | 'H')} className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-card">
            <option value="L">L (~7%)</option>
            <option value="M">M (~15%)</option>
            <option value="Q">Q (~25%)</option>
            <option value="H">H (~30%)</option>
          </select>
        </div>
        <div>
          <label className="text-sm">Foreground</label>
          <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="w-full h-9 rounded-md border border-border bg-card" />
        </div>
        <div>
          <label className="text-sm">Background</label>
          <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="w-full h-9 rounded-md border border-border bg-card" />
        </div>
      </div>
      {err && <div className="text-sm text-destructive">{err}</div>}
      <div className="flex justify-center">
        <canvas ref={canvasRef} className="rounded-lg border border-border max-w-full" />
      </div>
      <div className="flex gap-2">
        <button onClick={download} className="text-sm text-primary">Download PNG</button>
      </div>
    </ToolShell>
  );
}

