import * as THREE from "three";

/** A bright celestial shell and a separate field with real camera parallax. */
export function createStarfield(scene) {
  const mobile = typeof innerWidth !== "undefined" && innerWidth < 700;
  let seed = 2103017;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const gaussian = () =>
    Math.sqrt(-2 * Math.log(Math.max(random(), 0.00001))) *
    Math.cos(random() * Math.PI * 2);
  const group = new THREE.Group();
  scene.add(group);
  const resources = [];
  const previousPosition = new THREE.Vector3();
  const localVelocity = new THREE.Vector3();
  const inverseCamera = new THREE.Quaternion();
  let hasPreviousPosition = false;
  const uniforms = {
    time: { value: 0 },
    pixelRatio: { value: 1 },
    cameraWorld: { value: new THREE.Vector3() },
    motion: { value: new THREE.Vector3() },
  };

  const vertexShader = `
    attribute float stellarSize;
    attribute float luminosity;
    attribute float phase;
    attribute vec3 tint;
    uniform float time;
    uniform float pixelRatio;
    uniform vec3 cameraWorld;
    uniform float localField;
    uniform vec3 motion;
    varying vec3 vTint;
    varying float vLight;
    varying float vBright;
    varying float vStretch;
    varying vec2 vAxis;
    void main() {
      vec3 p = position;
      float edge = 1.0;
      if (localField > .5) {
        p = mod(p - cameraWorld + 6000.0, 12000.0) - 6000.0 + cameraWorld;
        float d = length(p - cameraWorld);
        edge = smoothstep(12.0, 140.0, d) * (1.0 - smoothstep(4700.0, 6500.0, d));
      }
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      vec4 clip = projectionMatrix * mv;
      float parallaxSize = localField > .5 ? clamp(2200.0 / max(80.0, -mv.z), .65, 3.0) : 1.0;
      vec2 radial = length(clip.xy) > .001 ? normalize(clip.xy) : vec2(1., 0.);
      vec2 screenMotion = motion.xy + radial * motion.z * .22;
      float speed = length(screenMotion);
      vStretch = min(4.0, speed * (localField > .5 ? .016 : .004));
      vAxis = speed > .001 ? screenMotion / speed : vec2(1.0, 0.0);
      gl_PointSize = clamp(stellarSize * pixelRatio * parallaxSize * (1.0 + vStretch), .85 * pixelRatio, 40.0 * pixelRatio);
      gl_Position = clip;
      vTint = tint;
      vLight = luminosity * edge * (.94 + .06 * sin(time * (.3 + fract(phase) * .3) + phase));
      vBright = smoothstep(4.2, 8.0, stellarSize);
    }
  `;
  const fragmentShader = `
    varying vec3 vTint;
    varying float vLight;
    varying float vBright;
    varying float vStretch;
    varying vec2 vAxis;
    void main() {
      vec2 p = gl_PointCoord - .5;
      vec2 perpendicular = vec2(-vAxis.y, vAxis.x);
      vec2 shaped = vec2(dot(p, vAxis), dot(p, perpendicular) * (1.0 + vStretch));
      float r = length(shaped);
      float core = exp(-r * r * 85.0);
      float halo = exp(-r * r * 13.0) * .19;
      float horizontal = exp(-abs(p.y) * 180.0) * pow(max(0.0, 1.0 - abs(p.x) * 2.0), 3.0);
      float vertical = exp(-abs(p.x) * 180.0) * pow(max(0.0, 1.0 - abs(p.y) * 2.0), 3.0);
      float light = core + halo + (horizontal + vertical) * vBright * .27;
      float alpha = light * vLight;
      if (alpha < .004) discard;
      gl_FragColor = vec4(mix(vTint, vec3(1.0), core * .7), alpha);
    }
  `;

  function points(count, localField) {
    const positions = [],
      colors = [],
      sizes = [],
      lights = [],
      phases = [];
    const bandTilt = new THREE.Euler(0.48, 0.16, -0.68);
    for (let i = 0; i < count; i++) {
      let p;
      if (localField) {
        p = new THREE.Vector3(
          (random() - 0.5) * 12000,
          (random() - 0.5) * 12000,
          (random() - 0.5) * 12000,
        );
      } else if (random() < 0.42) {
        const angle = random() * Math.PI * 2;
        // A densely populated, uneven stellar river rather than a regular stripe.
        const width = 0.045 + 0.075 * (0.5 + 0.5 * Math.sin(angle * 3.0));
        p = new THREE.Vector3(
          Math.cos(angle),
          gaussian() * width,
          Math.sin(angle),
        )
          .normalize()
          .multiplyScalar(9500)
          .applyEuler(bandTilt);
      } else {
        const azimuth = random() * Math.PI * 2,
          y = random() * 2 - 1;
        const ring = Math.sqrt(1 - y * y);
        p = new THREE.Vector3(
          Math.cos(azimuth) * ring,
          y,
          Math.sin(azimuth) * ring,
        ).multiplyScalar(9500);
      }
      positions.push(p.x, p.y, p.z);
      const spectrum = random();
      const color =
        spectrum < 0.55
          ? new THREE.Color("#a9d3ff")
          : spectrum > 0.96
            ? new THREE.Color("#ffdfb7")
            : new THREE.Color("#eaf2ff");
      colors.push(color.r, color.g, color.b);
      const rare = random();
      sizes.push(
        rare > 0.994
          ? 8 + random() * 6
          : rare > 0.94
            ? 4 + random() * 2
            : 1.8 + Math.pow(random(), 1.5) * 1.4,
      );
      lights.push(rare > 0.94 ? 0.9 + random() * 0.3 : 0.45 + random() * 0.5);
      phases.push(random() * 100);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("tint", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute(
      "stellarSize",
      new THREE.Float32BufferAttribute(sizes, 1),
    );
    geometry.setAttribute(
      "luminosity",
      new THREE.Float32BufferAttribute(lights, 1),
    );
    geometry.setAttribute("phase", new THREE.Float32BufferAttribute(phases, 1));
    const material = new THREE.ShaderMaterial({
      uniforms: { ...uniforms, localField: { value: localField ? 1 : 0 } },
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const stars = new THREE.Points(geometry, material);
    stars.frustumCulled = false;
    stars.renderOrder = 3;
    resources.push({ geometry, material });
    return stars;
  }

  const celestial = points(mobile ? 15000 : 28000, false);
  const nearby = points(mobile ? 1500 : 3500, true);
  group.add(celestial, nearby);
  return {
    update(dt, camera, paused) {
      if (!paused) uniforms.time.value += Math.min(dt, 0.05);
      if (hasPreviousPosition && dt > 0) {
        localVelocity
          .copy(camera.position)
          .sub(previousPosition)
          .divideScalar(Math.max(dt, 0.001));
        inverseCamera.copy(camera.quaternion).invert();
        localVelocity.applyQuaternion(inverseCamera);
        // Each point derives radial drift for forward travel in its vertex shader.
        if (paused) localVelocity.set(0, 0, 0);
        uniforms.motion.value.lerp(
          localVelocity,
          1 - Math.exp(-Math.min(dt, 0.05) * 8),
        );
      }
      previousPosition.copy(camera.position);
      hasPreviousPosition = true;
      celestial.position.copy(camera.position);
      uniforms.cameraWorld.value.copy(camera.position);
    },
    resize(height, pixelRatio) {
      // Sizes are specified in screen pixels so distant stars remain visible.
      uniforms.pixelRatio.value = Math.min(pixelRatio || 1, 1.7);
    },
    dispose() {
      scene.remove(group);
      resources.forEach(({ geometry, material }) => {
        geometry.dispose();
        material.dispose();
      });
    },
  };
}
