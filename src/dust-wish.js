import * as THREE from "three";

// Letter silhouettes are sampled into individual stars, never a flat text card.
export function createDustWish(scene) {
  const group = new THREE.Group();
  scene.add(group);
  let points = null,
    id = null,
    rest = 0,
    age = 0,
    formation = 0,
    wasMoving = true,
    anchored = false;
  const previousPosition = new THREE.Vector3(),
    previousRotation = new THREE.Quaternion();
  let first = true;
  const uniforms = {
    formation: { value: 0 },
    time: { value: 0 },
    opacity: { value: 0 },
    ratio: { value: 1 },
  };
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms,
    vertexShader: `attribute vec3 scatter;attribute float seed;uniform float formation,time,ratio;varying float brightness;void main(){vec3 p=mix(scatter,position,formation);float drift=(1.-formation);p+=vec3(sin(time*.3+seed*6.),cos(time*.23+seed*8.),sin(time*.17+seed*9.))*drift*.08;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(1.8+seed*.8)*ratio;brightness=.85+seed*.15;}`,
    fragmentShader: `uniform float opacity;varying float brightness;void main(){float r=length(gl_PointCoord-.5);float light=exp(-r*r*22.);if(light<.01)discard;gl_FragColor=vec4(mix(vec3(.6,.78,1.),vec3(1.,.92,.76),brightness),light*opacity*brightness);}`,
  });
  function clear() {
    if (points) {
      group.remove(points);
      points.geometry.dispose();
      points = null;
    }
  }
  function set(index, text) {
    if (index === id) return;
    id = index;
    clear();
    rest = age = formation = 0;
    wasMoving = true;
    anchored = false;
    if (index === null) {
      uniforms.opacity.value = 0;
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.font = "600 76px Georgia";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const words = text.split(" "),
      lines = [];
    let line = "";
    words.forEach((word) => {
      const next = line ? line + " " + word : word;
      if (ctx.measureText(next).width > 900 && line) {
        lines.push(line);
        line = word;
      } else line = next;
    });
    if (line) lines.push(line);
    lines.forEach((s, i) =>
      ctx.fillText(s, 500, 120 + (i - (lines.length - 1) / 2) * 80),
    );
    const pixels = ctx.getImageData(0, 0, 1000, 240).data,
      positions = [],
      scatter = [],
      seeds = [];
    for (let y = 12; y < 228; y += 2)
      for (let x = 20; x < 980; x += 2) {
        if (pixels[(y * 1000 + x) * 4 + 3] > 100) {
          positions.push(
            (x - 500) / 1000,
            (120 - y) / 1000,
            (Math.random() - 0.5) * 0.002,
          );
          scatter.push(
            (Math.random() - 0.5) * 1.8,
            (Math.random() - 0.5) * 0.9,
            (Math.random() - 0.5) * 0.7,
          );
          seeds.push(Math.random());
        }
      }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute(
      "scatter",
      new THREE.Float32BufferAttribute(scatter, 3),
    );
    geometry.setAttribute("seed", new THREE.Float32BufferAttribute(seeds, 1));
    points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = 100;
    group.add(points);
  }
  return {
    set,
    update(dt, camera, pixelRatio) {
      const translation = first
          ? 0
          : camera.position.distanceTo(previousPosition) / Math.max(dt, 0.001),
        turn = first
          ? 0
          : camera.quaternion.angleTo(previousRotation) / Math.max(dt, 0.001);
      first = false;
      previousPosition.copy(camera.position);
      previousRotation.copy(camera.quaternion);
      uniforms.time.value += dt;
      uniforms.ratio.value = Math.min(pixelRatio, 1.7);
      if (id === null || !points) return;
      const moving = translation > 0.6 || turn > 0.018;
      if (moving) {
        rest = 0;
        age = 0;
        wasMoving = true;
      } else {
        rest += dt;
        if (wasMoving && rest > 0.85) {
          wasMoving = false;
          anchored = false;
        }
        if (!wasMoving) age += dt;
      }
      const target = !wasMoving && age < 14 ? 1 : 0;
      formation +=
        (target - formation) * (1 - Math.exp(-dt * (target ? 3.2 : 3.6)));
      uniforms.formation.value = formation;
      uniforms.opacity.value = formation;
      if (!anchored && target === 1) {
        const distance = 24,
          forward = camera.getWorldDirection(new THREE.Vector3()),
          up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
        group.position
          .copy(camera.position)
          .addScaledVector(forward, distance)
          .addScaledVector(up, -4.5);
        group.quaternion.copy(camera.quaternion);
        const width =
          2 *
          distance *
          Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
          camera.aspect *
          0.78;
        group.scale.setScalar(width);
        anchored = true;
      }
      if (moving && formation < 0.02) anchored = false;
    },
    dispose() {
      clear();
      material.dispose();
      scene.remove(group);
    },
  };
}
