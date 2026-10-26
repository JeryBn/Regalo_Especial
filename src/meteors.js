import * as THREE from "three";

// Independent stochastic arrivals: no timeline, fixed paths or looping sprites.
export function createMeteors(scene) {
  const events = [],
    rng = Math.random;
  let elapsed = 0;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d"),
    gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.08, "rgba(255,255,255,1)");
  gradient.addColorStop(0.22, "rgba(255,255,255,.3)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const glowMap = new THREE.CanvasTexture(canvas);
  function spawn(camera, contextDistance) {
    const meteor = rng() < 0.2,
      scale = THREE.MathUtils.clamp(contextDistance * 0.4, 18, 1100),
      depth = scale * (1.4 + rng() * 1.5),
      height = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * depth,
      width = height * camera.aspect;
    const forward = camera.getWorldDirection(new THREE.Vector3()),
      right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0),
      up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1),
      angle = rng() * Math.PI * 2;
    const direction = right
      .clone()
      .multiplyScalar(Math.cos(angle))
      .addScaledVector(up, Math.sin(angle))
      .addScaledVector(forward, (rng() - 0.5) * 0.3)
      .normalize();
    const origin = camera.position
      .clone()
      .addScaledVector(forward, depth)
      .addScaledVector(right, (rng() - 0.5) * width * 1.6)
      .addScaledVector(up, (rng() - 0.5) * height * 1.5);
    const group = new THREE.Group();
    scene.add(group);
    const lifetime = meteor ? 4 + rng() * 4 : 1.2 + rng() * 2.1,
      speed = scale * (meteor ? 0.12 + rng() * 0.1 : 0.3 + rng() * 0.4),
      length = scale * (meteor ? 0.35 + rng() * 0.35 : 0.25 + rng() * 0.35),
      radius =
        scale * (meteor ? 0.006 + rng() * 0.005 : 0.0015 + rng() * 0.0018),
      color = new THREE.Color(
        meteor ? "#ff9d51" : rng() > 0.3 ? "#73cfff" : "#d7e6ff",
      );
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowMap,
        color,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow.scale.setScalar(radius * (meteor ? 8 : 9));
    group.add(glow);
    let rock = null;
    if (meteor) {
      const geo = new THREE.IcosahedronGeometry(radius, 2),
        positions = geo.attributes.position,
        colors = [];
      for (let i = 0; i < positions.count; i++) {
        const p = new THREE.Vector3().fromBufferAttribute(positions, i),
          f = 0.77 + rng() * 0.4;
        p.multiplyScalar(f);
        positions.setXYZ(i, p.x, p.y, p.z);
        const b =
          0.2 +
          Math.max(0, p.clone().normalize().dot(direction.clone().negate())) *
            0.65;
        colors.push(b * 0.65, b * 0.3, b * 0.12);
      }
      geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      geo.computeVertexNormals();
      rock = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0,
        }),
      );
      group.add(rock);
    }
    const segments = 28,
      geo = new THREE.BufferGeometry(),
      p = new Float32Array((segments + 1) * 6),
      uv = new Float32Array((segments + 1) * 4),
      indices = [];
    for (let i = 0; i <= segments; i++) {
      uv[i * 4] = 0;
      uv[i * 4 + 1] = i / segments;
      uv[i * 4 + 2] = 1;
      uv[i * 4 + 3] = i / segments;
      if (i < segments) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    geo.setAttribute("position", new THREE.BufferAttribute(p, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    geo.setIndex(indices);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: { color: { value: color }, opacity: { value: 0 } },
      vertexShader:
        "varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader:
        "varying vec2 v;uniform vec3 color;uniform float opacity;void main(){float core=exp(-pow((v.x-.5)*5.,2.));float edge=pow(1.-v.y,1.6);vec3 c=mix(color,vec3(1.),core*pow(1.-v.y,3.)*.75);gl_FragColor=vec4(c,core*edge*opacity);}",
    });
    const tail = new THREE.Mesh(geo, material);
    tail.frustumCulled = false;
    group.add(tail);
    const sparks = [];
    if (meteor) {
      for (let i = 0; i < 7; i++) {
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: glowMap,
            color: "#ffbb77",
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        sprite.scale.setScalar(radius * (0.3 + rng() * 0.9));
        group.add(sprite);
        sparks.push({
          sprite,
          offset: rng(),
          spread: (rng() - 0.5) * radius * 9,
        });
      }
    }
    events.push({
      group,
      origin,
      direction,
      glow,
      rock,
      tail,
      sparks,
      lifetime,
      speed,
      length,
      radius,
      age: 0,
      segments,
      phase: rng() * 6.28,
    });
  }
  function remove(event) {
    scene.remove(event.group);
    event.group.traverse((o) => {
      o.geometry?.dispose();
      o.material?.dispose();
    });
  }
  return {
    update(dt, camera, distance, paused) {
      if (paused) return;
      elapsed += dt;
      // Poisson probability depends on elapsed time, not frame count or fixed intervals.
      if (events.length < 5 && rng() < 1 - Math.exp(-0.38 * dt))
        spawn(camera, distance);
      for (let i = events.length - 1; i >= 0; i--) {
        const e = events[i];
        e.age += dt;
        if (e.age > e.lifetime) {
          remove(e);
          events.splice(i, 1);
          continue;
        }
        const t = e.age / e.lifetime,
          fade =
            THREE.MathUtils.smoothstep(t, 0, 0.12) *
            (1 - THREE.MathUtils.smoothstep(t, 0.65, 1)),
          head = e.origin.clone().addScaledVector(e.direction, e.speed * e.age);
        e.glow.position.copy(head);
        e.glow.material.opacity = fade;
        e.tail.material.uniforms.opacity.value = fade * 0.85;
        if (e.rock) {
          e.rock.position.copy(head);
          e.rock.rotation.x += dt * 0.5;
          e.rock.rotation.z += dt * 0.3;
          e.rock.material.opacity = fade;
        }
        const view = camera.position.clone().sub(head).normalize(),
          side = new THREE.Vector3()
            .crossVectors(e.direction, view)
            .normalize(),
          array = e.tail.geometry.attributes.position.array;
        for (let j = 0; j <= e.segments; j++) {
          const f = j / e.segments,
            width = e.radius * (e.rock ? 2.5 : 1.7) * (1 - f * 0.8),
            center = head
              .clone()
              .addScaledVector(e.direction, -e.length * f)
              .addScaledVector(
                side,
                Math.sin(f * 11 + e.phase + elapsed * 1.2) * e.radius * f * 0.4,
              );
          for (let k = 0; k < 2; k++) {
            const q = center
                .clone()
                .addScaledVector(side, (k ? 1 : -1) * width),
              o = j * 6 + k * 3;
            array[o] = q.x;
            array[o + 1] = q.y;
            array[o + 2] = q.z;
          }
        }
        e.tail.geometry.attributes.position.needsUpdate = true;
        e.sparks.forEach((s) => {
          const f = (s.offset + e.age * 0.4) % 1;
          s.sprite.position
            .copy(head)
            .addScaledVector(e.direction, -e.length * f * 0.7)
            .addScaledVector(side, s.spread * f);
          s.sprite.material.opacity = fade * (1 - f) * 0.8;
        });
      }
    },
    dispose() {
      events.forEach(remove);
      glowMap.dispose();
    },
  };
}
