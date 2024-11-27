import { Storage } from "@google-cloud/storage";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";

const storage = new Storage();
const rawVideoBucketName = "yt-clone-raw-bucket";
const processedVideoBucketName = "yt-clone-processed-bucket";

const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";


/**
 * Creates the local directories for raw and processed videos
 */
export function setupDirectories() {
    ensureDirectoryExists(localRawVideoPath);
    ensureDirectoryExists(localProcessedVideoPath);
}

/**
 * @export
 * @param {String} rawVideoName - The name of file to be converted from {@link localRawVideoPath}
 * @param {String} processedVideoName - The name of processed file to be saved to {@link localProcessedVideoPath}
 * 
 * @returns - A promise that resolves when the video has been converted.
 */
export async function convertVideo(rawVideoName: String, processedVideoName: String) {
    return new Promise<void>((resolve, reject) => {
        ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
        .outputOptions("-vf", "scale=iw*min(360/ih\\,1):-2")   // Set the video resolution to 360p
        .on("end", () => {
            console.log("Conversion finished successfully");
            resolve()
        })
        .on("error", (err) => {
            console.log(`An error occurred: ${err.message}`);
            reject(`An error occurred: ${err.message}`);
        })
        .save(`${localProcessedVideoPath}/${processedVideoName}`); 
    });
}


/**
 * Downloads a raw video from the cloud storage and saves it locally.
 *
 * @param {string} rawVideoName - The name of the raw video file to download
 * from the {@link rawVideoBucketName} to the {@link localRawVideoPath}.
 * 
 * @returns - A promise that resolves when the video has been downloaded.
 */
export async function download(rawVideoName: string) {
    // bucket: Get a reference to a Cloud Storage bucket
    await storage.bucket(rawVideoBucketName)
        .file(rawVideoName)
        .download({
            destination: `${localRawVideoPath}/${rawVideoName}`,
        }
    );

    console.log(`gs://${rawVideoBucketName}/${rawVideoName} downloaded to ${localRawVideoPath}/${rawVideoName}`);
}


/**
 * Uploads a processed video to the cloud storage and makes it public.
 *
 * @param {string} processedVideoName - The name of the processed video file
 * to upload from the {@link localProcessedVideoPath} to the
 * {@link processedVideoBucketName}.
 *
 * @returns - A promise that resolves when the video has been uploaded.
 */
export async function upload(processedVideoName: string) {
    const bucket = storage.bucket(processedVideoBucketName);
    await bucket.upload(`${localProcessedVideoPath}/${processedVideoName}`, {
            destination: `${processedVideoName}`
        }
    );

    console.log(`gs://${processedVideoBucketName}/${processedVideoName} uploaded to ${localProcessedVideoPath}/${processedVideoName}`);

    await bucket.file(`${processedVideoName}`).makePublic();
}

export function deleteRawVideo(rawVideoName: string) {
    return deleteVideo(`${localRawVideoPath}/${rawVideoName}`);
}

export function deleteProcessedVideo(processedVideoName: string) {
    return deleteVideo(`${localProcessedVideoPath}/${processedVideoName}`);
}

function deleteVideo(filePath: string) {
    return new Promise<void>((resolve, reject) => {
        if (fs.existsSync(filePath)) {
            // unlink is async
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log(`failed to delete ${filePath}`);
                    return reject(err);
                }
                console.log(`deleted ${filePath}`);
                return resolve();
            });
        }
        console.log(`file ${filePath} does not exist`);
        resolve();
    })
}


function ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        //recursive: enables creating nested directories
        fs.mkdirSync(dirPath, {recursive: true}); 
    }
}