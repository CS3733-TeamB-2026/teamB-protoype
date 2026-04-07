import { supabase } from '../lib/supabase'
const bucket = "content"

export class Bucket {
    public static async uploadFile(file: Buffer, path: string) {
        const {data, error} = await supabase.storage.from(bucket).upload(path, file)
        if (error) throw error;
        return data;
    }

    /*
    export async function queryObjectsByBucket(name: string): Promise<p.objects[]> {
        return prisma.objects.findMany({
            where: {
                bucket_id: name
            },
        })
    }
     */
}