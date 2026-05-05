import { supabase } from '../lib/supabase'
import { prisma } from "../lib/prisma";

/**
 * Supabase Storage operations — wraps the JS SDK and normalises errors by throwing.
 * Defaults to the "content" bucket unless an alternate bucket is specified.
 */
export class Bucket {

    /** Creates a signed URL for a file, valid for `expiresIn` seconds (default 1 hour). Returns null if no URL is returned. */
    public static async createSignedUrl(path: string, expiresIn: number = 3600, bucket: string = "content"): Promise<string | null> {
        const {data, error} = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
        if (error) throw error;
        return data?.signedUrl ?? null;
    }

    /** Uploads a new file. Throws on collision — use `updateFile` when the path may already exist. */
    public static async uploadFile(file: Buffer, path: string, bucket = "content"): Promise<{id: string, path: string, fullPath: string}> {
        const {data, error} = await supabase.storage.from(bucket).upload(path, file)
        if (error) throw error;
        return data;
    }

    /** Replaces an existing file in-place. Preferred over delete+upload when the path should stay stable. */
    public static async updateFile(file: Buffer, path: string, bucket = "content"): Promise<{id: string, path: string, fullPath: string}> {
        const {data, error} = await supabase.storage.from(bucket).update(path, file)
        if (error) throw error;
        return data;
    }

    /** Downloads a file from storage as a `Blob`. */
    public static async downloadFile(path: string, bucket = "content"): Promise<Blob> {
        const {data, error} = await supabase.storage.from(bucket).download(path)
        if (error) throw error;
        return data;
    }

    /** Returns a 2-minute signed URL for a content item's attached file, or null if no file is set. */
    public static async createPublicUrl(id: number): Promise<string | null> {
        const contentItem = await prisma.content.findUnique({
            where: { id },
        })
        const path = contentItem?.fileURI ?? null
        if (!path) { return null }
        return Bucket.createSignedUrl(path, 120);
    }

    /** Returns Supabase metadata (size, MIME type, etc.) for a file path, or null if the file isn't found. */
    public static async getFileMetadata(path: string, bucket = "content") {
        const parts = path.split("/");
        const filename = parts.pop()!;
        const folder = parts.join("/");
        const {data, error} = await supabase.storage.from(bucket).list(folder, {search: filename});
        if (error) throw error;
        const file = data.find((f) => f.name === filename);
        return file?.metadata ?? null;
    }

    /** Deletes a file from storage. Throws if the Supabase SDK returns an error. */
    public static async deleteFile(path: string, bucket = "content") {
        const {error} = await supabase.storage.from(bucket).remove([path])
        if (error) throw error;
    }
}
