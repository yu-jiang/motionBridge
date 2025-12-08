import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MotionEditorPage from "./pages/motionEditorPage";
import MotionComposerPage from "./pages/motionComposerPage";
import MotionGeneratorPage from "./pages/motionGeneratorPage";
import BezierCurveEditorPage from "./pages/bezierCurveEditorPage";
import HomePage from "./pages/homePage";
import VideoMappingPage from "./pages/videoMappingPage";
import { StatusProvider } from "./hooks/useStatus";
import GestureMappingPage from "./pages/gestureMappingPage";
import HapticsMappingPage from "./pages/hapticsMappingPage";
import { MotionProvider } from "./hooks/useMotion";
import AudioMappingPage from "./pages/audioMappingPage";
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
                <Route path="/haptics" element={<HapticsMappingPage />} />
                <Route path="/video" element={<VideoMappingPage />} />
                <Route path="/audio" element={<AudioMappingPage />} />
                <Route path="/gesture" element={<GestureMappingPage />} />
              </Routes>
            </BrowserRouter>
          </WindowProvider>
        </MotionProvider>
      </StatusProvider>
    </RefreshContext.Provider>
  );
}

export default App;
