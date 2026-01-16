const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const RECORDINGS_DIR = path.join(__dirname, "..", "recordings");

const runScript = (scriptPath) => {
  const result = spawnSync("node", [scriptPath], { stdio: "inherit" });
  return result.status ?? 1;
};

const recordStatus = runScript(path.join(__dirname, "demo-record.js"));

if (recordStatus !== 0) {
  console.warn(`demo-record exited with status ${recordStatus}. Continuing to title overlay if possible.`);
}

const titlesStatus = runScript(path.join(__dirname, "demo-add-titles.js"));

if (titlesStatus !== 0) {
  process.exit(titlesStatus);
}

process.exit(recordStatus);
