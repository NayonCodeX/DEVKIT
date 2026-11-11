'use client';

import { useEffect, useRef, useState } from 'react';
import { ToolShell } from './ToolShell';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/devkit/utils';
import { useToast } from '@/hooks/use-toast';
import jsQR from 'jsqr';

export function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');
  const { toast } = useToast();

  async function start() {
    setErr(null);
    setResult('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setRunning(true);
      tick();
    } catch (e) {
      setErr((e as Error).message + ' (Camera permission or device unavailable.)');
    }
  }

  function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setRunning(false);
  }

  function tick() {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c || !v.videoWidth) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const img = ctx.getImageData(0, 0, c.width, c.height);
    const code = jsQR(img.data, c.width, c.height, { inversionAttempts: 'dontInvert' });
    if (code) {
      setResult(code.data);
      setRunning(false);
      stop();
      toast({ title: 'QR detected!' });
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => () => stop(), []);

  return (
    <ToolShell title="QR Scanner" description="Scan QR codes using your device camera. Requires HTTPS and a camera.">
      {!running && (
        <Button onClick={start}>Start camera</Button>
      )}
      {running && (
        <Button variant="destructive" onClick={stop}>Stop</Button>
      )}
      {err && <div className="text-sm text-destructive">{err}</div>}
      <div className="relative bg-black rounded-lg overflow-hidden max-w-md aspect-video">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
        {running && (
          <div className="absolute inset-0 pointer-events-none border-4 border-primary/40 rounded-lg" />
        )}
      </div>
      {result && (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 space-y-2">
          <div className="text-sm font-medium">Scanned result</div>
          <div className="font-mono text-sm break-all">{result}</div>
          <Button size="sm" variant="outline" onClick={async () => { await copyToClipboard(result); toast({ title: 'Copied' }); }}>Copy</Button>
        </div>
      )}
      {!result && !err && (
        <div className="text-xs text-muted-foreground">Point the camera at a QR code. Detection is automatic.</div>
      )}
    </ToolShell>
  );
}
