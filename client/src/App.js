import './App.css';
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import MediaFilePicker from "./Components/MediaFilePicker";
import Axios from "axios";
import Button from 'react-bootstrap/Button';
import ReactHlsPlayer from 'react-hls-player';
import { useState, useRef } from "react";
import { ClipLoader } from "react-spinners";

const App = () => {
  const videoFilesToStream = useRef([]);
  const audioFilesToStream = useRef([]);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [streamCreationStatus, setStreamCreationStatus] = useState("");
  const [showStreamStatus, setShowStreamStatus] = useState(false);
  const [createStreamBtnDisabled, setcreateStreamBtnDisabled] = useState(false);
  const [showClipLoader, setShowClipLoader] = useState(false);

  return (
    <div>
      {showVideoPlayer === true ?
        <div>

          <div className="container d-flex flex-column min-vh-100 justify-content-center">
            <div className="row">
              <div className="col">
                <div className="text-center">
                  <ReactHlsPlayer
                    src={"http://localhost:3000/getStreamFile"}
                    autoPlay={true}
                    controls={true}
                    width="60%"
                    height="auto"
                  />
                </div>
                <div className="text-center">
                  <Button onClick={handleOnClickBack}> Back </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        :
        <div>
          <MediaFilePicker
            loadAvailableMediaFiles={getVideoFilesData}
            tableOneHeading="Available video files"
            tableTwoHeading="Video files added to stream"
            getMediaDurationRoute="getVideoFileDuration"
            mediaToStream={videoFilesToStream.current}
          />

          <MediaFilePicker
            loadAvailableMediaFiles={getAudioFilesData}
            tableOneHeading="Available audio files"
            tableTwoHeading="Audio files added to stream"
            getMediaDurationRoute="getAudioFileDuration"
            mediaToStream={audioFilesToStream.current}
          />

          <div class="row">
            <div class="col text-center">
              <Button disabled={createStreamBtnDisabled} variant="primary" size="lg" onClick={handleCreateStreamOnClick}>
                Create stream
              </Button>
              <div>
                {showStreamStatus ? <p>{streamCreationStatus}</p> : null}
              </div>
              <div>
                {showClipLoader ? <ClipLoader loading={true}/>: null}
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  );

  async function handleCreateStreamOnClick() {
    if (videoFilesToStream.current.length !== 0) {
      setcreateStreamBtnDisabled(true);
      setShowClipLoader(true);
      setShowStreamStatus(true);
  
      const videoMediaClipJson = [];
      videoFilesToStream.current.forEach((video) => {
        const jsonData = {
          filename: video.filename,
          from: video.from,
          to: video.to
        }
        videoMediaClipJson.push(jsonData);
      });
  
      const audioMediaClipJson = [];
      audioFilesToStream.current.forEach((audio) => {
        const jsonData = {
          filename: audio.filename,
          from: audio.from,
          to: audio.to
        }
        audioMediaClipJson.push(jsonData);
      });
  
      const createVideoClipsJsonResponse = await Axios.post("http://localhost:3000/createVideoClipsJson", videoMediaClipJson);
      const createAudioClipsJsonResponse = await Axios.post("http://localhost:3000/createAudioClipsJson", audioMediaClipJson);
  
      setStreamCreationStatus("this will take some time.. please wait");
      const createStreamResponse = await Axios.get("http://localhost:3000/createStream");
      setStreamCreationStatus("Create stream status: " + createStreamResponse.data);
  
      if (createStreamResponse.data === "success") {
        setShowStreamStatus(false);
        setcreateStreamBtnDisabled(false);
        setShowClipLoader(false);
        setShowVideoPlayer(true);
      }
    } else {
      alert("Please add some videos to the stream");
    }
  }

  function handleOnClickBack() {
    setShowVideoPlayer(false);
  }
};


export default App;

/**
 * 
 * @returns all the video file names in an array
 */
async function getVideoFilesData() {
  try {
    const response = await Axios.get("http://localhost:3000/getVideoFiles");
    return response;
  } catch (error) {
    console.log("error occured during getVideoFilesData() call from client");
    console.log(error);
  }
}

/**
 * 
 * @returns all the audio file names in an array
 */
async function getAudioFilesData() {
  try {
    const response = await Axios.get("http://localhost:3000/getAudioFiles");
    return response;
  } catch (error) {
    console.log("error occured during getAudioFilesData() call from client");
    console.log(error);
  }
}
