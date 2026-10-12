// One rule for "can this string be shown in an <img>?" used across the site,
// plus client-side compression for uploaded photos.

const PLACEHOLDER_HOSTS = ['randomuser.me', 'pravatar.cc', 'placeholder.com', 'via.placeholder', 'placehold.co'];

export function isDisplayableImage(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const url = value.trim();
  if (!url || url === 'undefined' || url === 'null') return false;
  if (url.startsWith('blob:')) return false; // object URLs die with the tab that created them
  if (url.startsWith('data:')) return url.startsWith('data:image/');
  if (url.startsWith('/')) return !url.startsWith('//');
  if (!/^https?:\/\//i.test(url)) return false;
  return !PLACEHOLDER_HOSTS.some(host => url.includes(host));
}

export function displayableImages(values: unknown): string[] {
  return Array.isArray(values) ? values.filter(isDisplayableImage).map(v => v.trim()) : [];
}

/**
 * Resizes a photo in the browser and returns a JPEG data URL, so phone-camera uploads
 * (often 4–10 MB) are stored at a few hundred KB and load quickly everywhere.
 */
export function compressImageFile(file: File, maxDimension = 1280, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the image.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('This image format is not supported.'));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.fillStyle = '#ffffff'; // transparent PNGs become white instead of black in JPEG
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
