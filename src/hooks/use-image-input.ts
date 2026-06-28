/**
 * Captures a photo (camera or library) and extracts its text. Image is an input
 * method: the read text is handed back via `onText` so the screen can drop it
 * into the generation field for the user to confirm before generating.
 */

import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';

import i18n from '@/i18n';
import { extractTextFromImage, ImageTextError } from '@/lib/extract-text';

/** Compress a little to keep the upload small without hurting text legibility. */
const IMAGE_QUALITY = 0.8;

export interface ImageInput {
  /** True while reading text from a picked image. */
  loading: boolean;
  error: string | null;
  fromCamera: () => void;
  fromLibrary: () => void;
}

export function useImageInput(
  onText: (text: string) => void,
  onPaywall?: () => void,
): ImageInput {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResult = useCallback(
    async (result: ImagePicker.ImagePickerResult) => {
      if (result.canceled) return;
      const base64 = result.assets[0]?.base64;
      if (!base64) {
        setError(i18n.t('image.cannotRead'));
        return;
      }
      setLoading(true);
      try {
        const text = await extractTextFromImage({ base64, mimeType: result.assets[0]?.mimeType });
        if (text) onText(text);
        else setError(i18n.t('image.noText'));
      } catch (e) {
        if (e instanceof ImageTextError && e.paywall) onPaywall?.();
        else setError(e instanceof ImageTextError ? e.message : i18n.t('image.readingFailed'));
      } finally {
        setLoading(false);
      }
    },
    [onText, onPaywall],
  );

  const fromCamera = useCallback(async () => {
    setError(null);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError(i18n.t('image.cameraOff'));
      return;
    }
    await handleResult(
      await ImagePicker.launchCameraAsync({ base64: true, mediaTypes: ['images'], quality: IMAGE_QUALITY }),
    );
  }, [handleResult]);

  const fromLibrary = useCallback(async () => {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError(i18n.t('image.photoOff'));
      return;
    }
    await handleResult(
      await ImagePicker.launchImageLibraryAsync({ base64: true, mediaTypes: ['images'], quality: IMAGE_QUALITY }),
    );
  }, [handleResult]);

  return { loading, error, fromCamera, fromLibrary };
}
