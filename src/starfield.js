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
      float core = exp(-r * r * 48.0);
      float halo = exp(-r * r * 13.0) * .28;
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
    const bandTilt = new THREE.Euler(0.06, 0.16, -0.68);
    for (let i = 0; i < count; i++) {
      let p;
      if (localField) {
        p = new THREE.Vector3(
          (random() - 0.5) * 12000,
          (random() - 0.5) * 12000,
          (random() - 0.5) * 12000,
        );
      } else if (random() < 0.5) {
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
  // Peripheral blue ribbons are geometry, so their length is not limited by point-size hardware.
  const travelUniforms = {
    flow: { value: 0 },
    strength: { value: 0 },
    aspect: { value: 1 },
    height: { value: 800 },
    lateral: { value: new THREE.Vector2() },
  };
  const ribbonCount = mobile ? 100 : 210;
  const ribbonPositions = [],
    seeds = [],
    corners = [];
  const cornerPattern = [
    [-1, 0],
    [1, 0],
    [-1, 1],
    [1, 0],
    [1, 1],
    [-1, 1],
  ];
  for (let i = 0; i < ribbonCount; i++) {
    const angle = random() * Math.PI * 2,
      phase = random(),
      rate = 0.15 + random() * 0.3,
      brightness = 0.4 + random() * 0.6;
    for (const corner of cornerPattern) {
      ribbonPositions.push(0, 0, 0);
      seeds.push(angle, phase, rate, brightness);
      corners.push(...corner);
    }
  }
  const ribbonGeometry = new THREE.BufferGeometry();
  ribbonGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(ribbonPositions, 3),
  );
  ribbonGeometry.setAttribute(
    "seed",
    new THREE.Float32BufferAttribute(seeds, 4),
  );
  ribbonGeometry.setAttribute(
    "corner",
    new THREE.Float32BufferAttribute(corners, 2),
  );
  const ribbonMaterial = new THREE.ShaderMaterial({
    uniforms: travelUniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec4 seed;attribute vec2 corner;uniform float flow,strength,aspect,height;uniform vec2 lateral;
      varying vec2 vUv;varying float vAlpha;
      void main(){
        float progress=fract(seed.y+flow*seed.z);
        float radius=.26+progress*1.65;
        vec2 radial=vec2(cos(seed.x),sin(seed.x));
        vec2 head=radial*radius;
        vec2 direction=normalize(radial+ lateral*.65);
        float lengthPx=(18.+seed.w*95.)*strength;
        float widthPx=.7+seed.w*.75;
        vec2 side=vec2(-direction.y,direction.x);
        vec2 p=head-direction*(corner.y*lengthPx*2./height)+side*corner.x*widthPx*2./height;
        p.x/=aspect;
        gl_Position=vec4(p,0.,1.);
        vUv=vec2(corner.x,corner.y);
        vAlpha=strength*seed.w*smoothstep(.26,.65,radius)*(1.-smoothstep(1.4,1.9,radius));
      }`,
    fragmentShader: `
      varying vec2 vUv;varying float vAlpha;
      void main(){
        float crossLight=exp(-vUv.x*vUv.x*2.5);
        float tail=pow(1.-vUv.y,1.7);
        vec3 color=mix(vec3(.05,.38,1.),vec3(.65,.91,1.),pow(1.-vUv.y,4.));
        gl_FragColor=vec4(color,crossLight*tail*vAlpha*.85);
      }`,
  });
  const ribbons = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
  ribbons.frustumCulled = false;
  ribbons.renderOrder = 5;
  group.add(ribbons);
  resources.push({ geometry: ribbonGeometry, material: ribbonMaterial });

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

      const speed = uniforms.motion.value.length();
      const targetStrength = paused
        ? 0
        : 1 - Math.exp(-Math.max(0, speed - 35) / 180);
      travelUniforms.strength.value = THREE.MathUtils.lerp(
        travelUniforms.strength.value,
        targetStrength,
        1 -
          Math.exp(
            -Math.min(dt, 0.05) *
              (targetStrength > travelUniforms.strength.value ? 6 : 10),
          ),
      );
      travelUniforms.flow.value += (Math.min(dt, 0.05) * speed) / 1100;
      travelUniforms.aspect.value = camera.aspect;
      travelUniforms.lateral.value
        .set(uniforms.motion.value.x, uniforms.motion.value.y)
        .multiplyScalar(1 / Math.max(80, speed));
      previousPosition.copy(camera.position);

      hasPreviousPosition = true;
      celestial.position.copy(camera.position);
      uniforms.cameraWorld.value.copy(camera.position);
    },
    resize(height, pixelRatio) {
      // Sizes are specified in screen pixels so distant stars remain visible.
      uniforms.pixelRatio.value = Math.min(pixelRatio || 1, 1.7);
      travelUniforms.height.value = height;
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
