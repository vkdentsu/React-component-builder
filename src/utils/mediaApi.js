import { authenticatedFetch, getApiUrl } from './api';

export const MAX_MEDIA_FILE_SIZE = 7 * 1024 * 1024; // 7 MB
export const ACCEPTED_MEDIA_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export function formatMediaSize(bytes) {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getMediaContentUrl(id) {
  return getApiUrl(`/api/media/${id}/content`);
}

export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error(`Could not read ${file.name}.`));
        return;
      }
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

export function validateImageFile(file) {
  if (!file) return 'No file selected.';
  if (!ACCEPTED_MEDIA_TYPES.has(file.type)) {
    return `${file.name}: Unsupported image format. Allowed: PNG, JPEG, GIF, WebP, AVIF.`;
  }
  if (file.size > MAX_MEDIA_FILE_SIZE) {
    return `${file.name}: Image exceeds the 7 MB maximum size limit (${formatMediaSize(file.size)}).`;
  }
  return null;
}

function getErrorMessage(result, fallback) {
  return result?.error?.message || fallback;
}

export async function fetchMediaAssets() {
  const response = await authenticatedFetch('/api/media');
  const result = await response.json();
  if (!response.ok) throw new Error(getErrorMessage(result, 'Could not load media assets.'));
  return result.data || [];
}

export async function fetchMediaFolders() {
  const response = await authenticatedFetch('/api/media/folders');
  const result = await response.json();
  if (!response.ok) throw new Error(getErrorMessage(result, 'Could not load media folders.'));
  return result.data || [];
}

export async function uploadMediaFile(file, folderPath = '') {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const contentBase64 = await readFileAsBase64(file);
  const response = await authenticatedFetch('/api/media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: file.name,
      folderPath: folderPath || '',
      mimeType: file.type,
      contentBase64,
    }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(getErrorMessage(result, 'Upload failed.'));
  return {
    ...result.data,
    url: getMediaContentUrl(result.data.id),
  };
}

export async function createMediaFolder(name, parentPath = '') {
  const response = await authenticatedFetch('/api/media/folders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name.trim(),
      parentPath: parentPath || '',
    }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(getErrorMessage(result, 'Could not create the folder.'));
  return result.data;
}

export async function renameMediaFolder(path, newName) {
  const response = await authenticatedFetch('/api/media/folders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path,
      name: newName.trim(),
    }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(getErrorMessage(result, 'Could not rename the folder.'));
  return result.data;
}

export async function deleteMediaFolder(path, deleteAssets = false) {
  const response = await authenticatedFetch('/api/media/folders', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, deleteAssets }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(result, 'Could not delete the folder.'));
  }
}

export async function updateMediaAsset(id, patch) {
  const response = await authenticatedFetch(`/api/media/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(getErrorMessage(result, 'Could not update the image.'));
  return result.data;
}

export async function deleteMediaAsset(id) {
  const response = await authenticatedFetch(`/api/media/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(result, 'Could not delete the image.'));
  }
}

