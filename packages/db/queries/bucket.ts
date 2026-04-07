import { supabase } from '../lib/supabase'
const bucket = "content"

export class Bucket {
    public static async uploadFile(file: Buffer, path: string) {
        const {data, error} = await supabase.storage.from(bucket).upload(path, file)
        if (error) throw error;
        return data;
    }

    public static async downloadFile(path: string) {
        const {data, error} = await supabase.storage.from(bucket).download(path)
        if (error) throw error;
        return data;
    }
}