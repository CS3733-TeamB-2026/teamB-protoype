import { supabase } from '../lib/supabase'
import { prisma } from "../lib/prisma";

export class Bucket {

    public static async createSignedUrl(path: string, expiresIn: number = 3600, bucket: string = "content"): Promise<string | null> {
        const {data, error} = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
        if (error) throw error;
        return data?.signedUrl ?? null;
    }

    public static async uploadFile(file: Buffer, path: string, bucket = "content"): Promise<{id: string, path: string, fullPath: string}> {
        const {data, error} = await supabase.storage.from(bucket).upload(path, file)
        if (error) throw error;
        return data;
    }

    public static async updateFile(file: Buffer, path: string, bucket = "content"): Promise<{id: string, path: string, fullPath: string}> {
        const {data, error} = await supabase.storage.from(bucket).update(path, file)
        if (error) throw error;
        return data;
    }

    public static async downloadFile(path: string, bucket = "content"): Promise<Blob> {
        const {data, error} = await supabase.storage.from(bucket).download(path)
        if (error) throw error;
        return data;
    }

    public static async createPublicUrl(id: number): Promise<string | null> {
        const contentItem = await prisma.content.findUnique({
            where: { id },
        })
        const path = contentItem?.fileURI ?? null
        if (!path) { return null }
        return Bucket.createSignedUrl(path, 120);
    }

    public static async getFileMetadata(path: string, bucket = "content") {
        const parts = path.split("/");
        const filename = parts.pop()!;
        const folder = parts.join("/");
        const {data, error} = await supabase.storage.from(bucket).list(folder, {search: filename});
        if (error) throw error;
        const file = data.find((f) => f.name === filename);
        return file?.metadata ?? null;
    }

    public static async deleteFile(path: string, bucket = "content") {
        const {error} = await supabase.storage.from(bucket).remove([path])
        if (error) throw error;
    }
}
