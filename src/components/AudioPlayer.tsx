
import React, { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { formatTime } from "@/lib/audio-utils";
import { toast } from "sonner";

interface AudioPlayerProps {
  audioUrl: string;
  audioBlob?: Blob;
  initialDuration?: number;
  autoplay?: boolean;
  onEnded?: () => void;
}

export function AudioPlayer({
  audioUrl,
  audioBlob,
  initialDuration = 0,
  autoplay = false,
  onEnded
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(initialDuration);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "metadata";
      audioRef.current = audio;
      
      // Event listeners
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("canplay", () => setIsLoading(false));
      audio.addEventListener("waiting", () => setIsLoading(true));
      audio.addEventListener("playing", () => setIsLoading(false));
      
      // Set initial values
      audio.volume = volume;
      audio.playbackRate = playbackRate;
    }
    
    return () => {
      if (audioRef.current) {
        const audio = audioRef.current;
        audio.pause();
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("canplay", () => setIsLoading(false));
        audio.removeEventListener("waiting", () => setIsLoading(true));
        audio.removeEventListener("playing", () => setIsLoading(false));
        
        URL.revokeObjectURL(audio.src);
      }
    };
  }, []);
  
  // Update audio source when audioUrl changes
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      setIsLoading(true);
      
      // If we have a Blob, use that for better performance
      if (audioBlob && audioBlob instanceof Blob) {
        const objectUrl = URL.createObjectURL(audioBlob);
        audioRef.current.src = objectUrl;
      } else {
        audioRef.current.src = audioUrl;
      }
      
      if (autoplay) {
        playAudio();
      }
    }
  }, [audioUrl, audioBlob]);
  
  // Update playback rate when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);
  
  // Update volume and mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(Math.floor(audioRef.current.duration));
      setIsLoading(false);
    }
  };
  
  const handleTimeUpdate = () => {
    if (audioRef.current && !isDragging) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };
  
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (onEnded) {
      onEnded();
    }
  };
  
  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(error => {
          console.error("Error playing audio:", error);
          toast.error("Error al reproducir el audio");
        });
    }
  };
  
  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };
  
  const togglePlayPause = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };
  
  const skipForward = () => {
    if (audioRef.current) {
      const newTime = Math.min(audioRef.current.currentTime + 10, duration);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  const skipBackward = () => {
    if (audioRef.current) {
      const newTime = Math.max(audioRef.current.currentTime - 10, 0);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      const newTime = value[0];
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
  };
  
  // Calculate progress for the progress bar
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  return (
    <div className="w-full bg-background border rounded-md p-4 shadow-sm">
      <div className="space-y-4">
        {/* Timeline seeker */}
        <div className="w-full space-y-1">
          <div className="relative">
            <Slider 
              value={[currentTime]} 
              min={0} 
              max={duration} 
              step={0.01}
              onValueChange={handleSeek}
              onValueCommit={() => setIsDragging(false)}
              onPointerDown={() => setIsDragging(true)}
              className="cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(Math.floor(currentTime))}</span>
            <span>{formatTime(Math.floor(duration))}</span>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={skipBackward}
              aria-label="Retroceder 10 segundos"
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={togglePlayPause}
              className="h-10 w-10"
              disabled={isLoading}
              aria-label={isPlaying ? "Pausar" : "Reproducir"}
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={skipForward}
              aria-label="Avanzar 10 segundos"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => changePlaybackRate(1)}
                className={`h-6 px-2 ${playbackRate === 1 ? 'bg-primary/20' : ''}`}
              >
                1x
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => changePlaybackRate(1.5)}
                className={`h-6 px-2 ${playbackRate === 1.5 ? 'bg-primary/20' : ''}`}
              >
                1.5x
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => changePlaybackRate(2)}
                className={`h-6 px-2 ${playbackRate === 2 ? 'bg-primary/20' : ''}`}
              >
                2x
              </Button>
            </div>
            
            <div className="flex items-center gap-2 ml-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={toggleMute}
                className="h-8 w-8"
                aria-label={isMuted ? "Activar sonido" : "Silenciar"}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              
              <Slider
                value={[isMuted ? 0 : volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-[80px]"
                aria-label="Volumen"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
