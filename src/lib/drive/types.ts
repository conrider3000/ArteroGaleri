export interface MediaFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  createdTime?: string;
  thumbnailLink?: string;
  downloadLink?: string;
  imageMediaMetadata?: {
    dateTaken?: string;
    width?: number;
    height?: number;
    cameraMake?: string;
    cameraModel?: string;
    lensModel?: string;
    iso?: number;
    aperture?: number;
    exposureTime?: string;
    focalLength?: number;
    location?: { latitude: number; longitude: number };
    orientation?: number;
  };
  videoMediaMetadata?: {
    durationMillis?: string;
    width?: number;
    height?: number;
  };
  parents?: string[];
  shortcutDetails?: {
    targetId: string;
    targetMimeType: string;
  };
  md5Checksum?: string;
}

export interface ListOptions {
  folderId: string;
  driveId?: string;
  pageToken?: string;
  pageSize?: number;
  orderBy?: string;
  query?: string;
  fields?: string;
}

export interface ListResult {
  files: MediaFile[];
  nextPageToken?: string;
  incompleteSearch?: boolean;
}

export interface MediaSource {
  readonly provider: string;
  readonly displayName: string;
  validateToken(): Promise<boolean>;
  refreshAccessToken(): Promise<{ accessToken: string; expiresAt: Date }>;
  listFiles(opts: ListOptions): Promise<ListResult>;
  getFile(fileId: string): Promise<MediaFile>;
  downloadFile(fileId: string, range?: string): Promise<ReadableStream>;
  getThumbnailUrl(fileId: string, size?: number): Promise<string>;
  watchChanges?(folderId: string, webhookUrl: string): Promise<{ channelId: string; resourceId: string }>;
  stopWatch?(channelId: string, resourceId: string): Promise<void>;
}

export type DriveFile = MediaFile;