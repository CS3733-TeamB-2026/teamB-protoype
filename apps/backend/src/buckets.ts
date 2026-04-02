import supabase from './lib/supabase.js'
import {readFileSync} from "fs";

const bucket = "test";

async function createBucket() {
    const {data, error} = await supabase.storage.createBucket(bucket, {
        public: true, // default: false
    })
    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Bucket created:", data);
    }
}

async function deleteBucket() {
    const {data, error} = await supabase.storage.createBucket(bucket, {
        public: true, // default: false
    })
    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Bucket created:", data);
    }
}

async function readBucket() {
    const {data, error} = await supabase.storage.createBucket(bucket, {
        public: true, // default: false
    })
    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Bucket:", data);
    }
}

async function uploadFile(file: Buffer, path: string) {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file)
    if (error) {
        console.log("Error:", error);
    } else {
        console.log("File uploaded:", data);
    }
}

// curl -v https://mvenfqykopvrbrqzwbiy.supabase.co/storage/v1/object/public/test/public/test.txt

async function main() {
    const file = readFileSync("./test.txt");
    await uploadFile(file, "public/test.txt")
}

main();