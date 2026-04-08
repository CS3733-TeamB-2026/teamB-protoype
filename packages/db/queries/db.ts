import {supabase} from "../lib/supabase";
import * as q from "@supabase/supabase-js"

export class DB {
    public static async uploadFile(file: Buffer, path: string): Promise<{id: string, path: string, fullPath: string}> {
        return q.
    }

    public static async downloadFile(path: string): Promise<Blob> {

    }

    public static async deleteFile(path: string): Promise<void> {

    }
}