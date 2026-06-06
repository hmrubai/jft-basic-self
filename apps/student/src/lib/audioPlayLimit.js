import { state, saveState } from "../state/appState";

// Maximum number of times a single stem audio clip may be played in a model test.
export const MODEL_AUDIO_PLAY_LIMIT = 2;

function getCounts() {
  if (!state.audioPlayCounts || typeof state.audioPlayCounts !== "object") {
    state.audioPlayCounts = {};
  }
  return state.audioPlayCounts;
}

function buildAudioKey(el) {
  const qid = el.dataset.qid || "";
  const index = el.dataset.audioIndex || "0";
  const src = el.getAttribute("src") || "";
  return `${qid}::${index}::${src}`;
}

// Attach play-count limiting to every stem audio player inside `root`.
// When `enabled` is false (e.g. daily tests) this is a no-op and players are unrestricted.
export function applyAudioPlayLimit(root, { enabled = true, limit = MODEL_AUDIO_PLAY_LIMIT } = {}) {
  if (!root || !enabled) return;
  const players = root.querySelectorAll(".stem-audio-player");
  const counts = getCounts();

  players.forEach((el) => {
    const key = buildAudioKey(el);
    let used = Number(counts[key] || 0);
    // `counting` is true while a single allowed listen is in progress, so pausing
    // and resuming within the same listen does not consume another play.
    let counting = false;

    const note = document.createElement("div");
    note.className = "audio-limit-note";

    const refresh = () => {
      const remaining = Math.max(0, limit - used);
      // Keep controls usable while an allowed listen is still in progress, even
      // once the final play has been counted.
      if (remaining > 0 || counting) {
        note.textContent = `Plays left: ${remaining} / ${limit}`;
        note.classList.remove("audio-limit-exhausted");
        el.classList.remove("audio-limit-reached");
      } else {
        note.textContent = `Play limit reached (${limit} / ${limit})`;
        note.classList.add("audio-limit-exhausted");
        el.classList.add("audio-limit-reached");
      }
    };

    el.insertAdjacentElement("afterend", note);
    refresh();

    el.addEventListener("play", () => {
      if (counting) return; // resume of an in-progress listen
      if (used >= limit) {
        el.pause();
        el.currentTime = 0;
        refresh();
        return;
      }
      counting = true;
      used += 1;
      counts[key] = used;
      saveState();
      refresh();
    });

    el.addEventListener("ended", () => {
      counting = false;
      refresh();
    });
  });
}
