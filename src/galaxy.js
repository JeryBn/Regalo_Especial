import * as THREE from "three";

// Procedural light, dust lanes and a stellar bulge; no remote image assets.
export function createGalaxy(index, random, makePoints, mobile) {
  const group = new THREE.Group(),
    size = 34 + random() * 24;
  const palettes = [
    ["#fff0d8", "#9cafd0"],
    ["#ffe8c5", "#b9a6bf"],
    ["#fff3e0", "#8ca9ba"],
    ["#fff0db", "#a6a5cb"],
  ];
  const inner = new THREE.Color(palettes[index % 4][0]),
    outer = new THREE.Color(palettes[index % 4][1]);
  const arms = 2 + (index % 2),
    twist = 4.5 + random() * 1.5;
  const image = document.createElement("canvas");
  image.width = 512;
  image.height = 512;
  const ctx = image.getContext("2d"),
    center = 256;
  const halo = ctx.createRadialGradient(center, center, 0, center, center, 250);
  halo.addColorStop(0, "rgba(255,228,189,.75)");
  halo.addColorStop(0.12, "rgba(220,197,170,.3)");
  halo.addColorStop(0.4, "rgba(140,151,185,.07)");
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, 512, 512);
  const color = outer.getStyle();
  for (let i = 0; i < 8500; i++) {
    const r = Math.pow(random(), 0.65) * 238,
      a = ((i % arms) / arms) * Math.PI * 2 + (r / 238) * twist,
      scatter = (random() - 0.5) * (0.25 + (r / 238) * 0.65),
      x = center + Math.cos(a + scatter) * r,
      y = center + Math.sin(a + scatter) * r;
    ctx.globalAlpha = (1 - r / 260) * (0.0015 + random() * 0.004);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 2 + random() * 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Branching dust lanes interrupt the luminous arms instead of forming perfect rings.
  ctx.globalCompositeOperation = "destination-out";
  for (let arm = 0; arm < arms; arm++) {
    ctx.strokeStyle = "rgba(0,0,0,.5)";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    for (let r = 36; r < 238; r += 2) {
      const a =
          (arm / arms) * Math.PI * 2 +
          (r / 238) * twist +
          0.08 +
          Math.sin(r * 0.12) * 0.025,
        x = center + Math.cos(a) * r,
        y = center + Math.sin(a) * r;
      r === 36 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
  const bulge = ctx.createRadialGradient(center, center, 0, center, center, 72);
  bulge.addColorStop(0, "rgba(255,249,229,.95)");
  bulge.addColorStop(0.12, "rgba(255,232,194,.8)");
  bulge.addColorStop(0.4, "rgba(244,210,166,.3)");
  bulge.addColorStop(1, "rgba(230,196,155,0)");
  ctx.fillStyle = bulge;
  ctx.fillRect(175, 175, 162, 162);
  const texture = new THREE.CanvasTexture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  const disk = new THREE.Mesh(
    new THREE.PlaneGeometry(size * 2.3, size * 2.3),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  disk.rotation.x = -Math.PI / 2;
  group.add(disk);
  const positions = [],
    colors = [],
    sizes = [],
    count = mobile ? 4500 : 10500;
  for (let i = 0; i < count; i++) {
    let r, a, y;
    const core = random() < 0.22;
    if (core) {
      r = Math.pow(random(), 1.7) * size * 0.25;
      a = random() * Math.PI * 2;
      y = (random() - 0.5) * size * 0.18 * (1 - r / (size * 0.3));
    } else {
      r = Math.pow(random(), 0.7) * size;
      a =
        ((i % arms) / arms) * Math.PI * 2 +
        (r / size) * twist +
        (random() - 0.5) * (0.25 + (r / size) * 0.7);
      y = (random() - 0.5) * size * 0.045;
    }
    const radialNoise = 1 + (random() - 0.5) * 0.1;
    positions.push(
      Math.cos(a) * r * radialNoise,
      y,
      Math.sin(a) * r * radialNoise,
    );
    const c = inner.clone().lerp(outer, Math.min(1, (r / size) * 1.4)),
      b = 0.25 + random() * 0.4;
    colors.push(c.r * b, c.g * b, c.b * b);
    sizes.push((0.12 + random() * 0.3) * (random() < 0.015 ? 2.5 : 1));
  }
  group.add(makePoints(positions, colors, sizes));
  const haloStars = [],
    haloColors = [],
    haloSizes = [];
  for (let i = 0; i < (mobile ? 300 : 700); i++) {
    const a = random() * Math.PI * 2,
      v = Math.acos(random() * 2 - 1),
      r = size * (0.3 + random() * 0.8);
    haloStars.push(
      Math.sin(v) * Math.cos(a) * r,
      Math.cos(v) * r * 0.4,
      Math.sin(v) * Math.sin(a) * r,
    );
    haloColors.push(0.7, 0.68, 0.62);
    haloSizes.push(0.12 + random() * 0.18);
  }
  group.add(makePoints(haloStars, haloColors, haloSizes));
  group.rotation.set(
    (random() - 0.5) * 2.5,
    random() * 6.28,
    (random() - 0.5) * 2.2,
  );
  return {
    group,
    size,
    speed: (index % 2 ? 1 : -1) * (0.003 + random() * 0.004),
  };
}
