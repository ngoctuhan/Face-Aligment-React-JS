import React, { useRef, useEffect } from "react";
import './App.css';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/face-landmarks-detection';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import { check_angel_face, check_mouth_activate } from "./utils";
function App() {

  // save state/value of element
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);


  const [capturing, setCapturing] = React.useState(false);
  const [recordedChunks, setRecordedChunks] = React.useState([]);
  const mediaRecorderRef = React.useRef(null);

  let count_empty = 0;
  let count_frame = 0;
  let count_cheat = 0;
  let count_over  = 0;
  let status_recording = 0;

  const handleStartCaptureClick = React.useCallback(() => {
    console.log("dang quay lại video");
    setCapturing(true);
    mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
      mimeType: "video/webm"
    });
    mediaRecorderRef.current.addEventListener(
      "dataavailable",
      handleDataAvailable
    );
    mediaRecorderRef.current.start();
  }, [webcamRef, setCapturing, mediaRecorderRef]);

  const handleDataAvailable = React.useCallback(
    ({ data }) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data));
      }
    },
    [setRecordedChunks]
  );

  const handleStopCaptureClick = React.useCallback(() => {
    console.log('đang tắt quay video');
    mediaRecorderRef.current.stop();
    setCapturing(false);
  }, [mediaRecorderRef, webcamRef, setCapturing]);

  const handleDownload = React.useCallback(() => {
    if (recordedChunks.length) {
      const blob = new Blob(recordedChunks, {
        type: "video/webm"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.style = "display: block";
      a.href = url;
      a.download = "react-webcam-stream-capture.webm";
      a.click();
      window.URL.revokeObjectURL(url);
      setRecordedChunks([]);
    }
  }, [recordedChunks]);

  //  Load posenet
  const runFacemesh = async () => {
   
    const net = await facemesh.load(facemesh.SupportedPackages.mediapipeFacemesh);
    setInterval(() => {
      detect(net);
    }, 10);
  };

  const detect = async (net) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      
      // Get Video Properties
      const video = webcamRef.current.video;
     
      count_frame = count_frame + 1;
      // console.log(count_frame);
      if (count_frame % 20 === 0)
      {
        // 1s process 2-3 times
        const face = await net.estimateFaces({input:video});

        if(face.length === 0)
        {
          // Dont have anyone
          
          count_empty = count_empty + 1
          if (count_empty > 7) 
          // keep tracking can not see person after times (7s) must send to sever a warning
          // 
          {
            // send to sever warning. 
            console.log('khong co ai trong dang thi ca');
            count_empty = 0;
            count_over = 0;
            count_cheat = 0;
          }
        }
        else if (face.length === 1)
        {
          // Process image to cal angle 

          let circumstance =  check_angel_face(face);

          let is_opened = check_mouth_activate(face);

          console.log("Góc khuôn mặt là: "+circumstance);
          
          if (circumstance > 0 || is_opened > 0){

            if (count_cheat === 0){
              status_recording = 1;
              handleStartCaptureClick();
            }
            count_cheat = count_cheat + 1;
          }
        }
        else
        {
          // Over person can accept
          count_over =  count_over + 1;

          if (count_over > 3)
          {
            console.log('Có nhiều người trong phòng thi');
            count_over  = 0;
            count_empty = 0;
            count_cheat = 0;
            // send to sever warning 
          }
        }

        if (count_cheat == 0 && status_recording == 1){
          handleStopCaptureClick();
          status_recording = 0;
        }

        if (count_frame > 160)
        {
          if(count_cheat >= 5 ){
            console.log("Gian lận");
            count_over  = 0;
            count_empty = 0;
            count_cheat = 0;
            handleStopCaptureClick();
            status_recording = 0;

          }
          count_frame = 0;
        }
      }
    }
  };

  useEffect(()=>{runFacemesh()}, []);

  return (
    <div className="App">


    {recordedChunks.length > 0 && (
            <button onClick={handleDownload}>Download</button>
          )}
      <header className="App-header">
        <Webcam
          ref={webcamRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />
        
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />

      </header>
    </div>
  );
}

export default App;