import { useState, useRef, useEffect } from "react";
import YouTube from "react-youtube";
import {
  VideoProps,
  YouTubeVideoData,
  YouTubePlayer,
  YouTubeEvent,
} from "../shared/video.map.type";

const YoutubeVideo = ({
  videoFileName,
  setVideoDuration,
  videoChangeEvent,
  setUpdateVideo,
}: VideoProps) => {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [lastTimeOffset, setLastTimeOffset] = useState<number | null>(null);
  const [lastIsPlaying, setLastIsPlaying] = useState(false);
  const youtubeApi = useRef<YouTubePlayer | null>(null);
  useEffect(() => {
    if (videoId !== null) {
      return;
    }
    (async () => {
      const fileData: YouTubeVideoData = await (
        await fetch(`/public/videos/${videoFileName}`)
      ).json();
      setVideoId(fileData.videoId);
    })();
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      const api = youtubeApi.current;
      if (api === null) {
        return;
      }
      const timeOffset = api.getCurrentTime();
      const isPlaying = api.getPlayerState() === 1;
      if (
        (lastTimeOffset !== null &&
          Math.abs(timeOffset - lastTimeOffset) > 0.01) ||
        isPlaying !== lastIsPlaying
      ) {
        setLastTimeOffset(timeOffset);
        setLastIsPlaying(isPlaying);
        videoChangeEvent(timeOffset, isPlaying);
      }
    }, 20);
    return () => {
      clearInterval(interval);
    };
  }, [lastTimeOffset, lastIsPlaying]);
  const handleReady = (event: YouTubeEvent): void => {
    const api = event.target;
    youtubeApi.current = api;
    setVideoDuration(api.getDuration());
    setUpdateVideo((timeOffset: number, isPlaying: boolean) => {
      api.seekTo(timeOffset);
      if (isPlaying) {
        api.playVideo();
      } else {
        api.pauseVideo();
      }
    });
  };
  if (videoId === null) {
    return <p>Loading...</p>;
  } else {
    return <YouTube videoId={videoId} onReady={handleReady} />;
  }
};

export default YoutubeVideo;
