const fs = require("node:fs");
const path = require("node:path");

const source = path.join(__dirname, "../branding/ic_launcher.xml");
const targets = [
  "android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml",
  "android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml",
];

for (const target of targets) {
  const dest = path.join(__dirname, "..", target);
  fs.copyFileSync(source, dest);
}
console.log("applied adaptive icon xml");
