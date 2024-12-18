import express from "express";
import { convertVideo, deleteProcessedVideo, deleteRawVideo, download, setupDirectories, upload } from "./storage";
import { isVideoNew, setVideo } from "./firestore";
const app = express();
app.use(express.json());
setupDirectories();

app.post("/process-video", async (req, res) => {
    const pubSubMessage = req.body.message;
    let data;
    try {
        data = Buffer.from(pubSubMessage.data, 'base64').toString().trim();
        data = JSON.parse(data);

        if (!data.name) {
            throw new Error('Invalid message payload');
        }
    } catch (err) {
        console.error(err);
        return res.status(400).send(`Bad Request: ${err}`);
    }

    const rawVideoName = data.name; // format of <UID>-<DATE>.<EXTENSION>
    const processedVideoName = `processed-${rawVideoName}`;
    const videoId = rawVideoName.split(".")[0];

    if (!isVideoNew(videoId)) {
        return res.status(400).send("Bad Request: video already processing or processed");
    } else {
        await setVideo(videoId, {
            id: videoId,
            uid: videoId.split("-")[0],
            status: "processing"
        });
    }

    // download the raw video from the cloud storage
    await download(rawVideoName);
    try {
        await convertVideo(rawVideoName, processedVideoName);
    } catch(err) {
        // Careful: deletion is async
        await Promise.all([
            deleteRawVideo(rawVideoName),
            deleteProcessedVideo(processedVideoName)
        ]);
        console.error(err);
        return res.status(500).send(`Internal Server Error: ${err}`);
    }

    // upload the processed video to the cloud storage
    await upload(processedVideoName);
    await setVideo(videoId, {
        status: "processed",
        filename: processedVideoName
    });

    // clean up
    await Promise.all([
        deleteRawVideo(rawVideoName),
        deleteProcessedVideo(processedVideoName)
    ]);

    res.status(200).send("Video processed successfully");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`video-processing-service listening on port ${port}`);
});