import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MotionEditorPage from "./pages/motionEditorPage";
import MotionComposerPage from "./pages/motionComposerPage";
import MotionGeneratorPage from "./pages/motionGeneratorPage";
import BezierCurveEditorPage from "./pages/bezierCurveEditorPage";
import HomePage from "./pages/homePage";
import VideoTrackPage from "./pages/videoTrackPage";
import { StatusProvider } from "./hooks/useStatus";
import GestureTrackPage from "./pages/gestureTrackPage";
import HapticsTrackPage from "./pages/hapticsTrackPage";
import { MotionProvider } from "./hooks/useMotion";
import AudioTrackPage from "./pages/audioTrackPage";
import OutputPage from "./pages/outputPage";
import { WindowProvider } from "./hooks/useWindow";
import { useState } from "react";
import { RefreshContext } from "./hooks/useRefresh";

function App() {
  const [refresh, setRefresh] = useState(false);
  return (
    <RefreshContext.Provider value={{ refresh, setRefresh }}>
      <StatusProvider>
        <MotionProvider refresh={refresh}>
          <WindowProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/output" element={<OutputPage />} />
                <Route path="/edit" element={<MotionEditorPage />} />
                <Route path="/generate" element={<MotionGeneratorPage />} />
                <Route path="/compose" element={<MotionComposerPage />} />
                <Route path="/bezier" element={<BezierCurveEditorPage />} />
                <Route path="/haptics" element={<HapticsTrackPage />} />
                <Route path="/video" element={<VideoTrackPage />} />
                <Route path="/audio" element={<AudioTrackPage />} />
                <Route path="/gesture" element={<GestureTrackPage />} />
              </Routes>
            </BrowserRouter>
          </WindowProvider>
        </MotionProvider>
      </StatusProvider>
    </RefreshContext.Provider>
  );
}

export default App;
