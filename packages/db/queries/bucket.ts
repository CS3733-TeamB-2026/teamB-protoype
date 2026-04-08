import { supabase } from '../lib/supabase'
const bucket = "content"

export class Bucket {
    public static async uploadFile(file: Buffer, path: string): Promise<{id: string, path: string, fullPath: string}> {
        const {data, error} = await supabase.storage.from(bucket).upload(path, file)
        if (error) throw error;
        return data;
    }

    public static async downloadFile(path: string): Promise<Blob> {
        const {data, error} = await supabase.storage.from(bucket).download(path)
        if (error) throw error;
        return data;
    }

    public static async deleteFile(path: string): Promise<void> {
        const {error} = await supabase.storage.from(bucket).remove([path])
        if (error) throw error;
    }
}