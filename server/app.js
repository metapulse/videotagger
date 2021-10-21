const express = require("express");
const path = require("path");
const app = express();
const fs = require("fs");
const cors = require("cors");
const { exec } = require("child_process");
const WebSocket = require("websocket");
const http = require("http");

/**
 * Web socket server for logger
 */
const webSocketServer = http.createServer();
webSocketServer.listen(9090);

const wss = new WebSocket.server({
    httpServer: webSocketServer
});

wss.on("request", function (request) {
    const connection = request.accept(null, request.origin);

    const logFilePath = path.join(__dirname, "progress_log.json");
    options = {
        interval: 500,
    }

    fs.unwatchFile(logFilePath);
    fs.watchFile(logFilePath, options, (curr, prev) => {
        try {
            const logFile = fs.readFileSync(logFilePath, options = { encoding: "utf-8" });
            const logFileJson = JSON.parse([logFile]);
            connection.sendUTF(logFileJson.progress);
        } catch (error) {
            pass;
        }
    })

})

app.use(cors()); // initialize cors middleware for all routes **should be changed to only allow specific routes when in production**
app.use(express.static(path.join(__dirname, "build")));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public", "stream")));

app.use(
    express.urlencoded({
        extended: true
    })
);
app.use(express.json());

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "build", "index.html"));
})

/**
 * Get all the video filenames in public/videos folder
 */
app.get("/getVideoFiles", function (req, res) {
    const videoFiles = fs.readdirSync(path.join(__dirname, "public", "videos"));
    const videoFileExtensions = [".mp4", ".mkv", ".avi"]
    const response = []

    videoFiles.forEach(function (videoFile) {
        if (videoFileExtensions.includes(path.extname(videoFile))) {
            response.push(videoFile);
        }
    });

    res.send(response);
});

/**
 * Get all the audio filenames in public/audio folder
 */
app.get("/getAudioFiles", function (req, res) {
    const audioFiles = fs.readdirSync(path.join(__dirname, "public", "audio"));
    const audioFileExtensions = [".mp3", ".wav", ".aac"]
    const response = []

    audioFiles.forEach(function (audioFile) {
        if (audioFileExtensions.includes(path.extname(audioFile))) {
            response.push(audioFile);
        }
    });

    res.send(response);
});

/**
 * Get the duration of the given video file
 */
app.post("/getVideoFileDuration", async function (req, res) {
    let duration = "";
    if (req.body && req.body.filename) {
        // access the video file and find its duration
        const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 public/videos/${req.body.filename}`;
        duration = await execShellCommand(command);
    }

    res.send(duration);
});

/**
 * Get the duration of the given audio file
 */
app.post("/getAudioFileDuration", async function (req, res) {
    let duration = "";
    if (req.body && req.body.filename) {
        // access the video file and find its duration
        const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 public/audio/${req.body.filename}`;
        duration = await execShellCommand(command);
    }

    res.send(duration);
});

/**
 * Create videoClips.json that will tell us how to concatenate the video clips
 */
app.post("/createVideoClipsJson", async function (req, res) {
    let status = "fail";

    if (req.body) {
        const jsonString = JSON.stringify(req.body);
        const jsonPath = path.join("public", "temp", "videoClips.json");
        fs.writeFileSync(jsonPath, jsonString);
        status = "success";
    }

    res.send(status);
})

/**
 * Create audioClips.json that will tell us how to concatenate the audio clips
 */
app.post("/createAudioClipsJson", async function (req, res) {
    let status = "fail";

    if (req.body) {
        const jsonString = JSON.stringify(req.body);
        const jsonPath = path.join("public", "temp", "audioClips.json");
        fs.writeFileSync(jsonPath, jsonString);
        status = "success";
    }

    res.send(status);
})

/**
 * Create the stream
 */
app.get("/createStream", async function (req, res) {
    let status = "fail";

    try {
        const pythonScript = await execShellCommand(`python3 main.py`);
        status = "success"
    } catch (error) {
        console.log("error occurred");
        console.log(error);
    }

    res.send(status);
})

/**
 * Get stream file
 */
app.get("/getStreamFile", function (req, res) {
    res.sendFile(path.join(__dirname, "public", "stream", "stream.m3u8"));
})

app.listen(process.env.PORT || 3000, function (req, res) {
    if (process.env.PORT) {
        console.log(`server started successfully on port ${process.env.PORT}`);
    } else {
        console.log(`server started successfully on port 3000`);
    }
})

function execShellCommand(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }
            if (stderr) {
                console.log(stderr)
            }
            if (stdout) {
                resolve(stdout);
            }
        })
    });
}