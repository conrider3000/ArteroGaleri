import { pgTable, uuid, text, timestamp, boolean, jsonb, integer, index, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const accessModeEnum = pgEnum('access_mode', ['public', 'unlisted', 'password']);
export const mediaKindEnum = pgEnum('media_kind', ['image', 'video', 'other']);
export const syncStatusEnum = pgEnum('sync_status', ['idle', 'running', 'completed', 'failed']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  googleSub: text('google_sub').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const cloudProviders = pgTable('cloud_providers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  provider: text('provider').notNull(),
  displayName: text('display_name'),
  encryptedAccessToken: text('encrypted_access_token'),
  encryptedRefreshToken: text('encrypted_refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  config: jsonb('config').$type<Record<string, unknown>>().default({}),
  isDefault: boolean('is_default').default(false),
  connectedAt: timestamp('connected_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('unique_user_provider').on(t.userId, t.provider),
]);

export const galleries = pgTable('galleries', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  providerId: uuid('provider_id').references(() => cloudProviders.id, { onDelete: 'restrict' }).notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  sourceFolderId: text('source_folder_id').notNull(),
  sourceDriveId: text('source_drive_id'),
  sourcePath: text('source_path'),
  accessMode: accessModeEnum('access_mode').default('unlisted').notNull(),
  passwordHash: text('password_hash'),
  allowedEmails: text('allowed_emails').array().default([]),
  requireEmailVerification: boolean('require_email_verification').default(false),
  allowDownload: boolean('allow_download').default(true),
  maxResolution: text('max_resolution').default('full'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  settings: jsonb('settings').$type<GallerySettings>().default({
    defaultView: 'justified',
    sortBy: 'dateTaken',
    sortDir: 'desc',
    theme: 'system',
    showMetadata: true,
    showMap: false,
  }),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  syncCursor: text('sync_cursor'),
  syncStatus: syncStatusEnum('sync_status').default('idle').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('galleries_owner_idx').on(t.ownerId),
  index('galleries_provider_idx').on(t.providerId),
]);

export const media = pgTable('media', {
  id: uuid('id').defaultRandom().primaryKey(),
  galleryId: uuid('gallery_id').references(() => galleries.id, { onDelete: 'cascade' }).notNull(),
  providerFileId: text('provider_file_id').notNull(),
  providerFileHash: text('provider_file_hash'),
  name: text('name').notNull(),
  mimeType: text('mime_type').notNull(),
  extension: text('extension').notNull(),
  kind: mediaKindEnum('kind').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  width: integer('width'),
  height: integer('height'),
  dateTaken: timestamp('date_taken', { withTimezone: true }),
  cameraMake: text('camera_make'),
  cameraModel: text('camera_model'),
  lensModel: text('lens_model'),
  iso: integer('iso'),
  aperture: text('aperture'),
  shutterSpeed: text('shutter_speed'),
  focalLength: text('focal_length'),
  orientation: integer('orientation'),
  latitude: text('latitude'),
  longitude: text('longitude'),
  durationMs: integer('duration_ms'),
  folderPath: text('folder_path').notNull(),
  parentFolderId: text('parent_folder_id'),
  isStarred: boolean('is_starred').default(false),
  tags: text('tags').array().default([]),
  thumbKey: text('thumb_key'),
  gridKey: text('grid_key'),
  previewKey: text('preview_key'),
  lqip: text('lqip'),
  dominantColor: text('dominant_color'),
  indexedAt: timestamp('indexed_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('media_gallery_provider_unique').on(t.galleryId, t.providerFileId),
  index('media_gallery_date_idx').on(t.galleryId, t.dateTaken),
  index('media_gallery_folder_idx').on(t.galleryId, t.folderPath),
  index('media_gallery_kind_idx').on(t.galleryId, t.kind),
  index('media_gallery_camera_idx').on(t.galleryId, t.cameraMake, t.cameraModel),
  index('media_gallery_starred_idx').on(t.galleryId, t.isStarred),
  index('media_gallery_tags_idx').on(t.galleryId, t.tags),
]);

export const galleryAccessLogs = pgTable('gallery_access_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  galleryId: uuid('gallery_id').references(() => galleries.id, { onDelete: 'cascade' }).notNull(),
  ipHash: text('ip_hash').notNull(),
  method: text('method').notNull(),
  success: boolean('success').notNull(),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('access_logs_gallery_idx').on(t.galleryId, t.createdAt),
]);

export const usersRelations = relations(users, ({ many }) => ({
  cloudProviders: many(cloudProviders),
  galleries: many(galleries),
}));

export const cloudProvidersRelations = relations(cloudProviders, ({ one, many }) => ({
  user: one(users, {
    fields: [cloudProviders.userId],
    references: [users.id],
  }),
  galleries: many(galleries),
}));

export const galleriesRelations = relations(galleries, ({ one, many }) => ({
  owner: one(users, {
    fields: [galleries.ownerId],
    references: [users.id],
  }),
  provider: one(cloudProviders, {
    fields: [galleries.providerId],
    references: [cloudProviders.id],
  }),
  media: many(media),
  accessLogs: many(galleryAccessLogs),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  gallery: one(galleries, {
    fields: [media.galleryId],
    references: [galleries.id],
  }),
}));

export const galleryAccessLogsRelations = relations(galleryAccessLogs, ({ one }) => ({
  gallery: one(galleries, {
    fields: [galleryAccessLogs.galleryId],
    references: [galleries.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type CloudProvider = typeof cloudProviders.$inferSelect;
export type Gallery = typeof galleries.$inferSelect;
export type Media = typeof media.$inferSelect;

export type GallerySettings = {
  defaultView: 'masonry' | 'justified' | 'timeline' | 'slideshow' | 'folders' | 'map';
  sortBy: 'dateTaken' | 'name' | 'size' | 'camera' | 'random';
  sortDir: 'asc' | 'desc';
  theme: 'light' | 'dark' | 'system';
  showMetadata: boolean;
  showMap: boolean;
};