/**
 * Supabase Storage Utilities
 * Upload de fotos e documentos com compression e progress tracking
 */

import { supabase } from '../config/supabaseClient';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
  size?: number;
  mimeType?: string;
}

/**
 * Comprime imagem antes de upload
 */
export async function compressImage(file: File, maxWidth: number = 2560, maxHeight: number = 2560, quality: number = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        // Calcular novo tamanho mantendo aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        // Compressor usando canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para blob com qualidade especificada
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Valida arquivo de imagem
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Formato não suportado. Use JPEG, PNG, WebP ou GIF.' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Arquivo muito grande. Máximo 50MB.' };
  }
  
  return { valid: true };
}

/**
 * Valida arquivo de documento
 */
export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Formato não suportado. Use PDF ou Word.' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Arquivo muito grande. Máximo 100MB.' };
  }
  
  return { valid: true };
}

/**
 * Upload de foto com compressão
 */
export async function uploadPropertyPhoto(
  propertyId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // Validar arquivo
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    // Comprimir imagem
    const compressedBlob = await compressImage(file);
    const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
    
    // Gerar nome único
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${propertyId}/${timestamp}-${randomStr}.jpg`;
    
    // Upload para Supabase
    const { data, error } = await supabase.storage
      .from('property-photos')
      .upload(fileName, compressedFile, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    // Gerar URL pública
    const { data: publicData } = supabase.storage
      .from('property-photos')
      .getPublicUrl(data.path);
    
    return {
      success: true,
      url: publicData.publicUrl,
      path: data.path,
      size: compressedFile.size,
      mimeType: 'image/jpeg',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, error: message };
  }
}

/**
 * Upload de documento
 */
export async function uploadPropertyDocument(
  propertyId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // Validar arquivo
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    // Gerar nome único
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${propertyId}/${timestamp}-${randomStr}-${file.name}`;
    
    // Upload para Supabase
    const { data, error } = await supabase.storage
      .from('property-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    // Gerar URL pública
    const { data: publicData } = supabase.storage
      .from('property-documents')
      .getPublicUrl(data.path);
    
    return {
      success: true,
      url: publicData.publicUrl,
      path: data.path,
      size: file.size,
      mimeType: file.type,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, error: message };
  }
}

/**
 * Deleta arquivo do storage
 */
export async function deleteStorageFile(bucket: 'property-photos' | 'property-documents', filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    
    return !error;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

/**
 * Batch delete de arquivos
 */
export async function deleteStorageFiles(bucket: 'property-photos' | 'property-documents', filePaths: string[]): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(filePaths);
    
    return !error;
  } catch (error) {
    console.error('Batch delete error:', error);
    return false;
  }
}

/**
 * Gera URL pública de arquivo
 */
export function getStorageFileUrl(bucket: 'property-photos' | 'property-documents', filePath: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}
