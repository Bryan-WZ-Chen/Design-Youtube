import {getFunctions, httpsCallable} from "firebase/functions";

const functions = getFunctions();

const generateUploadURL = httpsCallable(functions, "generateUploadURL");

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