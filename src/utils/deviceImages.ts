import { deviceImageMap as rawDeviceImageMap } from '../data/deviceImageMap';

export function getDeviceImageUrl(deviceId: string, customImage?: string): string {
  if (customImage && customImage.trim()) {
    let trimmed = customImage.trim();
    if (trimmed.startsWith('/devices/')) {
      trimmed = '/device/' + trimmed.substring('/devices/'.length);
    }
    if (trimmed.startsWith('/device/') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
      return trimmed;
    }
    return `/device/${trimmed.replace(/^\/+/, '')}`;
  }

  const mappedPath = rawDeviceImageMap[deviceId];
  if (mappedPath) {
    return mappedPath.startsWith('/devices/') ? '/device/' + mappedPath.substring('/devices/'.length) : mappedPath;
  }

  if (deviceId) {
    return `/device/${deviceId}_Thumbnail.png`;
  }

  return '/device/NewLabCommon_Thumbnail.png';
}
