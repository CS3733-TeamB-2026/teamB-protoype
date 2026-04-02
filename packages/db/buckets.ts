import { supabase } from './lib/supabase'

const bucket = "test";

export async function createBucket() {
    const {data, error} = await supabase.storage.createBucket(bucket, {
        public: true, // default: false
    })
    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Bucket created:", data);
    }
}

export async function deleteBucket() {
    const {data, error} = await supabase.storage.createBucket(bucket, {
        public: true, // default: false
    })
    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Bucket created:", data);
    }
}

export async function readBucket() {
    const {data, error} = await supabase.storage.createBucket(bucket, {
        public: true, // default: false
    })
    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Bucket:", data);
    }
}

export async function uploadFile(file: Buffer, path: string) {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file)
    if (error) {
        console.log("Error:", error);
    } else {
        console.log("File uploaded:", data);
    }
}
