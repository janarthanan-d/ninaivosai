import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  title?: string;
  isOriginalRecording?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, title, isOriginalRecording = true }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const cycleRate = () => {
    const rates = [1.0, 1.25, 1.5, 0.8];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#FAF6EE] border border-[#E8DEC8] rounded-xl p-3 sm:p-4 my-3 shadow-xs">
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#7B1113] animate-pulse" />
          <span className="text-xs font-semibold text-[#7B1113]">
            {isOriginalRecording ? 'அசல் குரல் பதிவு' : 'குரல் ஒலிபரப்பு'}
          </span>
          {title && <span className="text-xs text-[#786C5E] truncate max-w-[200px]">| {title}</span>}
        </div>
        <span className="text-[11px] font-mono text-[#5C5346]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-[#7B1113] hover:bg-[#600E10] text-[#FDFBF7] flex items-center justify-center shrink-0 shadow-xs transition-colors"
          title={isPlaying ? 'இடைநிறுத்து' : 'ஒலிபரப்பு'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        {/* Seek Bar */}
        <div className="flex-1 flex flex-col justify-center">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-[#E2D9CE] rounded-lg appearance-none cursor-pointer accent-[#7B1113]"
          />
        </div>

        {/* Speed cycle button */}
        <button
          onClick={cycleRate}
          className="px-2 py-1 text-[11px] font-semibold bg-[#EFE7D8] text-[#5C5346] rounded-md hover:bg-[#E2D9CE] transition-colors"
          title="வேகத்தை மாற்று"
        >
          {playbackRate}x
        </button>

        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className="p-1.5 text-[#5C5346] hover:text-[#7B1113] transition-colors"
          title={isMuted ? 'ஒலியை இயக்கு' : 'ஒலியை முடக்கு'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-700" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
