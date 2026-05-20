const fs = require("fs");
const path = require("path");

const source = path.join(__dirname, "..", "public", "_headers");
const target = path.join(__dirname, "..", "build", "_headers");

if (!fs.existsSync(source)) {
    console.log("No public/_headers file found. Skipping.");
    process.exit(0);
}

fs.copyFileSync(source, target);
console.log("Copied public/_headers to build/_headers");
