
import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { Feather } from '@expo/vector-icons';
import { useTheme } from "@/context/ThemeContext";

interface AudioPlayerProps {
  audioUrl: string;
  initialDuration?: number;
  autoplay?: boolean;
  onEnded?: () => void;
}

export function AudioPlayer({
  audioUrl,
  initialDuration = 0,
  autoplay = false,
  onEnded
}: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { isDark } = useTheme();

  // Load the audio file
  useEffect(() => {
    loadAudio();
    
    return () => {
      // Clean up
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      unloadAudio();
    };
  }, [audioUrl]);

  // Load audio function
  const loadAudio = async () => {
    try {
      setIsLoading(true);
      
      // Unload any existing sound
      await unloadAudio();
      
      // Load the new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: autoplay },
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
      
      // Set up audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
      
      // Start playback if autoplay is enabled
      if (autoplay) {
        playAudio(newSound);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading audio:", error);
      setIsLoading(false);
    }
  };

  // Unload audio function
  const unloadAudio = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      } catch (error) {
        console.error("Error unloading sound:", error);
      }
    }
  };

  // Update playback status
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (status.durationMillis) {
        setDuration(status.durationMillis / 1000);
      }
      
      if (!isDragging && status.positionMillis) {
        setCurrentTime(status.positionMillis / 1000);
      }
      
      setIsPlaying(status.isPlaying);
      
      // Handle playback ended
      if (status.didJustFinish) {
        setIsPlaying(false);
        setCurrentTime(0);
        if (onEnded) {
          onEnded();
        }
      }
    }
  };

  // Play audio
  const playAudio = async (soundToPlay = sound) => {
    if (!soundToPlay) return;
    
    try {
      const status = await soundToPlay.getStatusAsync();
      
      if (status.isLoaded) {
        await soundToPlay.playAsync();
        setIsPlaying(true);
        
        // Start interval to update current time
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
        }
        
        updateIntervalRef.current = setInterval(async () => {
          if (soundToPlay) {
            const currentStatus = await soundToPlay.getStatusAsync();
            if (currentStatus.isLoaded && !isDragging) {
              setCurrentTime(currentStatus.positionMillis / 1000);
            }
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  // Pause audio
  const pauseAudio = async () => {
    if (!sound) return;
    
    try {
      await sound.pauseAsync();
      setIsPlaying(false);
      
      // Clear interval
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    } catch (error) {
      console.error("Error pausing audio:", error);
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  // Skip forward 10 seconds
  const skipForward = async () => {
    if (!sound) return;
    
    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        const newPosition = Math.min((status.positionMillis + 10000), status.durationMillis || 0);
        await sound.setPositionAsync(newPosition);
        setCurrentTime(newPosition / 1000);
      }
    } catch (error) {
      console.error("Error skipping forward:", error);
    }
  };

  // Skip backward 10 seconds
  const skipBackward = async () => {
    if (!sound) return;
    
    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        const newPosition = Math.max((status.positionMillis - 10000), 0);
        await sound.setPositionAsync(newPosition);
        setCurrentTime(newPosition / 1000);
      }
    } catch (error) {
      console.error("Error skipping backward:", error);
    }
  };

  // Seek to a specific position
  const handleSeek = async (value: number) => {
    if (!sound) return;
    
    try {
      const newPositionMillis = value * 1000;
      setCurrentTime(value);
      
      await sound.setPositionAsync(newPositionMillis);
    } catch (error) {
      console.error("Error seeking:", error);
    }
  };

  // Change volume
  const handleVolumeChange = async (value: number) => {
    if (!sound) return;
    
    try {
      await sound.setVolumeAsync(value);
      setVolume(value);
      
      if (value === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    } catch (error) {
      console.error("Error changing volume:", error);
    }
  };

  // Toggle mute
  const toggleMute = async () => {
    if (!sound) return;
    
    try {
      if (isMuted) {
        await sound.setVolumeAsync(volume || 1);
        setIsMuted(false);
      } else {
        await sound.setVolumeAsync(0);
        setIsMuted(true);
      }
    } catch (error) {
      console.error("Error toggling mute:", error);
    }
  };

  // Change playback rate
  const changePlaybackRate = async (rate: number) => {
    if (!sound) return;
    
    try {
      await sound.setRateAsync(rate, true);
      setPlaybackRate(rate);
    } catch (error) {
      console.error("Error changing playback rate:", error);
    }
  };

  // Format time as MM:SS
  const formatTime = (timeInSeconds: number): string => {
    if (isNaN(timeInSeconds) || !isFinite(timeInSeconds)) {
      return "00:00";
    }
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate the progress for the slider
  const calculateProgress = (): number => {
    if (duration <= 0) return 0;
    return currentTime / duration;
  };

  // Validate duration to prevent infinity
  const validDuration = duration > 0 && isFinite(duration) ? duration : 100;

  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5' }
    ]}>
      {/* Timeline seeker */}
      <View style={styles.timelineContainer}>
        <Slider
          value={currentTime}
          minimumValue={0}
          maximumValue={validDuration}
          step={0.01}
          onValueChange={(value) => {
            setIsDragging(true);
            setCurrentTime(value);
          }}
          onSlidingComplete={(value) => {
            setIsDragging(false);
            handleSeek(value);
          }}
          minimumTrackTintColor="#00b8ae"
          maximumTrackTintColor={isDark ? "#444444" : "#cccccc"}
          thumbTintColor="#00b8ae"
          style={styles.slider}
        />
        
        <View style={styles.timeDisplay}>
          <Text style={[styles.timeText, { color: isDark ? '#e0e0e0' : '#666666' }]}>
            {formatTime(currentTime)}
          </Text>
          <Text style={[styles.timeText, { color: isDark ? '#e0e0e0' : '#666666' }]}>
            {formatTime(validDuration)}
          </Text>
        </View>
      </View>
      
      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.mainControls}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={skipBackward}
            disabled={isLoading}
          >
            <Feather name="skip-back" size={22} color={isDark ? "#e0e0e0" : "#333333"} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.playButton} 
            onPress={togglePlayPause}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#00b8ae" />
            ) : isPlaying ? (
              <Feather name="pause" size={24} color={isDark ? "#e0e0e0" : "#333333"} />
            ) : (
              <Feather name="play" size={24} color={isDark ? "#e0e0e0" : "#333333"} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={skipForward}
            disabled={isLoading}
          >
            <Feather name="skip-forward" size={22} color={isDark ? "#e0e0e0" : "#333333"} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.secondaryControls}>
          {/* Playback Rate Buttons */}
          <View style={styles.rateButtons}>
            <TouchableOpacity
              style={[
                styles.rateButton,
                playbackRate === 1 && styles.activeRateButton
              ]}
              onPress={() => changePlaybackRate(1)}
            >
              <Text style={[
                styles.rateText,
                playbackRate === 1 && styles.activeRateText,
                { color: isDark ? '#e0e0e0' : '#333333' }
              ]}>
                1x
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.rateButton,
                playbackRate === 1.5 && styles.activeRateButton
              ]}
              onPress={() => changePlaybackRate(1.5)}
            >
              <Text style={[
                styles.rateText,
                playbackRate === 1.5 && styles.activeRateText,
                { color: isDark ? '#e0e0e0' : '#333333' }
              ]}>
                1.5x
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.rateButton,
                playbackRate === 2 && styles.activeRateButton
              ]}
              onPress={() => changePlaybackRate(2)}
            >
              <Text style={[
                styles.rateText,
                playbackRate === 2 && styles.activeRateText,
                { color: isDark ? '#e0e0e0' : '#333333' }
              ]}>
                2x
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Volume Control */}
          <View style={styles.volumeControl}>
            <TouchableOpacity 
              style={styles.muteButton}
              onPress={toggleMute}
            >
              <Feather 
                name={isMuted ? "volume-x" : "volume-2"} 
                size={16} 
                color={isDark ? "#e0e0e0" : "#333333"} 
              />
            </TouchableOpacity>
            
            <Slider
              value={isMuted ? 0 : volume}
              minimumValue={0}
              maximumValue={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              minimumTrackTintColor="#00b8ae"
              maximumTrackTintColor={isDark ? "#444444" : "#cccccc"}
              thumbTintColor="#00b8ae"
              style={styles.volumeSlider}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  timelineContainer: {
    width: '100%',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  timeText: {
    fontSize: 12,
  },
  controls: {
    width: '100%',
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  controlButton: {
    padding: 12,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  rateButtons: {
    flexDirection: 'row',
  },
  rateButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 4,
    borderRadius: 4,
  },
  activeRateButton: {
    backgroundColor: 'rgba(0, 184, 174, 0.2)',
  },
  rateText: {
    fontSize: 12,
  },
  activeRateText: {
    color: '#00b8ae',
  },
  volumeControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muteButton: {
    padding: 8,
  },
  volumeSlider: {
    width: 80,
    height: 40,
  },
});
