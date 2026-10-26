import * as THREE from "three";

// A procedural sky sampled along the world-space view ray. It stays spatially
// continuous when the viewer turns, rather than sliding a flat image on screen.
export function createBackdrop() {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const material = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: {
      farFade: { value: 1 },
      zoom: { value: 1 },
      aspect: { value: 1 },
      drift: { value: new THREE.Vector2() },
      time: { value: 0 },
      cameraBasis: { value: new THREE.Matrix3() },
      tanFov: { value: Math.tan(THREE.MathUtils.degToRad(58 / 2)) },
    },
    vertexShader: `varying vec2 screenUv;
      void main(){screenUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader: `
      uniform float farFade,aspect,time,tanFov;
      uniform mat3 cameraBasis;
      varying vec2 screenUv;
      float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
      float noise(vec3 p){
        vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
                       mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                       mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
      }
      float fbm(vec3 p){float v=0.,a=.57;for(int i=0;i<3;i++){
        v+=noise(p)*a;p=mat3(.8,.0,.6,.2,.943,-.267,-.566,.333,.754)*p*2.07+vec3(7.1,3.8,11.4);a*=.48;
      }return v;}
      void main(){
        vec2 p=(screenUv*2.-1.)*vec2(aspect,1.)*tanFov;
        vec3 ray=normalize(cameraBasis*normalize(vec3(p,-1.)));
        vec3 cloudPoint=ray*3.8+vec3(2.1,time*.0018,6.7);
        float broad=fbm(cloudPoint);
        float fine=fbm(cloudPoint*3.2+broad*2.4);
        float ridge=1.-abs(dot(ray,normalize(vec3(.28,.82,-.49)))+(.48-broad)*.42);
        float band=pow(max(ridge,0.),5.);
        float dust=smoothstep(.22,.7,fine);
        float gas=band*smoothstep(.19,.7,broad)*dust;
        float cluster=pow(max(dot(ray,normalize(vec3(.22,.05,-1.))),0.),14.);
        float counter=pow(max(dot(ray,normalize(vec3(-.8,-.25,.45))),0.),10.);
        float hot=(cluster+counter*.65)*pow(max(broad-.26,0.),1.8)*2.;
        vec3 blue=vec3(.075,.19,.48)*gas*1.3;
        vec3 cyan=vec3(.12,.37,.53)*pow(max(fine-.37,0.),1.2)*band*.6;
        vec3 violet=vec3(.25,.09,.42)*gas*(1.-fine)*.48;
        vec3 gold=vec3(1.,.49,.13)*hot;
        vec3 whiteCore=vec3(1.,.85,.64)*hot*hot*.65;
        // Keep an illuminated, star-friendly base in every direction and scale.
        vec3 base=vec3(.004,.009,.022)+vec3(.008,.014,.028)*broad;
        float focalAngle=max(dot(ray,normalize(vec3(.27,.24,-1.))),0.); float focal=pow(focalAngle,8500.)*1.8+pow(focalAngle,700.)*.22; float filament=noise(cloudPoint*29.)*smoothstep(.48,.74,fine)*band*.045; vec3 color=base+(blue+cyan+violet+gold+whiteCore+vec3(.55,.64,.8)*filament)*(.62+.38*farFade)+vec3(1.,.88,.65)*focal;
        float vignette=1.-.18*length(screenUv-.5);
        gl_FragColor=vec4(color*vignette,1.);
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  return { scene, camera, material };
}

function noiseTexture() {
  const size = 128,
    c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d"),
    im = ctx.createImageData(size, size);
  const hash = (x, y) => {
    const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  const noise = (x, y) => {
    const ix = Math.floor(x),
      iy = Math.floor(y);
    let u = x - ix,
      v = y - iy;
    u = u * u * (3 - 2 * u);
    v = v * v * (3 - 2 * v);
    return (
      (hash(ix, iy) * (1 - u) + hash(ix + 1, iy) * u) * (1 - v) +
      (hash(ix, iy + 1) * (1 - u) + hash(ix + 1, iy + 1) * u) * v
    );
  };
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let n = 0,
        a = 0.5,
        f = 0.04;
      for (let o = 0; o < 5; o++) {
        n += noise(x * f, y * f) * a;
        f *= 2.05;
        a *= 0.5;
      }
      const r = Math.hypot(
          (x - size / 2) / (size / 2),
          (y - size / 2) / (size / 2),
        ),
        i = (y * size + x) * 4;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = 255;
      im.data[i + 3] =
        Math.pow(Math.max(0, 1 - r), 1.8) * Math.pow(n, 1.7) * 170;
    }
  ctx.putImageData(im, 0, 0);
  return new THREE.CanvasTexture(c);
}

export function createNebula(random) {
  const group = new THREE.Group(),
    texture = noiseTexture(),
    materials = [];
  const palette = ["#5c86bf", "#729ebf", "#b79379", "#425ba8", "#af7d51"];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2,
      r = 950 + random() * 800,
      elevation = (random() - 0.5) * 1.65;
    const m = new THREE.SpriteMaterial({
      map: texture,
      color: palette[i % 5],
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      rotation: random() * 6.28,
    });
    const sprite = new THREE.Sprite(m);
    sprite.position.set(
      Math.cos(a) * Math.cos(elevation) * r,
      Math.sin(elevation) * r,
      Math.sin(a) * Math.cos(elevation) * r,
    );
    const size = 500 + random() * 850;
    sprite.scale.set(size, size * (0.65 + random() * 0.55), 1);
    group.add(sprite);
    materials.push(m);
  }
  return {
    group,
    update(fade, dt, paused) {
      materials.forEach((m) => (m.opacity = 0.13 * (0.35 + 0.65 * fade)));
      if (!paused) group.rotation.y += dt * 0.0007;
    },
  };
}

export function createInterior(random) {
  const group = new THREE.Group(),
    materials = [];
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const ctx = c.getContext("2d"),
    g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.04, "rgba(255,255,255,1)");
  g.addColorStop(0.16, "rgba(255,255,255,.18)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  const map = new THREE.CanvasTexture(c);
  for (let layer = 0; layer < 3; layer++) {
    const positions = [],
      colors = [],
      count = [4500, 420, 16][layer];
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2,
        r = 18 + Math.pow(random(), 0.6) * 230,
        y =
          layer === 0
            ? (random() - 0.5) * (15 + r * 0.12)
            : (random() - 0.5) * r;
      positions.push(Math.cos(angle) * r, y, Math.sin(angle) * r);
      const warm = random() > 0.82;
      colors.push(warm ? 0.95 : 0.72, warm ? 0.8 : 0.85, warm ? 0.65 : 1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      map,
      size: [0.12, 0.25, 0.65][layer],
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });
    group.add(new THREE.Points(geo, mat));
    materials.push(mat);
  }
  const dust = noiseTexture();
  for (let i = 0; i < 20; i++) {
    const mat = new THREE.SpriteMaterial({
      map: dust,
      color: i % 5 === 0 ? "#c29a6a" : i % 3 === 0 ? "#7e90b3" : "#7298af",
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      rotation: random() * 6.28,
    });
    const cloud = new THREE.Sprite(mat),
      a = (i / 20) * 6.28;
    cloud.position.set(
      Math.cos(a) * 90,
      (random() - 0.5) * 34,
      Math.sin(a) * 90,
    );
    cloud.scale.set(85, 45, 1);
    group.add(cloud);
    materials.push(mat);
  }
  group.visible = false;
  return {
    group,
    update(fade, dt, paused) {
      group.visible = fade > 0.005;
      materials.forEach(
        (m) => (m.opacity = fade * (m.isSpriteMaterial ? 0.1 : 0.75)),
      );
      if (!paused) group.rotation.y += dt * 0.0008;
    },
  };
}
