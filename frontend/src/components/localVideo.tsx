import { useState, useRef, useEffect } from "react";
import { VideoProps } from "../shared/video.map.type";

const LocalVideo = ({
  videoFileName,
  setVideoDuration,
  videoChangeEvent,
  setUpdateVideo,
}: VideoProps) => {
  const [lastTimeOffset, setLastTimeOffset] = useState<number | null>(null);
  const [lastIsPlaying, setLastIsPlaying] = useState(false);
  const videoTag = useRef<HTMLVideoElement | null>(null);
  const mountEvent = (tag: HTMLVideoElement | null): void => {
    videoTag.current = tag;
    if (videoTag.current !== null) {
      const { duration } = videoTag.current;
      if (typeof duration === "number" && !Number.isNaN(duration)) {
        setVideoDuration(duration);
      }
    }
    setUpdateVideo((timeOffset: number, isPlaying: boolean) => {
      if (videoTag.current !== null) {
        videoTag.current.currentTime = timeOffset;
        if (isPlaying && !lastIsPlaying) {
          videoTag.current.play();
        }
        if (!isPlaying && lastIsPlaying) {
          videoTag.current.pause();
        }
        setLastTimeOffset(timeOffset);
        setLastIsPlaying(isPlaying);
      }
    });
  };
  const canPlayEvent = (): void => {
    if (videoTag.current) {
      setVideoDuration(videoTag.current.duration);
    }
  };
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoTag.current === null) {
        return;
      }
      const timeOffset = videoTag.current.currentTime;
      const isPlaying = !videoTag.current.paused;
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
  return (
    <video
      controls
      src={videoFileName ? `/public/videos/${videoFileName}` : "#"}
      height="300"
      ref={mountEvent}
      onCanPlay={canPlayEvent}
    ></video>
  );
};

export default LocalVideo;
