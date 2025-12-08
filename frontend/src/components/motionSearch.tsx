import { useEffect, useRef, useState } from "react";
import { MotionSelectorProps } from "../shared/motion.type";
import "./motionSearch.css";
import useMotion from "../hooks/useMotion";
import useMessage from "../hooks/useMessage";

export default function MotionSearch({
  value: motionName,
  onChange: onMotionNameSelect,
  readOnly = true,
  includesNone = false,
}: MotionSelectorProps) {
  const { setMessage } = useMessage();
  const { motions, editableMotions, presets } = useMotion();
  let motionList = motions;
  if (!includesNone) {
    motionList = motions.filter((m) => m !== "none");
  }
  // Input value displayed in the combobox
  const [inputValue, setInputValue] = useState("");
  // Filtered options derived from inputValue + motionList
  const [filtered, setFiltered] = useState<string[]>([]);
  // Dropdown open/close and keyboard highlight state
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [lockFilter, setLockFilter] = useState(false);
  const [presetFilter, setPresetFilter] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listboxRef = useRef<HTMLUListElement | null>(null);
  const listboxId = "motion-combobox-listbox";

  // Keep input synced to selected motion name when that changes externally
  useEffect(() => {
    setInputValue(motionName);
  }, [motionName]);

  // Recompute filtered options when input or list changes
  useEffect(() => {
    let hits = motionList;
    if (lockFilter) {
      hits = hits.filter((m) => editableMotions.includes(m));
    }
    if (presetFilter) {
      hits = hits.filter((m) => presets.includes(m));
    }
    const q = inputValue.trim().toLowerCase();
    if (q) {
      hits = hits.filter((m) => m.toLowerCase().includes(q));
    }
    setFiltered(hits);
    // Reset highlight to -1 when filtering changes, let keyboard nav set it
    setHighlightedIndex(-1);
  }, [inputValue, lockFilter, presetFilter, motions, editableMotions, presets]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listboxRef.current) {
      const highlightedElement = listboxRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: "nearest",
          behavior: "auto",
        });
      }
    }
  }, [highlightedIndex]);

  // Close on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selectMotion = async (name: string | null) => {
    if (!name) {
      setInputValue("");
      setIsOpen(false);
      setHighlightedIndex(-1);
      onMotionNameSelect("");
      setMessage?.("");
      return;
    }
    setInputValue(name);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onMotionNameSelect(name);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setIsOpen(true);
      // Don't set highlight here, let the next key press handle it
      e.preventDefault();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filtered.length === 0) return;
      setHighlightedIndex((idx) => {
        const newIdx =
          idx === -1 ? 0 : idx >= filtered.length - 1 ? 0 : idx + 1;
        return newIdx;
      });
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filtered.length === 0) return;
      setHighlightedIndex((idx) => {
        const newIdx =
          idx === -1
            ? filtered.length - 1
            : idx <= 0
            ? filtered.length - 1
            : idx - 1;
        return newIdx;
      });
      return;
    }

    if (e.key === "Enter") {
      if (
        isOpen &&
        highlightedIndex >= 0 &&
        highlightedIndex < filtered.length
      ) {
        e.preventDefault();
        selectMotion(filtered[highlightedIndex]);
      } else if (!isOpen && inputValue.trim() !== "") {
        // If closed but typed exact match, try select
        const exact = motionList.find(
          (m) => m.toLowerCase() === inputValue.trim().toLowerCase()
        );
        if (exact) selectMotion(exact);
      }
      return;
    }

    if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
      return;
    }
  };

  return (
    <div ref={containerRef} className="motion-combobox">
      <div className="flex">
        <input
          id="motion-combobox-input"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            highlightedIndex >= 0 && highlightedIndex < filtered.length
              ? `${listboxId}-opt-${highlightedIndex}`
              : undefined
          }
          type="text"
          placeholder="Search or select motion..."
          value={inputValue}
          onChange={onInputChange}
          onKeyDown={onInputKeyDown}
          onFocus={() => setIsOpen(true)}
          style={{
            width: "100%",
            padding: "4px 20px 4px 6px",
            fontSize: "0.85rem",
            lineHeight: 1.2,
          }}
        />
        {!inputValue && !readOnly && (
          <span className="motion-combobox__filters">
            <button
              aria-label="Lock filter"
              onClick={() => setLockFilter((prev) => !prev)}
              type="button"
              className={lockFilter ? "active" : ""}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-unlock-fill"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M12 0a4 4 0 0 1 4 4v2.5h-1V4a3 3 0 1 0-6 0v2h.5A2.5 2.5 0 0 1 12 8.5v5A2.5 2.5 0 0 1 9.5 16h-7A2.5 2.5 0 0 1 0 13.5v-5A2.5 2.5 0 0 1 2.5 6H8V4a4 4 0 0 1 4-4"
                />
              </svg>
            </button>
            <button
              aria-label="Preset filter"
              onClick={() => setPresetFilter((prev) => !prev)}
              type="button"
              className={presetFilter ? "active" : ""}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-file-earmark-check-fill"
                viewBox="0 0 16 16"
              >
                <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1m1.354 4.354-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708.708" />
              </svg>
            </button>
          </span>
        )}
        {inputValue && (
          <button
            aria-label="Clear selection"
            onClick={() => selectMotion(null)}
            className="motion-combobox__clear"
            type="button"
          >
            x
          </button>
        )}
      </div>

      {isOpen && filtered.length > 0 && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          className="motion-combobox__listbox"
        >
          {filtered.map((m, idx) => (
            <li
              id={`${listboxId}-opt-${idx}`}
              key={m}
              role="option"
              aria-selected={idx === highlightedIndex}
              onMouseEnter={() => setHighlightedIndex(idx)}
              onMouseLeave={() => setHighlightedIndex(-1)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectMotion(m)}
              className={`motion-combobox__option${
                idx === highlightedIndex ? " is-active" : ""
              }`}
            >
              {m}{" "}
              {!readOnly && (
                <span className="float-right">
                  {presets.includes(m) && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-file-earmark-check"
                      viewBox="0 0 16 16"
                    >
                      <path d="M10.854 7.854a.5.5 0 0 0-.708-.708L7.5 9.793 6.354 8.646a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0z" />
                      <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2M9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
                    </svg>
                  )}
                  {!editableMotions.includes(m) && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-lock-fill"
                      viewBox="0 0 16 16"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 0a4 4 0 0 1 4 4v2.05a2.5 2.5 0 0 1 2 2.45v5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 13.5v-5a2.5 2.5 0 0 1 2-2.45V4a4 4 0 0 1 4-4m0 1a3 3 0 0 0-3 3v2h6V4a3 3 0 0 0-3-3"
                      />
                    </svg>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {isOpen && filtered.length === 0 && (
        <div
          role="status"
          aria-live="polite"
          className="motion-combobox__status"
        >
          No matches
        </div>
      )}
    </div>
  );
}
