import express from "express";
import ffmpeg from "fluent-ffmpeg";

const app = express();
app.use(express.json());


app.post("/process-video", (req, res) => {
    // Get path of the input video file from the request body
    // already uploaded
    const inputFilePath = req.body.inputFilePath;
    const outputFilePath = req.body.outputFilePath;

    if (!inputFilePath || !outputFilePath) {
        return res.status(400).send("Bad request");
    }

    ffmpeg(inputFilePath)
        .outputOptions("-vf", "scale=iw*min(360/ih\\,1):-2")   // Set the video resolution to 360p
        .on("end", () => {
            res.status(200).send("Processing finished successfully");
        })
        .on("error", (err) => {
            console.log(`An error occurred: ${err.message}`);
            res.status(500).send(`Internal server error: ${err.message}`);
        })
        .save(outputFilePath);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`video-processing-service listening on port ${port}`);
});