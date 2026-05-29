import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';
import { Conversation } from '@/models/conversation';
import { titleFromFilename } from '@/utils/timeFormat';

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const MAX_BYTES = 25 * 1024 * 1024;
const AUDIO_TYPES = [
  'audio/*',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/x-m4a',
  'audio/x-wav',
  'audio/ogg',
  'audio/aac',
];

async function getAudioDuration(uri: string): Promise<number> {
  const { sound, status } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
  try {
    if (status.isLoaded && status.durationMillis != null) {
      return status.durationMillis / 1000;
    }
    return 0;
  } finally {
    await sound.unloadAsync();
  }
}

async function persistAudio(sourceUri: string, id: string, ext: string): Promise<string> {
  const base = FileSystem.documentDirectory;
  if (!base) throw new Error('No document directory');
  const dir = `${base}conversations/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const dest = `${dir}${id}${ext}`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

function extensionFromName(name: string): string {
  const match = name.match(/(\.[a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase() ?? '.m4a';
}

export function useImportAudio() {
  const [importing, setImporting] = useState(false);

  const importAudio = useCallback(async (): Promise<Conversation | null> => {
    setImporting(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: AUDIO_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return null;

      const asset = result.assets[0];
      const size = asset.size ?? 0;
      if (size > MAX_BYTES) {
        Alert.alert(
          'File too large',
          'Please choose an audio file under 25 MB.'
        );
        return null;
      }

      const id = newId();
      const ext = extensionFromName(asset.name);
      const audioUri = await persistAudio(asset.uri, id, ext);
      const durationSeconds = await getAudioDuration(audioUri);

      return {
        id,
        title: titleFromFilename(asset.name),
        uploadedAt: new Date().toISOString(),
        audioUri,
        durationSeconds,
        tone: 'sage',
        note: 'imported recording',
      };
    } catch {
      Alert.alert('Import failed', 'Could not read that audio file. Try another format.');
      return null;
    } finally {
      setImporting(false);
    }
  }, []);

  return { importAudio, importing };
}
