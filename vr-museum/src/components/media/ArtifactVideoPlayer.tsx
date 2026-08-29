"use client";

import { useEffect, useRef, useState } from "react";
import { museumToast } from "@/lib/museum-toast";

type Props = { src: string; poster?: string; title: string; className?: string };

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
};

export default function ArtifactVideoPlayer({ src, poster, title, className = "" }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const failureNotifiedRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [failed, setFailed] = useState(false);

  const reportFailure = () => {
    setFailed(true);
    if (failureNotifiedRef.current) return;
    failureNotifiedRef.current = true;
    museumToast.error(
      "Video unavailable",
      `${title} could not be loaded. The video file may be missing or no longer available.`,
    );
  };

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) await video.play().catch(reportFailure);
    else video.pause();
  };

  useEffect(() => {
    const onFullscreen = () => rootRef.current?.focus();
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  if (failed) {
    return <div role="alert" className={`flex h-full items-center justify-center bg-cream-dark p-8 text-center ${className}`}><div><p className="font-display text-2xl italic">The film is resting</p><p className="mt-3 text-sm text-stone">This video could not be loaded. The artifact poster is still available in Photo.</p></div></div>;
  }

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      aria-label={`${title} video player`}
      className={`group relative flex h-full w-full items-center bg-black outline-none focus-visible:ring-2 focus-visible:ring-accent ${className}`}
      onKeyDown={(event) => {
        const video = videoRef.current;
        if (!video || event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
        if (event.key === " " || event.key.toLowerCase() === "k") { event.preventDefault(); void togglePlay(); }
        if (event.key === "ArrowRight") { event.preventDefault(); video.currentTime = Math.min(duration, video.currentTime + 5); }
        if (event.key === "ArrowLeft") { event.preventDefault(); video.currentTime = Math.max(0, video.currentTime - 5); }
        if (event.key.toLowerCase() === "m") { video.muted = !video.muted; setMuted(video.muted); }
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster || undefined}
        playsInline
        preload="metadata"
        className="max-h-full w-full object-contain"
        onClick={() => void togglePlay()}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onProgress={(e) => {
          const video = e.currentTarget;
          if (video.buffered.length && video.duration) setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
        }}
        onError={reportFailure}
        aria-label={`${title} video`}
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/65 to-transparent px-3 pb-3 pt-10 text-white md:px-4">
        <div className="relative h-1 w-full bg-white/25">
          <span className="absolute inset-y-0 left-0 bg-white/35" style={{ width: `${buffered}%` }} />
          <input aria-label="Seek video" type="range" min={0} max={duration || 0} step="0.1" value={currentTime} onChange={(e) => { const next = Number(e.target.value); if (videoRef.current) videoRef.current.currentTime = next; setCurrentTime(next); }} className="absolute -inset-y-2 left-0 h-5 w-full cursor-pointer accent-white" />
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs tracking-wide">
          <button type="button" onClick={() => void togglePlay()} aria-label={playing ? "Pause video" : "Play video"} className="min-w-8 text-left text-lg">{playing ? "Ⅱ" : "▶"}</button>
          <span aria-live="off" className="tabular-nums">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <button type="button" onClick={() => { const video = videoRef.current; if (!video) return; video.muted = !video.muted; setMuted(video.muted); }} aria-label={muted ? "Unmute video" : "Mute video"}>{muted || volume === 0 ? "Muted" : "Volume"}</button>
          <input aria-label="Video volume" type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={(e) => { const next = Number(e.target.value); if (videoRef.current) { videoRef.current.volume = next; videoRef.current.muted = false; } setMuted(false); setVolume(next); }} className="hidden w-16 accent-white sm:block" />
          <select aria-label="Playback speed" value={rate} onChange={(e) => { const next = Number(e.target.value); if (videoRef.current) videoRef.current.playbackRate = next; setRate(next); }} className="ml-auto bg-transparent text-white outline-none">
            {[0.5, 1, 1.5, 2].map((value) => <option key={value} value={value} className="bg-ink">{value}×</option>)}
          </select>
          <button type="button" aria-label="Enter video fullscreen" onClick={() => void rootRef.current?.requestFullscreen()} className="text-sm">⛶</button>
        </div>
      </div>
    </div>
  );
}
