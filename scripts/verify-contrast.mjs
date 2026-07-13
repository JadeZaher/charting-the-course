import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");

const pairs = [
  ["foreground", "background"],
  ["card-foreground", "card"],
  ["popover-foreground", "popover"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["muted-foreground", "background"],
  ["muted-foreground", "muted"],
  ["accent-foreground", "accent"],
  ["link", "background"],
  ["link", "card"],
  ["success-foreground", "success"],
  ["warning-foreground", "warning"],
  ["destructive-foreground", "destructive"],
  ["info-foreground", "info"],
  ["sidebar-foreground", "sidebar"],
  ["sidebar-primary-foreground", "sidebar-primary"],
  ["sidebar-accent-foreground", "sidebar-accent"],
];

function variablesFor(selector) {
  const opening = css.indexOf(`${selector} {`);
  if (opening === -1) throw new Error(`Missing ${selector} token block`);

  const bodyStart = css.indexOf("{", opening) + 1;
  const bodyEnd = css.indexOf("}", bodyStart);
  const variables = new Map();

  for (const match of css.slice(bodyStart, bodyEnd).matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    variables.set(match[1], match[2].trim());
  }

  return variables;
}

function hslToRgb(value) {
  const [hue, saturation, lightness] = value.match(/[\d.]+/g).map(Number);
  const h = ((hue % 360) + 360) % 360;
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const segment = h / 60;
  const x = chroma * (1 - Math.abs((segment % 2) - 1));
  const offset = l - chroma / 2;
  const channels =
    segment < 1 ? [chroma, x, 0]
      : segment < 2 ? [x, chroma, 0]
        : segment < 3 ? [0, chroma, x]
          : segment < 4 ? [0, x, chroma]
            : segment < 5 ? [x, 0, chroma]
              : [chroma, 0, x];

  return channels.map((channel) => channel + offset);
}

function luminance(value) {
  return hslToRgb(value)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrast(first, second) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

const failures = [];
const results = [];

for (const [mode, selector] of [["light", ":root"], ["dark", ".dark"]]) {
  const variables = variablesFor(selector);

  for (const [foreground, background] of pairs) {
    const foregroundValue = variables.get(foreground);
    const backgroundValue = variables.get(background);
    if (!foregroundValue || !backgroundValue) {
      failures.push(`${mode}: missing --${foreground} or --${background}`);
      continue;
    }

    const ratio = contrast(foregroundValue, backgroundValue);
    const result = { mode, pair: `${foreground} / ${background}`, ratio: ratio.toFixed(2) };
    results.push(result);
    if (ratio < 4.5) failures.push(`${mode}: ${result.pair} is ${result.ratio}:1`);
  }
}

console.table(results);

if (failures.length > 0) {
  console.error(`Contrast audit failed (minimum 4.5:1):\n${failures.join("\n")}`);
  process.exitCode = 1;
} else {
  const minimum = Math.min(...results.map(({ ratio }) => Number(ratio)));
  console.log(`Contrast audit passed: ${results.length} semantic pairs, minimum ${minimum.toFixed(2)}:1.`);
}
