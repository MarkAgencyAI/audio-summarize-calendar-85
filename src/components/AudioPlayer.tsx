
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface AudioPlayerProps {
  audioUrl: string;
  initialDuration?: number;
}

export function AudioPlayer({ audioUrl, initialDuration = 0 }: AudioPlayerProps) {
  const { isDark } = useTheme();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(initialDuration);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadSound = async () => {
    try {
      setIsLoading(true);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false }
      );
      setSound(newSound);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setDuration(status.durationMillis || 0);
          setCurrentTime(status.positionMillis || 0);
          setIsPlaying(status.isPlaying);
        }
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading sound', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSound();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [audioUrl]);

  const playPause = async () => {
    if (!sound) return;

    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const seekTo = async (position: number) => {
    if (!sound) return;
    await sound.setPositionAsync(position);
    setCurrentTime(position);
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#00b8ae" />;
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }
    ]}>
      <View style={styles.playerControls}>
        <TouchableOpacity onPress={playPause}>
          <Feather 
            name={isPlaying ? 'pause' : 'play'} 
            size={24} 
            color={isDark ? '#ffffff' : '#121212'} 
          />
        </TouchableOpacity>
        
        <View style={styles.sliderContainer}>
          <Text style={[styles.timeText, { color: isDark ? '#e0e0e0' : '#666666' }]}>
            {formatTime(currentTime)}
          </Text>
          <Slider
            value={currentTime}
            minimumValue={0}
            maximumValue={duration}
            minimumTrackTintColor="#00b8ae"
            maximumTrackTintColor={isDark ? '#666666' : '#cccccc'}
            onValueChange={seekTo}
            style={styles.slider}
          />
          <Text style={[styles.timeText, { color: isDark ? '#e0e0e0' : '#666666' }]}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    padding: 16,
    marginVertical: 10,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  timeText: {
    fontSize: 12,
  },
});

export default AudioPlayer;
