from player.motion_player import BEHAVIORS

__all__ = [
    "NAME_REGEX",
    "HAPTICS_REGEX",
    "MAX_MAGNITUDE",
    "DIRECTIONS",
    "MOTION_OPERATIONS",
    "FREQUENCY",
    "forceArraySchema",
    "motionSchema",
    "motionScaleSchema",
    "sineMotionSchema",
    "impulseMotionSchema",
    "rampMotionSchema",
    "minJerkMotionSchema",
    "twinPeakMotionSchema",
    "whiteNoiseMotionSchema",
    "compositeMotionSchema",
    "bakedBezierCurveMotionSchema",
    "bezierCurveMotionSchema",
    "hapticsInputSchema",
    "motionTrackSchema",
    "hapticsTrackSchema",
    "hapticsEntrySchema",
    "gestureTracksSchema",
    "renameSchema",
    "videoEventSchema",
    "videoTrackSchema",
    "youtubeVideoSchema",
    ]

NAME_REGEX = r"^[\w ]{1,100}$"
COLOR_REGEX = r"^#[0-9a-fA-F]{6}$"
HAPTICS_REGEX = r"(\d{3}):(\d{3})"
MAX_MAGNITUDE = 3000
DIRECTIONS = ["heave", "pitch", "roll", "fl", "fr", "rl", "rr", "front", "rear", "left", "right"]
MOTION_OPERATIONS = ["add", "multiply", "concat"]
FREQUENCY = 100
YOUTUBE_REGEX = r"^[\w-]{11}$"

forceArraySchema = {
    "type": "array",
    "items": {
        "type": "array",
        "items": { "type": "number" },
        "minItems": 4,
        "maxItems": 4
    }
}

motionSchema = {
    "type": "object",
    "properties": {
        "name": { "type": "string", "pattern": NAME_REGEX },
        "id": { "type": "string", "pattern": NAME_REGEX },
        "duration": { "type": "number", "minimum": 0 },
        "shortDisplayName": { "type": "string" },
        "longDisplayName": { "type": "string" },
        "color": { "type": "string", "pattern": COLOR_REGEX },
        "magnitude": { "type": "integer", "minimum": 0, "maximum": MAX_MAGNITUDE },
        "flShape": { "type": "array", "items": { "type": "number" } },
        "frShape": { "type": "array", "items": { "type": "number" } },
        "rlShape": { "type": "array", "items": { "type": "number" } },
        "rrShape": { "type": "array", "items": { "type": "number" } },
    },
    "required": ["name", "magnitude", 
                 "flShape", "frShape", "rlShape", "rrShape", 
                 "color", "shortDisplayName", "longDisplayName"],
}

motionScaleSchema = {
    "type": "object",
    "properties": {
        "motion": motionSchema,
        "scale": { "type": "number", "minimum": -2, "maximum": 2 }
    },
    "required": ["motion", "scale"]
}

sineMotionSchema = {
    "type": "object",
    "properties": {
        "name":    { "type": "string", "pattern": NAME_REGEX },
        "parameters": { 
            "type": "object", 
            "properties": {
                "duration" : { "type": "number", "minimum": 0 },
                "magnitude": { "type": "integer", "minimum": 0, "maximum": MAX_MAGNITUDE },
                "frequency": { "type": "number", "minimum": 0 },
                "direction": {
                    "type": "string",
                    "enum": DIRECTIONS
                },
                "phase": { "type": "number" }
            },
            "required": ["duration", "magnitude", "frequency", "direction", "phase"]
        }
    },
    "required": ["name", "parameters"]
}

impulseMotionSchema = {
    "type": "object",
    "properties": {
        "name":    { "type": "string", "pattern": NAME_REGEX },
        "parameters": { 
            "type": "object", 
            "properties": {
                "duration" : { "type": "number", "minimum": 0 },
                "direction": {
                    "type": "string",
                    "enum": DIRECTIONS
                },
            },
            "required": ["duration", "direction"]
        }
    },
    "required": ["name", "parameters"]
}

rampMotionSchema = {
    "type": "object",
    "properties": {
        "name":    { "type": "string", "pattern": NAME_REGEX },
        "parameters": { 
            "type": "object", 
            "properties": {
                "duration" : { "type": "number", "minimum": 0 },
                "magnitude": { "type": "integer", "minimum": 0, "maximum": MAX_MAGNITUDE },
                "direction": {
                    "type": "string",
                    "enum": DIRECTIONS
                },
                "startValue": { "type": "number", "minimum": -1, "maximum": 1},
                "endValue": { "type": "number", "minimum": -1, "maximum": 1},
            },
            "required": ["duration", "magnitude", "direction", "startValue", "endValue"]
        }
    },
    "required": ["name", "parameters"]
}

minJerkMotionSchema = {
    "type": "object",
    "properties": {
        "name":    { "type": "string", "pattern": NAME_REGEX },
        "parameters": { 
            "type": "object", 
            "properties": {
                "duration" : { "type": "number", "minimum": 0 },
                "magnitude": { "type": "integer", "minimum": 0, "maximum": MAX_MAGNITUDE },
                "direction": {
                    "type": "string",
                    "enum": DIRECTIONS
                },
                "startValue": { "type": "number", "minimum": -1, "maximum": 1},
                "endValue": { "type": "number", "minimum": -1, "maximum": 1},
            },
            "required": ["duration", "magnitude", "direction", "startValue", "endValue"]
        }
    },
    "required": ["name", "parameters"]
}

twinPeakMotionSchema =  {
    "type": "object",
    "properties": {
        "name":    { "type": "string", "pattern": NAME_REGEX },
        "parameters": { 
            "type": "object", 
            "properties": {
                "duration" : { "type": "number", "minimum": 0 },
                "magnitude": { "type": "integer", "minimum": 0, "maximum": MAX_MAGNITUDE },
                "direction": {
                    "type": "string",
                    "enum": DIRECTIONS
                },
                "firstPeakTime": { "type": "number", "minimum": 0 },
                "firstPeakValue": { "type": "number", "minimum": -1, "maximum": 1},
                "secondPeakTime": { "type": "number", "minimum": 0 },
                "secondPeakValue": { "type": "number", "minimum": -1, "maximum": 1},
            },
            "required": [
                "duration", "magnitude", "direction",
                "firstPeakTime", "firstPeakValue",
                "secondPeakTime", "secondPeakValue"
            ]
        }
    },
    "required": ["name", "parameters"]
}

whiteNoiseMotionSchema = {
    "type": "object",
    "properties": {
        "name":    { "type": "string", "pattern": NAME_REGEX },
        "parameters": { 
            "type": "object", 
            "properties": {
                "duration" : { "type": "number", "minimum": 0 },
                "magnitude": { "type": "integer", "minimum": 0, "maximum": MAX_MAGNITUDE },
                "direction": {
                    "type": "string",
                    "enum": DIRECTIONS
                },
                "lowCutoff": { "type": "number", "minimum": 0 },
                "highCutoff": { "type": "number", "minimum": 0 },
                "seed": { "type": "integer" }
            },
            "required": [
                "duration", "magnitude", "direction",
                "lowCutoff", "highCutoff", "seed"
            ]
        }
    },
    "required": ["name", "parameters"]
}

compositeMotionSchema = {
    "type": "object",
    "properties": {
        "name":    { "type": "string", "pattern": NAME_REGEX },
        "composition": {
            "type": "object", 
            "properties": {
                "operation": {
                    "type": "string",
                    "enum": MOTION_OPERATIONS
                },
                "motions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "motionRef": { "type": "string" },
                            "startTime": { "type": "number", "minimum": 0 },
                            "magnitudeOverride": { "type": "integer", "minimum": 0, "maximum": MAX_MAGNITUDE },
                        },
                        "required": ["motionRef", "startTime"],
                    }
                }
            }
        }
    },
    "required": ["name", "composition"]
}

bakedBezierCurveMotionSchema = {
    "type": "object",
    "properties": {
        "name":    { "type": "string", "pattern": NAME_REGEX },
        "parameters": { 
            "type": "object", 
            "properties": {
                "data": { "type": "array", "items": { "type": "number" } },
                "duration" : { "type": "number", "minimum": 0 },
                "magnitude": { "type": "integer", "minimum": 0, "maximum": MAX_MAGNITUDE },
                "direction": {
                    "type": "string",
                    "enum": DIRECTIONS
                },
            },
            "required": ["duration", "magnitude", "direction", "data"]
        }
    },
    "required": ["name", "parameters"]
}

bezierCurveMotionSchema = {
    "type": "object",
    "properties": {
        "name":    { "type": "string", "pattern": NAME_REGEX },
        "parameters": { 
            "type": "object", 
            "properties": {
                "anchors": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "x": { "type": "number", "minimum": 0 },
                            "y": { "type": "number", "minimum": -1, "maximum": 1 },
                            "angleIn": { "type": ["number", "null"] },
                            "angleOut": { "type": ["number", "null"] }
                        },
                        "required": ["x", "y", "angleIn", "angleOut"]
                    },
                    "minItems": 1
                },
                "duration" : { "type": "number", "minimum": 0 },
                "magnitude": { "type": "integer", "minimum": 0, "maximum": MAX_MAGNITUDE },
                "direction": {
                    "type": "string",
                    "enum": DIRECTIONS
                },
            },
            "required": ["anchors", "duration", "magnitude", "direction"]
        }
    },
    "required": ["name", "parameters"]
}

hapticsInputSchema = {
    "type": "object",
    "properties": {
        "program": { "type": "string" },
        "largeMotor": { "type": "integer", "minimum": 0, "maximum": 255 },
        "smallMotor": { "type": "integer", "minimum": 0, "maximum": 255 }
    },
    "required": ["program", "largeMotor", "smallMotor"]
}

motionTrackSchema = {
    "type": "object",
    "properties": {
        "motion": { "type": "string", "pattern": NAME_REGEX },
        "behavior": { "type": "string", "enum": BEHAVIORS },
        "scale": { "type": "number", "minimum": 0, "maximum": 1 },
        "channel": { "type": "integer", "minimum": 0 },
    },
    "required": ["motion", "behavior", "scale", "channel"]
}

hapticsTrackSchema = {
    "type": "object",
    "properties": {
        "program": { "type": "string" },
        "hapticsList": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "haptics": { "type": "string", "pattern": HAPTICS_REGEX },
                    "motion": { "type": "string", "pattern": NAME_REGEX },
                    "behavior": { "type": "string", "enum": BEHAVIORS },
                    "scale": { "type": "number", "minimum": 0, "maximum": 1 },
                    "channel": { "type": "integer", "minimum": 0 },
                    "alias": { "type": "string", "pattern": NAME_REGEX }
                },
                "required": ["haptics", "motion", "behavior", "scale", "channel"]
            }
        }
    },
    "required": ["program", "hapticsList"]
}

hapticsEntrySchema = {
    "type": "object",
    "properties": {
        "program": { "type": "string" },
        "haptics": { "type": "string", "pattern": HAPTICS_REGEX },
        "motion": { "type": "string", "pattern": NAME_REGEX },
        "behavior": { "type": "string", "enum": BEHAVIORS },
        "scale": { "type": "number", "minimum": 0, "maximum": 1 },
        "channel": { "type": "integer", "minimum": 0 },
        "alias": { "type": "string", "pattern": NAME_REGEX }
    },
    "required": ["program", "haptics", "motion", "behavior", "scale", "channel"]
}

videoEventSchema = {
    "type": "object",
    "properties": {
        "id": { "type": "integer" },
        "motion": { "type": "string", "pattern": NAME_REGEX },
        "behavior": { "type": "string", "enum": BEHAVIORS },
        "scale": { "type": "number", "minimum": 0, "maximum": 1 },
        "channel": { "type": "integer", "minimum": 0 },
        "timeOffset": { "type": "number", "minimum": 0 },
        "magnitude": { "type": "integer", "minimum": 0, "maximum": MAX_MAGNITUDE },
        "duration": { "type": "number", "minimum": 0 },
        "color": { "type": "string", "pattern": COLOR_REGEX },
        "trackIndex": { "type": "integer", "minimum": 0 },
    },
    "required": ["motion", "behavior", "scale", "channel", "timeOffset", "duration", "magnitude", "color"]
}

videoTrackSchema = {
    "type": "object",
    "properties": {
        "videoFileName": { "type": "string" },
        "videoDuration": { "type": "number", "minimum": 0 },
        "videoEvents": {
            "type": "array",
            "items": videoEventSchema
        }
    },
    "required": ["videoFileName", "videoEvents"],
}

youtubeVideoSchema = {
    "type": "object",
    "properties": {
        "name": { "type": "string", "pattern": NAME_REGEX },
        "videoId": { "type": "string", "pattern": YOUTUBE_REGEX },
    },
}

gestureTrackSchema = {
    "type": "object",
    "properties": {
        "gesture": { "type": "string", "pattern": NAME_REGEX },
        "motion": { "type": "string", "pattern": NAME_REGEX },
        "behavior": { "type": "string", "enum": BEHAVIORS },
        "frames": { "type": "integer", "minimum": 1 },
        "channel": { "type": "integer", "minimum": 0 }
    },
    "required": ["gesture", "motion", "behavior", "frames", "channel"]
}

gestureTracksSchema = {
    "type": "array",
    "items": gestureTrackSchema
}

renameSchema = {
    "type": "object",
    "properties": {
        "oldName": { "type": "string" },
        "newName": { "type": "string", "pattern": NAME_REGEX }
    },
    "required": ["oldName", "newName"]
}
