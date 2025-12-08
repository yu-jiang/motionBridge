import z from "zod";

export interface VideoEvent {
  timeOffset: number;
  motion: string;
  behavior: string;
  scale: number;
  channel: number;
  duration: number;
  color: string;
  magnitude: number;
  trackIndex?: number;
}

export const videoEventSchema = z.object({
  timeOffset: z.number().nonnegative(),
  motion: z.string().min(1),
  behavior: z.string().min(1),
  scale: z.number().min(0),
  channel: z.number().min(0),
  duration: z.number().min(0),
  color: z.string().regex(/^#([0-9A-Fa-f]{6})$/),
  magnitude: z.number().min(0),
  trackIndex: z.number().min(0).optional(),
});

export interface VideoSegment {
  timeOffset: number;
  duration: number;
  name: string;
  color?: string;
}

export const videoSegmentSchema = z.object({
  timeOffset: z.number().nonnegative(),
  duration: z.number().min(0),
  name: z.string().min(1),
  color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6})$/)
    .optional(),
});

export interface VideoMapping {
  videoFileName: string;
  videoDuration: number | null;
  videoEvents: VideoEvent[];
  segments?: VideoSegment[];
}

export const videoMappingSchema = z.object({
  videoFileName: z.string().min(1),
  videoDuration: z.number(),
  videoEvents: z.array(videoEventSchema),
  segments: z.array(videoSegmentSchema).optional(),
});

export interface EventParamType {
  name: string;
  dataType: string; // "number" | "string" but allowing string for flexibility with JS constants
  displayWidth?: number;
}

// Props interfaces for components
export interface VideoProps {
  videoFileName: string;
  setVideoDuration: (duration: number) => void;
  videoChangeEvent: (timeOffset: number, isPlaying: boolean) => void;
  setUpdateVideo: (
    updateFn: (timeOffset: number, isPlaying: boolean) => void
  ) => void;
}

export interface CarProps {
  editorTimeOffset: number;
  videoEvents: VideoEvent[];
}

export interface TimelineProps {
  videoDuration: number | null;
  editorTimeOffset: number;
  videoEvents: VideoEvent[];
  setVideoEvents: (events: VideoEvent[]) => void;
  scrollTimeline: boolean;
  timelineScale: number;
  timeOffsetEvent: (timeOffset: number) => void;
  dragEnabled: boolean;
  selectedEvent: VideoEvent | null;
  setSelectedEvent: (event: VideoEvent | null) => void;
  segments: VideoSegment[];
}

export interface UpdateVideoHandler {
  (timeOffset: number, isPlaying: boolean): void;
}

export interface VideoEventComponentProps {
  videoEvent: VideoEvent;
  isSelected: boolean;
  setEventTag: (tag: HTMLDivElement | null) => void;
  setTabTag: (tag: HTMLDivElement | null) => void;
  timelineScale: number;
  firstMappingPosY: number;
  dragEnabled: boolean;
}

export interface SegmentProps {
  segment: VideoSegment;
  timelineScale: number;
}

export interface PlayHeadProps {
  editorTimeOffset: number;
  timelineScale: number;
  timelineHeight: number;
}

export interface GridMarkersProps {
  videoDuration: number | null;
  timelineScale: number;
  timelineHeight: number;
}

export interface EventParamProps {
  paramType: EventParamType;
  videoEvent: VideoEvent;
}

export interface YouTubeVideoData {
  videoId: string;
}

export interface YoutubeVideoPayload {
  name: string;
  videoId: string;
}

// YouTube Player API types
export interface YouTubePlayer {
  getCurrentTime(): number;
  getPlayerState(): number;
  getDuration(): number;
  seekTo(seconds: number): void;
  playVideo(): void;
  pauseVideo(): void;
}

export interface YouTubeEvent {
  target: YouTubePlayer;
}
