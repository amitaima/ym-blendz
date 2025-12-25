// ImageContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useApp } from './AppContext';
import { UserRole } from '../types';

interface ImageContextType {
  homePageImages: string[];
  uploadHomePageImage: (file: File, index: number) => Promise<void>;
}

const ImageContext = createContext<ImageContextType | null>(null);

const IMAGE_COUNT = 6;

export const ImageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useApp();
  const storage = getStorage();

  const [homePageImages, setHomePageImages] = useState<string[]>([]);

  /** LOAD images from storage */
  const loadImages = async () => {
    const urls = await Promise.all(
      Array.from({ length: IMAGE_COUNT }).map(async (_, i) => {
        try {
          const imageRef = ref(storage, `home-images/haircut${i + 1}.jpg`);
          const url = await getDownloadURL(imageRef);
          return `${url}?t=${Date.now()}`;
        } catch {
          return '';
        }
      })
    );
    setHomePageImages(urls);
  };

  useEffect(() => {
    loadImages();
  }, []);

  /** UPLOAD + refresh */
  const uploadHomePageImage = async (file: File, index: number) => {
    if (state.currentUser?.role !== UserRole.ADMIN) return;

    const imageRef = ref(storage, `home-images/haircut${index + 1}.jpg`);
    await uploadBytes(imageRef, file);
    await loadImages(); // 🔥 refresh UI immediately
  };

  return (
    <ImageContext.Provider value={{ homePageImages, uploadHomePageImage }}>
      {children}
    </ImageContext.Provider>
  );
};

export const useImages = () => {
  const ctx = useContext(ImageContext);
  if (!ctx) throw new Error('useImages must be inside ImageProvider');
  return ctx;
};
