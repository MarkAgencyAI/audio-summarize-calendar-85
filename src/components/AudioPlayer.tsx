
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '@/context/ThemeContext';

export interface AudioPlayerProps {
  audioUrl: string;
  initialDuration?: number;
  audioBlob?: Blob;
}

export function AudioPlayer({ 
  audioUrl, 
  initialDuration = 0,
  audioBlob
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(initialDuration);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { isDark } = useTheme();
  
  useEffect(() => {
    let audio: HTMLAudioElement;
    
    const setupAudio = async () => {
      try {
        if (audioRef.current) {
          // Cleanup existing audio element
          audioRef.current.pause();
          audioRef.current.src = '';
          audioRef.current.load();
        }
        
        audio = new Audio();
        audioRef.current = audio;
        
        // Handle source - either direct URL or Blob
        if (audioBlob) {
          const objectUrl = URL.createObjectURL(audioBlob);
          audio.src = objectUrl;
        } else if (audioUrl) {
          audio.src = audioUrl;
        }
        
        // Set up event listeners
        audio.addEventListener('loadedmetadata', () => {
          if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
            setDuration(audio.duration);
          } else if (initialDuration > 0) {
            setDuration(initialDuration);
          }
          setIsLoading(false);
        });
        
        audio.addEventListener('timeupdate', () => {
          if (audio.currentTime && !isNaN(audio.currentTime) && isFinite(audio.currentTime)) {
            setCurrentTime(audio.currentTime);
          }
        });
        
        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          setCurrentTime(0);
          audio.currentTime = 0;
        });
        
        // Handle loading errors
        audio.addEventListener('error', (e) => {
          console.error('Audio loading error:', e);
          setIsLoading(false);
        });
        
        // Start loading
        audio.load();
      } catch (error) {
        console.error('Error setting up audio:', error);
        setIsLoading(false);
      }
    };
    
    setupAudio();
    
    // Cleanup function
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
        audio.removeEventListener('loadedmetadata', () => {});
        audio.removeEventListener('timeupdate', () => {});
        audio.removeEventListener('ended', () => {});
        audio.removeEventListener('error', () => {});
        
        if (audioBlob) {
          URL.revokeObjectURL(audio.src);
        }
      }
    };
  }, [audioUrl, audioBlob, initialDuration]);
  
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleSliderChange = (value: number) => {
    if (audioRef.current && !isNaN(value) && isFinite(value)) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };
  
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  return (
    <View style={styles.container}>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration > 0 ? duration : 1}
        value={currentTime}
        onValueChange={handleSliderChange}
        minimumTrackTintColor="#00b8ae"
        maximumTrackTintColor={isDark ? "#555555" : "#dddddd"}
        thumbTintColor="#00b8ae"
        disabled={isLoading}
      />
      
      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.playPauseButton} 
          onPress={togglePlayPause}
          disabled={isLoading}
        >
          <Text style={styles.playPauseIcon}>
            {isLoading ? "●" : isPlaying ? "❚❚" : "▶"}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.timeDisplay}>
          <Text style={[
            styles.timeText,
            { color: isDark ? '#e0e0e0' : '#666666' }
          ]}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playPauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00b8ae',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeDisplay: {
    flex: 1,
    marginLeft: 16,
  },
  timeText: {
    fontSize: 14,
  },
});
