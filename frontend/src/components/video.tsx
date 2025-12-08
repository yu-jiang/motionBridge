import LocalVideo from "./localVideo";
import YoutubeVideo from "./youtubeVideo";
import { VideoProps } from "../shared/video.map.type";

const Video = ({
  videoFileName,
  setVideoDuration,
  videoChangeEvent,
  setUpdateVideo,
}: VideoProps) => {
  if (videoFileName.toLowerCase().endsWith(".youtube")) {
    return (
      <YoutubeVideo
        videoFileName={videoFileName}
        setVideoDuration={setVideoDuration}
        videoChangeEvent={videoChangeEvent}
        setUpdateVideo={setUpdateVideo}
      />
    );
  } else {
    return (
      <LocalVideo
        videoFileName={videoFileName}
        setVideoDuration={setVideoDuration}
        videoChangeEvent={videoChangeEvent}
        setUpdateVideo={setUpdateVideo}
      />
    );
  }
};

export default Video;
