CREATE TYPE "public"."access_mode" AS ENUM('public', 'unlisted', 'password');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('image', 'video', 'other');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('idle', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "cloud_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"display_name" text,
	"encrypted_access_token" text,
	"encrypted_refresh_token" text,
	"token_expires_at" timestamp with time zone,
	"scope" text,
	"config" jsonb DEFAULT '{}'::jsonb,
	"is_default" boolean DEFAULT false,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "galleries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"source_folder_id" text NOT NULL,
	"source_drive_id" text,
	"source_path" text,
	"access_mode" "access_mode" DEFAULT 'unlisted' NOT NULL,
	"password_hash" text,
	"allowed_emails" text[] DEFAULT '{}',
	"require_email_verification" boolean DEFAULT false,
	"allow_download" boolean DEFAULT true,
	"max_resolution" text DEFAULT 'full',
	"expires_at" timestamp with time zone,
	"settings" jsonb DEFAULT '{"defaultView":"justified","sortBy":"dateTaken","sortDir":"desc","theme":"system","showMetadata":true,"showMap":false}'::jsonb,
	"last_synced_at" timestamp with time zone,
	"sync_cursor" text,
	"sync_status" "sync_status" DEFAULT 'idle' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "galleries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "gallery_access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"ip_hash" text NOT NULL,
	"method" text NOT NULL,
	"success" boolean NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"provider_file_id" text NOT NULL,
	"provider_file_hash" text,
	"name" text NOT NULL,
	"mime_type" text NOT NULL,
	"extension" text NOT NULL,
	"kind" "media_kind" NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"date_taken" timestamp with time zone,
	"camera_make" text,
	"camera_model" text,
	"lens_model" text,
	"iso" integer,
	"aperture" text,
	"shutter_speed" text,
	"focal_length" text,
	"orientation" integer,
	"latitude" text,
	"longitude" text,
	"duration_ms" integer,
	"folder_path" text NOT NULL,
	"parent_folder_id" text,
	"is_starred" boolean DEFAULT false,
	"tags" text[] DEFAULT '{}',
	"thumb_key" text,
	"grid_key" text,
	"preview_key" text,
	"lqip" text,
	"dominant_color" text,
	"indexed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_sub" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_google_sub_unique" UNIQUE("google_sub")
);
--> statement-breakpoint
ALTER TABLE "cloud_providers" ADD CONSTRAINT "cloud_providers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_provider_id_cloud_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."cloud_providers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_access_logs" ADD CONSTRAINT "gallery_access_logs_gallery_id_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_gallery_id_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_provider" ON "cloud_providers" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "galleries_owner_idx" ON "galleries" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "galleries_provider_idx" ON "galleries" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "access_logs_gallery_idx" ON "gallery_access_logs" USING btree ("gallery_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "media_gallery_provider_unique" ON "media" USING btree ("gallery_id","provider_file_id");--> statement-breakpoint
CREATE INDEX "media_gallery_date_idx" ON "media" USING btree ("gallery_id","date_taken");--> statement-breakpoint
CREATE INDEX "media_gallery_folder_idx" ON "media" USING btree ("gallery_id","folder_path");--> statement-breakpoint
CREATE INDEX "media_gallery_kind_idx" ON "media" USING btree ("gallery_id","kind");--> statement-breakpoint
CREATE INDEX "media_gallery_camera_idx" ON "media" USING btree ("gallery_id","camera_make","camera_model");--> statement-breakpoint
CREATE INDEX "media_gallery_starred_idx" ON "media" USING btree ("gallery_id","is_starred");--> statement-breakpoint
CREATE INDEX "media_gallery_tags_idx" ON "media" USING btree ("gallery_id","tags");