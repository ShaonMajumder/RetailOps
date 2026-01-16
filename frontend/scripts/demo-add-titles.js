const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const RECORDINGS_DIR = path.join(__dirname, "..", "recordings");
const INPUT_VIDEO = process.env.DEMO_INPUT_VIDEO;
const MARKERS_PATH = process.env.DEMO_MARKERS_PATH || path.join(RECORDINGS_DIR, "markers.json");
const OUTPUT_VIDEO = process.env.DEMO_OUTPUT_VIDEO;
const FONT_SIZE = Number(process.env.DEMO_TITLE_FONT_SIZE || 36);
const DEFAULT_FONT_PATH = "C:/Windows/Fonts/arial.ttf";
const fontFileEnv = process.env.DEMO_TITLE_FONT_FILE;
const fontFileCandidate = fontFileEnv || DEFAULT_FONT_PATH;
const fontFile = fs.existsSync(fontFileCandidate) ? fontFileCandidate : null;

const getTimestamp = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

const findLatestRecording = () => {
  if (!fs.existsSync(RECORDINGS_DIR)) {
    return "";
  }
  const candidates = fs.readdirSync(RECORDINGS_DIR)
    .filter((entry) => entry.toLowerCase().endsWith(".webm"))
    .map((entry) => ({
      path: path.join(RECORDINGS_DIR, entry),
      mtime: fs.statSync(path.join(RECORDINGS_DIR, entry)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  return candidates[0]?.path || "";
};

let resolvedInput = INPUT_VIDEO || findLatestRecording();

if (!resolvedInput) {
  console.error("Missing input video. Set DEMO_INPUT_VIDEO or ensure a .webm exists in recordings.");
  process.exit(1);
}

const markers = JSON.parse(fs.readFileSync(MARKERS_PATH, "utf8"));
if (!Array.isArray(markers) || markers.length === 0) {
  console.error("Markers file is empty or invalid.");
  process.exit(1);
}

const toSeconds = (ms) => (ms / 1000).toFixed(2);
const segments = markers.map((marker, index) => {
  const start = toSeconds(marker.elapsed_ms);
  const end = index < markers.length - 1 ? toSeconds(markers[index + 1].elapsed_ms) : null;
  return { label: marker.label, start, end };
});

const escapeDrawtextValue = (value) => value.replace(/:/g, "\\:");
const fontFileFilter = fontFile
  ? `:fontfile='${escapeDrawtextValue(fontFile.replace(/\\\\/g, "/"))}'`
  : "";

const drawTextFilters = segments.map((segment) => {
  const enable = segment.end
    ? `between(t,${segment.start},${segment.end})`
    : `gte(t,${segment.start})`;
  const text = escapeDrawtextValue(segment.label);
  return `drawtext=text='${text}'${fontFileFilter}:fontcolor=white:fontsize=${FONT_SIZE}:x=40:y=40:box=1:boxcolor=black@0.45:boxborderw=10:enable='${enable}'`;
});

const filter = drawTextFilters.join(",");

const resolvedOutput = OUTPUT_VIDEO || path.join(RECORDINGS_DIR, `demo-titled-${getTimestamp()}.mp4`);

const args = [
  "-y",
  "-i",
  resolvedInput,
  "-vf",
  filter,
  "-codec:a",
  "copy",
  resolvedOutput,
];

console.log(`Writing titled video to: ${resolvedOutput}`);

const result = spawnSync("ffmpeg", args, { stdio: "inherit" });
if (result.error) {
  console.error("ffmpeg failed to run. Ensure ffmpeg is installed and on PATH.");
  process.exit(1);
}
