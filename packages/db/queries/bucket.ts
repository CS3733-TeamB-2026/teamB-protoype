import { supabase } from '../lib/supabase'
import {prisma} from "../lib/prisma";
const bucket = "content"

export class Bucket {
    public static async uploadFile(file: Buffer, path: string): Promise<{id: string, path: string, fullPath: string}> {
        const {data, error} = await supabase.storage.from(bucket).upload(path, file)
        if (error) throw error;
        return data;
    }

    public static async updateFile(file: Buffer, path: string): Promise<{id: string, path: string, fullPath: string}> {
        const {data, error} = await supabase.storage.from(bucket).update(path, file)
        if (error) throw error;
        return data;
    }

    public static async downloadFile(path: string): Promise<Blob> {
        const {data, error} = await supabase.storage.from(bucket).download(path)
        if (error) throw error;
        return data;
    }

    public static async createPublicUrl(id: number): Promise<string> {
        const contentItem = await prisma.content.findUnique({
            where: {id: id},
        })
        const path = contentItem?.fileURI ?? null
        if(!path) {return ""}

        const {data, error} = await supabase.storage.from(bucket).createSignedUrl(path, 120)
        if (error) throw error;
        return data.signedUrl;
    }

    public static async getFileMetadata(path: string) {
        const parts = path.split("/");
        const filename = parts.pop()!;
        const folder = parts.join("/");
        const {data, error} = await supabase.storage.from(bucket).list(folder, {search: filename});
        if (error) throw error;
        const file = data.find((f) => f.name === filename);
        return file?.metadata ?? null;
    }

    public static async deleteFile(path: string) {
        const {error} = await supabase.storage.from(bucket).remove([path])
        if (error) throw error;
    }
}