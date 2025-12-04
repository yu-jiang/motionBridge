import { NavLink, useLocation } from "react-router-dom";
import "./navbar.css";
import { useWindow } from "../hooks/useWindow";
import { OutputWindow } from "../pages/outputPage";

export interface InPageNavProps {
  navKeys: string[];
  navIndex: number;
  setNavIndex: (index: number) => void;
}

export interface NavbarProps {
  mapProps?: InPageNavProps;
  gestureProps?: InPageNavProps;
}

export default function NavBar() {
  const { search, pathname } = useLocation();
  const params = new URLSearchParams(search);
  const page = params.get("p") || "";
  const isActive = (key: string, isDefault: boolean = false) => {
    if (page === key) return "nav-link";
    else if (isDefault && page === "") return "nav-link";
    return "nav-link-disabled";
  };
  const { openWindow } = useWindow();
  return (
    <nav className="navbar" style={{ overflowY: "auto" }}>
      <div className="nav-group">
        <div className="nav-group-title-big">Motion Bridge</div>
        <ul className="navbar-links">
          <li>
            <NavLink to="/" end className="nav-link">
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/output" end className="nav-link">
              Output
              <span
                className="float-right"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openWindow(<OutputWindow />);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="bi bi-box-arrow-up-right"
                  viewBox="0 0 16 16"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5"
                  />
                  <path
                    fill-rule="evenodd"
                    d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z"
                  />
                </svg>
              </span>
            </NavLink>
          </li>
        </ul>
        <div className="nav-group-title-big">Input Tracks</div>
        <ul className="navbar-links">
          <li>
            <NavLink to="/haptics" className="nav-link">
              Game
            </NavLink>
          </li>
          <li>
            <NavLink to="/video" className="nav-link">
              Video
            </NavLink>
          </li>
          <li>
            <NavLink to="/audio" className="nav-link">
              Audio
            </NavLink>
          </li>
          <li>
            {pathname === "/gesture" ? (
              <>
                <NavLink
                  to="?p=gesture-track"
                  end
                  className={isActive("gesture-track", true)}
                >
                  Gesture Track
                </NavLink>
                <NavLink
                  to="?p=gesture-input"
                  end
                  className={isActive("gesture-input")}
                >
                  Gesture Input
                </NavLink>
              </>
            ) : (
              <NavLink to="/gesture" end className="nav-link">
                Gesture
              </NavLink>
            )}
          </li>
        </ul>
      </div>

      <div className="nav-group">
        <div className="nav-group-title-big">Motion Editor</div>
        <ul className="navbar-links">
          <li>
            <NavLink to="/edit" className="nav-link">
              Motions
            </NavLink>
          </li>
          <li>
            <NavLink to="/generate" className="nav-link">
              Generate
            </NavLink>
          </li>
          <li>
            <NavLink to="/compose" className="nav-link">
              Compose
            </NavLink>
          </li>
          <li>
            <NavLink to="/bezier" className="nav-link">
              Bezier Curve
            </NavLink>
          </li>
        </ul>
      </div>
      <div className="nav-group bottom">
        <img
          src="MotionBridge.png"
          alt="Motion Bridge Logo"
          style={{ width: "100%", marginTop: "1rem", borderRadius: "8px" }}
          className="bottom"
        />
      </div>
    </nav>
  );
}
