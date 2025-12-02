import { useState, useRef, ReactElement } from "react";
import styles from "./video.module.css";
import {
  TimelineProps,
  PlayHeadProps,
  GridMarkersProps,
  SegmentProps,
  VideoEventComponentProps,
} from "../shared/video.track.type";
import type { VideoEvent } from "../shared/video.track.type";

const segmentPosY = 70;
const segmentPadding = 5;
const segmentBorderWidth = 2;
const minEventWidth = 25;
const trackAmount = 3;
const eventHeight = 30;
const eventPadding = 5;
const trackHeight = eventHeight + eventPadding * 2 + 10;
const gridMarkerPadding = 5;
const eventTabSize = 17;

const PlayHead = ({
  editorTimeOffset,
  timelineScale,
  timelineHeight,
}: PlayHeadProps) => (
  <div
    className={styles.playHead}
    style={{
      left: (editorTimeOffset ?? 0) * timelineScale,
      height: timelineHeight,
    }}
  ></div>
);

const GridMarkers = ({
  videoDuration,
  timelineScale,
  timelineHeight,
}: GridMarkersProps) => {
  const gridMarkers: ReactElement[] = [];
  if (videoDuration !== null) {
    let gridMarkerDuration;
    if (timelineScale < 15) {
      gridMarkerDuration = 15;
    } else if (timelineScale < 50) {
      gridMarkerDuration = 5;
    } else {
      gridMarkerDuration = 1;
    }
    for (
      let timeOffset = 0;
      timeOffset < videoDuration;
      timeOffset += gridMarkerDuration
    ) {
      const minutes = Math.floor(timeOffset / 60);
      const seconds = timeOffset % 60;
      gridMarkers.push(
        <div
          key={timeOffset}
          className={styles.gridMarker}
          style={{
            width: timelineScale * gridMarkerDuration - 12,
            height: timelineHeight - gridMarkerPadding * 2,
            padding: gridMarkerPadding,
          }}
        >
          {minutes}:{`${seconds}`.padStart(2, "0")}
        </div>
      );
    }
  }
  return <div>{gridMarkers}</div>;
};

const Segment = ({ segment, timelineScale }: SegmentProps) => {
  const borderStyle = `${segmentBorderWidth}px solid #000000`;
  const segmentStyle: React.CSSProperties = {
    left: segment.timeOffset * timelineScale,
    top: segmentPosY,
    width:
      Math.round(segment.duration * timelineScale) -
      segmentPadding * 2 -
      segmentBorderWidth,
    padding: segmentPadding,
    borderLeft: borderStyle,
    borderRight: borderStyle,
  };
  const { color } = segment;
  if (typeof color !== "undefined") {
    segmentStyle.backgroundColor = color;
  }
  return (
    <div className={styles.segment} style={segmentStyle}>
      {segment.name}
    </div>
  );
};

const VideoEventTab = ({
  videoEvent,
  isSelected,
  setEventTag,
  setTabTag,
  timelineScale,
  firstTrackPosY,
  dragEnabled,
}: VideoEventComponentProps): ReactElement => {
  const eventType = videoEvent.motion;
  const displayName = eventType;
  const width = Math.round((videoEvent.duration ?? 0) * timelineScale);
  const eventTagStyle: React.CSSProperties = {
    left: videoEvent.timeOffset * timelineScale,
    top: firstTrackPosY + trackHeight * (videoEvent.trackIndex ?? 0),
    width: width >= minEventWidth ? width : minEventWidth,
    height: eventHeight,
    padding: eventPadding,
  };
  if (isSelected) {
    eventTagStyle.border = "3px solid white";
    eventTagStyle.color = "white";
  }
  const color = videoEvent.color;
  if (typeof color !== "undefined") {
    eventTagStyle.backgroundColor = color;
  }
  const output = [
    <div
      key="event"
      ref={setEventTag}
      className={styles.videoEvent}
      style={eventTagStyle}
    >
      {displayName}
    </div>,
  ];
  if (dragEnabled) {
    const tabTagStyle: React.CSSProperties = {
      left:
        (eventTagStyle.left as number) +
        (eventTagStyle.width as number) +
        eventPadding * 2 -
        eventTabSize,
      top:
        (eventTagStyle.top as number) +
        (eventTagStyle.height as number) +
        eventPadding * 2 -
        eventTabSize,
      width: eventTabSize,
      height: eventTabSize,
    };
    if (isSelected) {
      tabTagStyle.backgroundColor = "#999999";
    }
    output.push(
      <div
        key="tab"
        ref={setTabTag}
        className={styles.eventTab}
        style={tabTagStyle}
      />
    );
  }
  return <>{output} </>;
};

const assignEventTracks = (
  videoEvents: VideoEvent[],
  timelineScale: number
): void => {
  const sortedEvents = videoEvents
    .slice()
    .sort((event1, event2) => event1.timeOffset - event2.timeOffset);
  let overlappingEvents: VideoEvent[] = [];
  sortedEvents.forEach((event) => {
    overlappingEvents = overlappingEvents.filter((oldEvent) => {
      const width =
        Math.max((oldEvent.duration ?? 0) * timelineScale, minEventWidth) +
        eventPadding * 2;
      const effectiveDuration = width / timelineScale;
      return oldEvent.timeOffset + effectiveDuration >= event.timeOffset;
    });
    let trackIndex = 0;
    while (true) {
      const hasCollision = overlappingEvents.some(
        (overlappingEvent) => (overlappingEvent.trackIndex ?? 0) === trackIndex
      );
      if (!hasCollision) {
        break;
      }
      trackIndex += 1;
    }
    event.trackIndex = trackIndex;
    overlappingEvents.push(event);
  });
};

const Timeline = ({
  videoDuration,
  editorTimeOffset,
  videoEvents,
  setVideoEvents,
  scrollTimeline,
  timelineScale,
  timeOffsetEvent,
  dragEnabled,
  selectedEvent,
  setSelectedEvent,
  segments,
}: TimelineProps) => {
  assignEventTracks(videoEvents, timelineScale);
  const [mouseIsHeld, setMouseIsHeld] = useState(false);
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const timelineTag = useRef<HTMLDivElement | null>(null);
  const videoEventTags = useRef<Map<number, HTMLDivElement> | null>(null);
  const eventTabTags = useRef<Map<number, HTMLDivElement> | null>(null);
  const firstTrackPosY = segmentPosY + (segments.length <= 0 ? 0 : 40);
  const timelineHeight = firstTrackPosY + trackHeight * trackAmount;
  const mountEvent = (tag: HTMLDivElement | null): void => {
    if (tag === null || !scrollTimeline) {
      return;
    }
    const { scrollLeft } = tag;
    const { left, right } = tag.getBoundingClientRect();
    const width = right - left;
    const headX = editorTimeOffset * timelineScale;
    const minX = headX + 150 - width;
    const maxX = headX - 150;
    if (scrollLeft < minX) {
      tag.scrollLeft = minX;
    } else if (scrollLeft > maxX) {
      tag.scrollLeft = maxX;
    }
  };
  const getMouseTimeOffset = (event: React.MouseEvent): number => {
    if (timelineTag.current) {
      const { left } = timelineTag.current.getBoundingClientRect();
      return (event.clientX - left) / timelineScale;
    }
    return 0;
  };
  const mouseDownEvent = (event: React.MouseEvent): void => {
    const { clientX, clientY } = event;
    const isClicked = (boundingRect: DOMRect): boolean =>
      clientX >= boundingRect.left &&
      clientX < boundingRect.right &&
      clientY >= boundingRect.top &&
      clientY < boundingRect.bottom;
    let clickedEvent: VideoEvent | null = null;
    for (let index = 0; index < videoEvents.length; index += 1) {
      const videoEvent = videoEvents[index];
      const eventTag = videoEventTags.current?.get(videoEvent.timeOffset);
      if (typeof eventTag === "undefined") {
        continue;
      }
      const boundingRect = eventTag.getBoundingClientRect();
      if (isClicked(boundingRect)) {
        clickedEvent = videoEvent;
        setDragOffset(clientX - boundingRect.left);
        break;
      }
    }
    setSelectedEvent(clickedEvent);
    if (clickedEvent === null) {
      const timeOffset = getMouseTimeOffset(event);
      timeOffsetEvent(timeOffset);
    }
    setMouseIsHeld(true);
  };
  const mouseMoveEvent = (event: React.MouseEvent): void => {
    if (mouseIsHeld) {
      const timeOffset = getMouseTimeOffset(event);
      if (selectedEvent === null) {
        timeOffsetEvent(timeOffset);
      } else if (dragEnabled) {
        if (dragOffset !== null) {
          selectedEvent.timeOffset = timeOffset - dragOffset / timelineScale;
        }
        setVideoEvents([...videoEvents]);
      }
    }
  };
  const mouseUpEvent = (): void => {
    setMouseIsHeld(false);
  };
  videoEventTags.current = new Map<number, HTMLDivElement>();
  eventTabTags.current = new Map<number, HTMLDivElement>();
  const videoEventComponents = videoEvents.map((videoEvent) => {
    const setEventTag = (tag: HTMLDivElement | null): void => {
      if (tag) {
        videoEventTags.current?.set(videoEvent.timeOffset, tag);
      }
    };
    const setTabTag = (tag: HTMLDivElement | null): void => {
      if (tag) {
        eventTabTags.current?.set(videoEvent.timeOffset, tag);
      }
    };
    return (
      <VideoEventTab
        key={videoEvent.timeOffset}
        videoEvent={videoEvent}
        isSelected={videoEvent === selectedEvent}
        setEventTag={setEventTag}
        setTabTag={setTabTag}
        timelineScale={timelineScale}
        firstTrackPosY={firstTrackPosY}
        dragEnabled={dragEnabled}
      />
    );
  });
  const segmentComponents = segments.map((segment) => (
    <Segment
      key={segment.timeOffset}
      segment={segment}
      timelineScale={timelineScale}
    />
  ));
  return (
    <div
      ref={mountEvent}
      className={styles.timeline}
      style={{ height: timelineHeight }}
      onMouseDown={mouseDownEvent}
      onMouseMove={mouseMoveEvent}
      onMouseUp={mouseUpEvent}
    >
      <div ref={timelineTag}>
        <div>{segmentComponents}</div>
        <div>{videoEventComponents}</div>
        <PlayHead
          editorTimeOffset={editorTimeOffset}
          timelineScale={timelineScale}
          timelineHeight={timelineHeight}
        />
        <GridMarkers
          videoDuration={videoDuration}
          timelineScale={timelineScale}
          timelineHeight={timelineHeight}
        />
      </div>
    </div>
  );
};

export default Timeline;
