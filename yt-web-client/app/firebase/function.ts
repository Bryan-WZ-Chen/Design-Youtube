import {httpsCallable} from "firebase/functions";
import {functions} from "./firebase";

const generateUploadURL = httpsCallable(functions, "generateUploadURL");
const getVideosFunction = httpsCallable(functions, "getVideos");

export interface Video {
    id?: string;
    uid?: string;
    filename?: string;
    status?: 'processing' | 'processed';
    title?: string;
    description?: string;
}


export async function uploadVideo(file: File) {
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await generateUploadURL({
        fileExtension: file.name.split(".").pop()
    })

    // upload the video via the signed URL
    await fetch(response?.data?.url, {
        method: "PUT",
        body: file,
        headers: {
            "Content-Type": file.type
        }
    });
    return;
}

export async function getVideos() {
    const response = await getVideosFunction();
    return response.data as Video[];
}