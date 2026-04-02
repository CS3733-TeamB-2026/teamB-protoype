import { supabase } from './lib/supabase'

const bucket = "test";

export async function createBucket() {
    const {data, error} = await supabase.storage.createBucket(bucket, {
        public: true, // default: false
    })
    if (error)  throw error;
    return data;
}

export async function listBuckets() {
    const {data, error} = await supabase.storage.listBuckets()
    if (error)  throw error;
    return data;
}

export async function getBucket() {
    const {data, error} = await supabase.storage.getBucket("test");
    if (error)  throw error;
    return data;
}

export async function uploadFile(file: Buffer, path: string) {
    const {data, error} = await supabase.storage.from(bucket).upload(path, file)
    if (error)  throw error;
    return data;
}
