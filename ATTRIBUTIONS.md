# Third-Party Notices

MotionBridge is licensed under the MIT License.  
This file documents third-party software components and content used in this project and their respective licenses.  
Full license texts, where applicable, are provided in the `third_party_licenses/` directory.

---

## CC BY 4.0

### BeatNet
- **License:** CC BY 4.0  
- **Authors:** mjhydri, karen-pal, rlleshi  
- **Source:** https://github.com/mjhydri/BeatNet  
- **Required Attribution:** BeatNet by mjhydri, karen-pal, rlleshi is licensed under CC BY 4.0.  
- **Modifications:** None (used as-is as a dependency)

---

## Apache License 2.0

### Mediapipe
- **License:** Apache License 2.0  
- **Copyright:** 2023 Mediapipe team  
- **Source:** https://github.com/google-ai-edge/mediapipe  
- **Modifications:** None  
- **NOTICE Requirement:** If redistributed as part of a binary package, the Mediapipe NOTICE file must be preserved.

### OpenCV (opencv-python-headless)
- **License:** Apache License 2.0 (with additional compatible components)  
- **Source:** https://github.com/opencv/opencv-python  
- **Modifications:** None

### aiohttp
- **License:** Apache License 2.0 (and/or Apache-style license)  
- **Source:** https://github.com/aio-libs/aiohttp  
- **Modifications:** None

### TypeScript
- **License:** Apache License 2.0  
- **Source:** https://github.com/microsoft/TypeScript  
- **Modifications:** None

### web-vitals
- **License:** Apache License 2.0  
- **Source:** https://github.com/GoogleChrome/web-vitals  
- **Modifications:** None

> **Apache NOTICE:** Where applicable, third-party components under the Apache License 2.0 are used in unmodified form. If this project is redistributed in binary form, any NOTICE files accompanying those components should be included in the distribution, along with the corresponding license texts located in `third_party_licenses/`.

---

## BSD 3-Clause

### NumPy
- **License:** BSD 3-Clause  
- **Source:** https://github.com/numpy/numpy  
- **Modifications:** None

### SciPy
- **License:** BSD 3-Clause  
- **Source:** https://github.com/scipy/scipy  
- **Modifications:** None

### websockets
- **License:** BSD 3-Clause  
- **Source:** https://github.com/python-websockets/websockets  
- **Modifications:** None

### madmom
- **License:** BSD 3-Clause  
- **Source:** https://github.com/CPJKU/madmom  
- **Modifications:** None

### ViGEmBus
- **License:** BSD 3-Clause  
- **Author:** Nefarius Software Solutions e.U.  
- **Source:** https://github.com/nefarius/ViGEmBus  
- **Modifications:** None

---

## MIT / ISC and Similar Permissive Licenses

### PyAudio
- **License:** MIT  
- **Source:** https://people.csail.mit.edu/hubert/pyaudio/ or PyPI  
- **Modifications:** None

### librosa
- **License:** ISC  
- **Source:** https://github.com/librosa/librosa  
- **Modifications:** None

### quart
- **License:** MIT  
- **Source:** https://github.com/pallets/quart  
- **Modifications:** None

### pyserial
- **License:** BSD-style (3-Clause equivalent)  
- **Source:** https://github.com/pyserial/pyserial  
- **Modifications:** None

### websocket-client
- **License:** LGPL-2.1-or-later (used as a dynamically-linked Python dependency)  
- **Source:** https://github.com/websocket-client/websocket-client  
- **Modifications:** None

### JavaScript libraries (React ecosystem and tooling)
Representative list; all used as dependencies, unmodified, under MIT or similar permissive licenses unless otherwise noted:

- React, ReactDOM, React Router DOM, React Scripts, React Draggable, React YouTube  
- Axios, Concurrently, Chart.js, svg.js, Zod  
- Testing libraries (`@testing-library/*`, `@types/*`)  
- web-vitals (Apache-2.0)  

Refer to each package's NPM page or upstream repository for the authoritative license text. Core representative license texts are mirrored in `third_party_licenses/`.

---

## Embedded or Bundled Assets

As of this review, no project files contain direct inlined third-party source code copied from external repositories. Third-party components are consumed through package managers (PyPI, NPM) or external drivers (for example, ViGEmBus) and are documented above.

If any future files embed inlined third-party code or assets, they should include an inline comment at the top of the file with:
- The original project name  
- License  
- Author(s)  
- Source URL  
- Description of modifications (if any)