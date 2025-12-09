import { useState, useRef, useEffect } from "react";
import styles from "./video.module.css";
import Video from "./video";
import Timeline from "./timeline";
import {
  VideoEvent,
  VideoSegment,
  VideoMapping,
  UpdateVideoHandler,
} from "../shared/video.map.type";
import {
  deleteVideoFile,
  getVideoMapping,
  getVideoFileNames,
  renameVideoFile,
  postVideoMapping,
} from "../services/videoMappingService";
import { useLocation, useNavigate } from "react-router-dom";
import { MotionPayload as MotionType } from "../shared/motion.map.type";
import { getMotionMetadataByName } from "../services/motionEditorService";
import { behaviors } from "../shared/bridge.type";
import useMotion from "../hooks/useMotion";
import MotionSearch from "./motionSearch";
import useMessage from "../hooks/useMessage";

function trimExtension(filename: string) {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return filename; // no extension
  return filename.slice(0, lastDot); // cut off the extension
}

const VideoMappingEditor = ({
  sendMessage,
  setLastEvent,
}: {
  sendMessage: (msg: string) => void; // This sends websocket messages
  setLastEvent?: (motion: string) => void;
}) => {
  const { setMessage } = useMessage();
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const videoFileName = params.get("name") || "";
  const { motions } = useMotion();
  const [videoFileNames, setVideoFileNames] = useState<string[]>([]);
  const [nextMotionType, setNextMotionType] = useState<MotionType>({
    motion: "",
    behavior: "replace",
    scale: 1,
    fallback: 0,
  });

  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [editorTimeOffset, setEditorTimeOffset] = useState<number>(0);
  const [scrollTimeline, setScrollTimeline] = useState<boolean>(true);
  const [videoIsPlaying, setVideoIsPlaying] = useState<boolean>(false);
  const [videoEventsReady, setVideoEventsReady] = useState<boolean>(false);
  const [videoEvents, setVideoEvents] = useState<VideoEvent[]>([]);
  const [segments, setSegments] = useState<VideoSegment[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<VideoEvent | null>(null);
  const [timelineScale, setTimelineScale] = useState<number>(128);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [newVideoName, setNewVideoName] = useState<string>(
    trimExtension(videoFileName)
  );

  const updateVideo = useRef<UpdateVideoHandler | null>(null);
  const videoEventQueue = useRef<VideoEvent[]>([]);

  useEffect(() => {
    setNewVideoName(trimExtension(videoFileName));
    (async () => {
      const fnameRes = await getVideoFileNames();
      if (fnameRes.data) {
        setVideoFileNames(fnameRes.data);
      }
      if (fnameRes.errorMsg) {
        setMessage(fnameRes.errorMsg.error);
      }
      if (videoFileName === "") {
        setMessage("Select a video to get started.");
        return;
      }
      const dataRes = await getVideoMapping(videoFileName);
      if (dataRes.data) {
        setVideoEventsReady(true);
        loadVideoMapping(dataRes.data);
      }
      if (dataRes.errorMsg) {
        setVideoEventsReady(false);
        setMessage(dataRes.errorMsg.error);
      }
    })();
  }, [search]);

  // Assign videoEventSequence when videoIsPlaying changes
  // This sequence is a mutable copy used to play events in order
  useEffect(() => {
    videoEventQueue.current = videoEvents
      .filter((event) => event.timeOffset >= editorTimeOffset)
      .sort((a, b) => a.timeOffset - b.timeOffset);
  }, [videoIsPlaying, videoEventsReady]);

  // Send event signal when reaching the next event in sequence
  useEffect(() => {
    if (videoEventQueue.current.length > 0) {
      if (editorTimeOffset >= videoEventQueue.current[0].timeOffset) {
        const nextMotion = videoEventQueue.current[0];
        sendMessage(JSON.stringify(nextMotion));
        setLastEvent?.(nextMotion.motion);
        videoEventQueue.current.shift();
      }
    }
  }, [editorTimeOffset]);

  const loadVideoMapping = async (data: VideoMapping) => {
    const events = data.videoEvents;
    setVideoEvents(events);
    setSegments(data.segments ?? []);
    setSelectedEvent(null);
  };

  const setUpdateVideo = (
    update: (timeOffset: number, isPlaying: boolean) => void
  ): void => {
    updateVideo.current = update;
  };
  const videoChangeEvent = (timeOffset: number, isPlaying: boolean): void => {
    setEditorTimeOffset(timeOffset);
    setScrollTimeline(true);
    setVideoIsPlaying(isPlaying);
  };
  const setTimeOffset = (timeOffset: number, shouldScroll: boolean): void => {
    if (updateVideo.current !== null) {
      updateVideo.current(timeOffset, videoIsPlaying);
    }
    setEditorTimeOffset(timeOffset);
    setScrollTimeline(shouldScroll);
  };
  const timelineTimeOffsetEvent = (timeOffset: number): void => {
    setTimeOffset(timeOffset, false);
  };
  const addVideoEvent = async () => {
    if (nextMotionType.motion.trim() === "") {
      setMessage("Invalid motion name.");
      return;
    }
    if (nextMotionType.motion === "none") {
      setMessage("Motion name can't be none.");
      return;
    }
    if (!motions.includes(nextMotionType.motion)) {
      setMessage("Invalid motion name.");
      return;
    }
    const res = await getMotionMetadataByName(nextMotionType.motion);
    if (res.errorMsg) {
      setMessage("Invalid motion name.");
    }
    if (res.data) {
      const motionData = res.data;
      const videoEvent: VideoEvent = {
        timeOffset: editorTimeOffset,
        motion: nextMotionType.motion,
        behavior: nextMotionType.behavior,
        scale: nextMotionType.scale,
        fallback: nextMotionType.fallback,
        duration: motionData.duration,
        magnitude: motionData.magnitude,
        color: motionData.color,
      };
      setVideoEvents([...videoEvents, videoEvent]);
      setSelectedEvent(videoEvent);
      setMessage(
        `Added motion event ${motionData.name} at ${editorTimeOffset.toFixed(
          2
        )}s.`
      );
    }
  };
  const deleteSelectedEvent = (): void => {
    if (selectedEvent === null) {
      setMessage("No event selected to delete.");
      return;
    }
    const index = videoEvents.findIndex(
      (event) => event.timeOffset === selectedEvent.timeOffset
    );
    if (index >= 0) {
      const events = videoEvents.slice();
      events.splice(index, 1);
      setVideoEvents(events);
      setSelectedEvent(null);
    }
  };
  const saveVideoEvents = async (): Promise<void> => {
    if (videoFileName === "") {
      setMessage("No video selected.");
      return;
    }
    const data: VideoMapping = {
      videoFileName: videoFileName,
      videoDuration,
      videoEvents: videoEvents,
    };
    if (segments.length > 0) {
      data.segments = segments;
    }
    const res = await postVideoMapping(data);
    if (res.data) {
      setMessage(res.data.message);
    }
    if (res.errorMsg) {
      setMessage(res.errorMsg.error);
    }
    setVideoEventsReady(true);
  };
  const clearTimeline = async (): Promise<void> => {
    if (
      !window.confirm(
        "Are you sure you want to delete all motion events and segments?"
      )
    ) {
      return;
    }
    setVideoEvents([]);
    setSelectedEvent(null);
    setSegments([]);
  };
  const setSelectedEventType = async (eventType: MotionType) => {
    if (selectedEvent === null) return;

    const motionRes = await getMotionMetadataByName(eventType.motion);
    if (motionRes.errorMsg) {
      setMessage(motionRes.errorMsg.error);
      return;
    }
    if (motionRes.data) {
      const videoEvent: VideoEvent = {
        timeOffset: selectedEvent.timeOffset,
        motion: eventType.motion,
        behavior: eventType.behavior,
        scale: eventType.scale,
        fallback: eventType.fallback,
        duration: motionRes.data.duration,
        magnitude: motionRes.data.magnitude,
        color: motionRes.data.color,
      };
      const events = videoEvents.slice();
      const index = events.findIndex(
        (event) => event.timeOffset === selectedEvent.timeOffset
      );
      events[index] = videoEvent;
      setVideoEvents(events);
      setSelectedEvent(videoEvent);
    }
    if (motionRes.errorMsg) {
      setMessage("Invalid motion for the selected event.");
    }
  };
  const startPlayback = (): void => {
    if (updateVideo.current) {
      updateVideo.current(editorTimeOffset, true);
    }
    setVideoIsPlaying(true);
  };
  const stopPlayback = async (): Promise<void> => {
    if (updateVideo.current) {
      updateVideo.current(editorTimeOffset, false);
    }
    setVideoIsPlaying(false);
  };
  const togglePlayback = () => {
    if (videoIsPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };
  const zoomOut = () => {
    if (timelineScale > 4) {
      setTimelineScale(Math.round(timelineScale / 2));
      setScrollTimeline(true);
    }
  };
  const zoomIn = () => {
    if (timelineScale < 512) {
      setTimelineScale(timelineScale * 2);
      setScrollTimeline(true);
    }
  };
  const keyDownEvent = (e: React.KeyboardEvent) => {
    if (document.activeElement?.tagName?.toLowerCase() === "input") {
      return;
    }
    const key = e.key;
    if (key === " ") {
      togglePlayback();
      e.preventDefault();
    } else if (key === "e") {
      addVideoEvent();
    } else if (key === "Backspace") {
      deleteSelectedEvent();
    } else if (key === "-") {
      zoomOut();
    } else if (key === "=" || key === "+") {
      zoomIn();
    } else if (e.ctrlKey && key === "c") {
      selectedEvent &&
        navigator.clipboard.writeText(JSON.stringify(selectedEvent));
      e.preventDefault();
    } else if (e.ctrlKey && key === "v") {
      navigator.clipboard.readText().then((text) => {
        try {
          const event: VideoEvent = JSON.parse(text);
          event.timeOffset = editorTimeOffset;
          setVideoEvents([...videoEvents, event]);
          setSelectedEvent(event);
        } catch (err) {
          setMessage("Clipboard does not contain a valid video event.");
        }
      });
      e.preventDefault();
    } else if (e.ctrlKey && key === "s") {
      saveVideoEvents();
      e.preventDefault();
    } else if (key === "r") {
      setTimeOffset(0, true);
    }
    if (!videoIsPlaying) {
      let nextTimeOffset: number | null = null;
      const timeDelta = 2 / timelineScale;
      if (key === "ArrowLeft") {
        nextTimeOffset = editorTimeOffset - timeDelta;
      } else if (key === "ArrowRight") {
        nextTimeOffset = editorTimeOffset + timeDelta;
      }
      if (nextTimeOffset !== null && updateVideo.current) {
        updateVideo.current(nextTimeOffset, videoIsPlaying);
        setEditorTimeOffset(nextTimeOffset);
        setScrollTimeline(true);
        e.preventDefault();
      }
    }
  };
  const dragEnabledChangeEvent = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDragEnabled(!!event.target.checked);
  };
  const timelineSelectEvent = (videoEvent: VideoEvent | null) => {
    setSelectedEvent(videoEvent);
    setNextMotionType({
      motion: videoEvent?.motion || "",
      behavior: videoEvent?.behavior || "replace",
      scale: videoEvent?.scale || 1,
      fallback: videoEvent?.fallback || 0,
    });
    setScrollTimeline(false);
  };
  const selectVideo = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    if (name === "") {
      navigate("?");
      return;
    }
    const dataRes = await getVideoMapping(name);
    if (dataRes.data) {
      setVideoEventsReady(true);
      loadVideoMapping(dataRes.data);
    }
    if (dataRes.errorMsg) {
      setVideoEventsReady(false);
      setMessage(dataRes.errorMsg.error);
    }
    navigate(`?name=${encodeURIComponent(name)}`);
  };
  const handleFieldChange = (
    field: "motion" | "behavior" | "scale" | "fallback",
    value: string | number
  ) => {
    setNextMotionType({
      ...nextMotionType,
      [field]: value,
    });
    if (selectedEvent !== null) {
      const updatedType = {
        ...nextMotionType,
        [field]: value,
      };
      setSelectedEventType(updatedType);
    }
  };

  const renameVideo = async () => {
    if (newVideoName === "") {
      setMessage("Video name cannot be empty.");
      return;
    }
    if (newVideoName === trimExtension(videoFileName)) {
      setMessage("New video name is the same as the current name.");
      return;
    }
    const res = await renameVideoFile(videoFileName, newVideoName);
    if (res.data) {
      setMessage(res.data.message);
      navigate(`?name=${encodeURIComponent(res.data.message)}`);
      const updatedFileNames = videoFileNames
        .filter((name) => name !== videoFileName)
        .concat([res.data.message])
        .sort();
      setVideoFileNames(updatedFileNames);
    }
    if (res.errorMsg) {
      setMessage(res.errorMsg.error);
    }
  };

  const deleteVideo = async () => {
    if (!window.confirm(`Are you sure you want to delete ${videoFileName}?`)) {
      return;
    }
    const res = await deleteVideoFile(videoFileName);
    if (res.data) {
      setMessage(res.data.message);
      navigate(``);
      const updatedFileNames = videoFileNames.filter(
        (name) => name !== videoFileName
      );
      setVideoFileNames(updatedFileNames);
    }
    if (res.errorMsg) {
      setMessage(res.errorMsg.error);
    }
  };

  return (
    <div className="flex-col" tabIndex={0} onKeyDown={keyDownEvent}>
      <h1>Video Mapping</h1>
      <div className="flex-row">
        <label htmlFor="selectVideo">Select Video: </label>
        <select
          id="selectVideo"
          onChange={selectVideo}
          style={{ marginRight: 10 }}
        >
          <option key={""} value="">
            -- Select video --
          </option>
          {videoFileNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        {videoFileName && (
          <>
            <label htmlFor="newVideoName">Name:</label>
            <input
              id="newVideoName"
              type="text"
              value={newVideoName}
              onChange={(e) => setNewVideoName(e.target.value)}
            />
            <button onClick={renameVideo}>Rename Video</button>
            <button onClick={deleteVideo}>Delete Video</button>
          </>
        )}
      </div>
      <div className={styles.videoContainer}>
        <Video
          videoFileName={videoFileName}
          setVideoDuration={setVideoDuration}
          videoChangeEvent={videoChangeEvent}
          setUpdateVideo={setUpdateVideo}
        />
      </div>
      {videoEventsReady ? (
        <>
          <br style={{ clear: "both" }} />
          <Timeline
            videoDuration={videoDuration}
            editorTimeOffset={editorTimeOffset}
            videoEvents={videoEvents}
            setVideoEvents={setVideoEvents}
            scrollTimeline={scrollTimeline}
            timelineScale={timelineScale}
            timeOffsetEvent={timelineTimeOffsetEvent}
            dragEnabled={dragEnabled}
            selectedEvent={selectedEvent}
            setSelectedEvent={timelineSelectEvent}
            segments={segments}
          />
          <p>
            <button onClick={zoomOut} style={{ marginRight: 10 }}>
              Zoom Out
            </button>
            <button onClick={zoomIn} style={{ marginRight: 15 }}>
              Zoom In
            </button>
            <input
              type="checkbox"
              checked={dragEnabled}
              onChange={dragEnabledChangeEvent}
            />
            <span style={{ verticalAlign: -2, marginLeft: 5 }}>
              Enable Click and Drag
            </span>
          </p>
          {selectedEvent !== null && (
            <>
              <strong>Edit Video Event</strong>
              <div className="flex-row">
                <label>Time: </label>
                <div>{selectedEvent.timeOffset} (s)</div>
                <label>Motion Color: </label>
                <div style={{ color: selectedEvent.color }}>
                  {selectedEvent.color}
                </div>
                <label>Motion Duration: </label>
                <div>{selectedEvent.duration} (s)</div>
              </div>
            </>
          )}
          <div className="flex-row">
            <label htmlFor="motion">Motion:</label>
            <MotionSearch
              value={nextMotionType.motion}
              onChange={(name) => {
                handleFieldChange("motion", name);
              }}
            />
            <label htmlFor="behavior">Behavior:</label>
            <select
              id="behavior"
              onChange={(e) => handleFieldChange("behavior", e.target.value)}
              value={nextMotionType.behavior || ""}
            >
              {behaviors.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <label htmlFor="scale">Scale:</label>
            <input
              id="scale"
              type="number"
              value={nextMotionType.scale}
              onChange={(e) =>
                handleFieldChange("scale", Number(e.target.value))
              }
              min="0"
              max="1"
              step="0.01"
            />
            <label htmlFor="fallback">Fallback #: </label>
            <input
              id="fallback"
              type="number"
              value={nextMotionType.fallback}
              onChange={(e) =>
                handleFieldChange("fallback", Number(e.target.value))
              }
              min="0"
              step="1"
            />
          </div>
          <div className="flex-row" style={{ marginTop: 10, marginBottom: 20 }}>
            {selectedEvent === null && (
              <button onClick={addVideoEvent}>Add Motion Event</button>
            )}
            {selectedEvent !== null && (
              <button onClick={deleteSelectedEvent}>
                Delete Selected Event
              </button>
            )}
            <button onClick={saveVideoEvents}>Save Events</button>
            <button onClick={clearTimeline}>Clear Events</button>
          </div>
        </>
      ) : (
        <>
          <div>Video Mapping has not been created.</div>
          <button onClick={saveVideoEvents}>Add Video Mapping</button>
        </>
      )}
    </div>
  );
};

export default VideoMappingEditor;
