import wishes from "./wishes.json";
import { createDustWish } from "./dust-wish.js";
import { createStarfield } from "./starfield.js";
import { createMeteors } from "./meteors.js";
import { createBackdrop, createInterior, createNebula } from "./environment.js";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RotateCcw, Orbit } from "lucide-react";
import "./style.css";

function Space({ api, onSelect, onError, onProgress }) {
  const host = useRef(null);
  useEffect(() => {
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      onError(
        "Este navegador no pudo iniciar la vista 3D. Prueba activar la aceleración gráfica o abrir la página en otro navegador.",
      );
      return;
    }
    const mount = host.current;
    mount.appendChild(renderer.domElement);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
    renderer.setClearColor("#02030a");
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(58, 1, 0.03, 18000);
    camera.position.set(0, 180, 3000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.minDistance = 0.3;
    controls.maxDistance = 15000;
    controls.enableZoom = false;
    controls.touches.TWO = null;
    controls.zoomSpeed = 1.1;
    controls.rotateSpeed = 0.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.035;
    controls.enablePan = true;
    let paused = false;
    controls.autoRotate = !paused;
    let seed = 21030;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const vertex = `attribute float pointSize;attribute vec3 tint;varying vec3 vColor;uniform float scale;void main(){vColor=tint;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(pointSize*scale/-mv.z,.35,26.0);gl_Position=projectionMatrix*mv;}`;
    const fragment = `uniform float reveal;varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5)*2.0;if(d>1.0)discard;float glow=exp(-d*d*28.0)+exp(-d*d*7.0)*.07;gl_FragColor=vec4(vColor,glow*.48*reveal);}`;
    const material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: { scale: { value: 800 }, reveal: { value: 1 } },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: false,
    });
    const makePoints = (positions, colors, sizes) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      geo.setAttribute("tint", new THREE.Float32BufferAttribute(colors, 3));
      geo.setAttribute("pointSize", new THREE.Float32BufferAttribute(sizes, 1));
      return new THREE.Points(geo, material);
    };
    const dustWish = createDustWish(scene, () => onProgress("read"));
    const meteors = createMeteors(scene);
    const backdrop = createBackdrop();
    renderer.autoClear = false;
    const interior = createInterior(random);
    scene.add(interior.group);
    const nebula = createNebula(random);
    scene.add(nebula.group);
    let interiorIndex = null;
    const starfield = createStarfield(scene);
    const galaxies = [],
      hits = [];
    const mobile = innerWidth < 650;
    for (let g = 0; g < 21; g++) {
      const galaxy = createGalaxy(g, random, makePoints, mobile),
        { group, size } = galaxy;
      // Rejection sampling maintains actual space between galaxies in all three axes.
      let position;
      for (let attempt = 0; attempt < 200; attempt++) {
        position = new THREE.Vector3(
          (random() - 0.5) * 1650,
          (random() - 0.5) * 1000,
          (random() - 0.5) * 1650,
        );
        if (
          galaxies.every(
            (other) => other.group.position.distanceTo(position) > 250,
          )
        )
          break;
      }
      group.position.copy(position);
      scene.add(group);
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(size, 12, 10),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      hit.position.copy(position);
      hit.userData.index = g;
      scene.add(hit);
      hits.push(hit);
      galaxies.push(galaxy);
    }
    const raycaster = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    let start = null,
      tween = null,
      frame,
      last = performance.now(),
      visible = true;
    let travelIndex = null,
      desiredDistance = 0,
      announce = false,
      hovered = null,
      lastPointer = null;
    function setFlight(position, target) {
      tween = { position, target };
      controls.autoRotate = false;
    }
    function focus(index) {
      const galaxy = galaxies[index];
      travelIndex = index;
      desiredDistance = galaxy.size * 0.45;
      announce = true;
      onSelect(null);
      const target = galaxy.group.position.clone(),
        direction = camera.position.clone().sub(target).normalize();
      setFlight(
        target.clone().add(direction.multiplyScalar(desiredDistance)),
        target,
      );
    }

    function nearestGalaxy() {
      let index = 0,
        distance = Infinity;
      galaxies.forEach((g, i) => {
        const d = camera.position.distanceTo(g.group.position);
        if (d < distance) {
          distance = d;
          index = i;
        }
      });
      return { index, distance, galaxy: galaxies[index] };
    }

    function travelZoom(factor, event) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        event ? ((event.clientX - rect.left) / rect.width) * 2 - 1 : 0,
        event ? (-(event.clientY - rect.top) / rect.height) * 2 + 1 : 0,
      );
      raycaster.setFromCamera(pointer, camera);
      const nearest = nearestGalaxy(),
        base = tween ? tween.position.clone() : camera.position.clone(),
        look = tween ? tween.target.clone() : controls.target.clone();
      let direction = raycaster.ray.direction.clone(),
        distance = nearest.distance;
      if (factor < 1 && nearest.distance > nearest.galaxy.size * 2.5) {
        const hit = raycaster.intersectObjects(hits)[0];
        if (hit) {
          const g = galaxies[hit.object.userData.index];
          direction = g.group.position.clone().sub(base).normalize();
          distance = base.distanceTo(g.group.position);
          travelIndex = hit.object.userData.index;
          announce = true;
        }
      }
      const speed = THREE.MathUtils.clamp(distance * 0.65, 2, 2200),
        movement = direction.multiplyScalar(-Math.log(factor) * speed);
      base.add(movement);
      look.add(movement);
      setFlight(base, look);
    }
    const wheel = (event) => {
      event.preventDefault();
      onProgress(event.deltaY < 0 ? "zoom" : "exit");
      pointGalaxy(event.clientX, event.clientY);
      travelZoom(
        Math.exp(THREE.MathUtils.clamp(event.deltaY, -140, 140) * 0.0017),
        event,
      );
    };
    renderer.domElement.addEventListener("wheel", wheel, { passive: false });
    function select(ev) {
      if (
        !start ||
        Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 6 ||
        (ev.pointerType === "touch" && start.multi)
      )
        return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        (-(ev.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const found = raycaster.intersectObjects(hits)[0];
      if (found) focus(found.object.userData.index);
    }
    const activePointers = new Set();
    const haloCanvas = document.createElement("canvas");
    haloCanvas.width = haloCanvas.height = 64;
    const haloContext = haloCanvas.getContext("2d"),
      haloGradient = haloContext.createRadialGradient(32, 32, 0, 32, 32, 32);
    haloGradient.addColorStop(0, "rgba(215,193,255,.28)");
    haloGradient.addColorStop(0.35, "rgba(174,146,255,.15)");
    haloGradient.addColorStop(1, "rgba(160,120,255,0)");
    haloContext.fillStyle = haloGradient;
    haloContext.fillRect(0, 0, 64, 64);
    const hoverTexture = new THREE.CanvasTexture(haloCanvas);
    galaxies.forEach((g) => {
      const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: hoverTexture,
          color: "#d9c4ff",
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      glow.scale.set(g.size * 3.2, g.size * 3.2, 1);
      g.group.add(glow);
      g.glow = glow;
      g.hover = 0;
    });
    function pointGalaxy(x, y) {
      lastPointer = { x, y };
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((x - rect.left) / rect.width) * 2 - 1,
        (-(y - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(hits)[0];
      hovered = hit ? hit.object.userData.index : null;
      renderer.domElement.style.cursor = hovered === null ? "grab" : "pointer";
    }
    const hoverMove = (ev) => {
      if (
        activePointers.size &&
        start &&
        Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 18
      )
        onProgress("explore");
      if (!activePointers.size) pointGalaxy(ev.clientX, ev.clientY);
    };
    const hoverLeave = () => {
      if (!activePointers.size) {
        hovered = null;
        lastPointer = null;
      }
    };
    renderer.domElement.addEventListener("pointermove", hoverMove);
    renderer.domElement.addEventListener("pointerleave", hoverLeave);
    const down = (ev) => {
      pointGalaxy(ev.clientX, ev.clientY);
      activePointers.add(ev.pointerId);
      if (activePointers.size > 1 && start) start.multi = true;
      else start = { x: ev.clientX, y: ev.clientY, multi: false };
      tween = null;
      controls.autoRotate = false;
    };
    const up = (ev) => {
      select(ev);
      activePointers.delete(ev.pointerId);
    };
    const cancel = (ev) => {
      activePointers.delete(ev.pointerId);
      start = null;
    };
    let pinchDistance = null,
      pinchCenter = null;
    const touchStart = (ev) => {
      if (ev.touches.length === 2) {
        pinchCenter = {
          x: (ev.touches[0].clientX + ev.touches[1].clientX) / 2,
          y: (ev.touches[0].clientY + ev.touches[1].clientY) / 2,
        };
        pinchDistance = Math.hypot(
          ev.touches[0].clientX - ev.touches[1].clientX,
          ev.touches[0].clientY - ev.touches[1].clientY,
        );
      }
    };
    const touchMove = (ev) => {
      if (ev.touches.length === 2 && pinchDistance) {
        ev.preventDefault();
        const d = Math.hypot(
          ev.touches[0].clientX - ev.touches[1].clientX,
          ev.touches[0].clientY - ev.touches[1].clientY,
        );
        const center = {
          x: (ev.touches[0].clientX + ev.touches[1].clientX) / 2,
          y: (ev.touches[0].clientY + ev.touches[1].clientY) / 2,
        };
        if (Math.abs(d - pinchDistance) > 2)
          onProgress(d > pinchDistance ? "zoom" : "exit");
        pointGalaxy(center.x, center.y);
        travelZoom(pinchDistance / Math.max(1, d), {
          clientX: center.x,
          clientY: center.y,
        });
        if (pinchCenter) {
          const scale =
              (nearestGalaxy().distance *
                2 *
                Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) /
              renderer.domElement.clientHeight,
            right = new THREE.Vector3().setFromMatrixColumn(
              camera.matrixWorld,
              0,
            ),
            up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1),
            pan = right
              .multiplyScalar(-(center.x - pinchCenter.x) * scale)
              .add(up.multiplyScalar((center.y - pinchCenter.y) * scale));
          if (tween) {
            tween.position.add(pan);
            tween.target.add(pan);
          }
        }
        pinchCenter = center;
        pinchDistance = d;
      }
    };
    const touchEnd = () => {
      pinchDistance = null;
      pinchCenter = null;
    };
    renderer.domElement.addEventListener("touchstart", touchStart, {
      passive: true,
    });
    renderer.domElement.addEventListener("touchmove", touchMove, {
      passive: false,
    });
    renderer.domElement.addEventListener("touchend", touchEnd);
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("pointercancel", cancel);
    const home = new THREE.Vector3(0, 180, 3000);
    let firstResize = true;
    const resize = () => {
      const w = mount.clientWidth,
        h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      if (firstResize) {
        home.z = Math.max(3000, (2200 / camera.aspect) * 0.85);
        camera.position.copy(home);
        firstResize = false;
      }
      camera.updateProjectionMatrix();
      backdrop.material.uniforms.aspect.value = camera.aspect;
      material.uniforms.scale.value = h * renderer.getPixelRatio() * 0.85;
      starfield.resize(h, renderer.getPixelRatio());
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    const visibility = () => (visible = !document.hidden);
    document.addEventListener("visibilitychange", visibility);
    api.current = {
      focus,
      zoom: (factor) => travelZoom(factor),
      reset: () => {
        travelIndex = null;
        announce = false;
        onSelect(null);
        desiredDistance = home.length();
        setFlight(home.clone(), new THREE.Vector3());
      },
      pause: () => {
        paused = !paused;
        controls.autoRotate = !paused && !tween;
        return paused;
      },
    };
    function animate(now) {
      frame = requestAnimationFrame(animate);
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible) return;
      if (!paused)
        galaxies.forEach((g) => (g.group.rotation.y += delta * g.speed));
      if (tween) {
        const amount = 1 - Math.exp(-delta * 2.4);
        camera.position.lerp(tween.position, amount);
        controls.target.lerp(tween.target, amount);
        if (
          camera.position.distanceTo(tween.position) < 0.025 &&
          controls.target.distanceTo(tween.target) < 0.025
        ) {
          tween = null;
          controls.autoRotate = !paused;
        }
      }
      const farFade = THREE.MathUtils.smoothstep(
        camera.position.length(),
        1600,
        3600,
      );
      backdrop.material.uniforms.farFade.value = farFade;
      backdrop.material.uniforms.zoom.value = 1 + (1 - farFade) * 1.4;
      backdrop.material.uniforms.drift.value.set(
        Math.sin(controls.getAzimuthalAngle()) * 0.06,
        Math.cos(controls.getPolarAngle()) * 0.04,
      );
      backdrop.material.uniforms.time.value = now * 0.001;
      nebula.update(0.15 + farFade * 0.85, delta, paused);
      const reveal = 1 - THREE.MathUtils.smoothstep(farFade, 0.65, 0.98) * 0.25;
      material.uniforms.reveal.value = reveal;
      galaxies.forEach((g, i) => {
        g.hover +=
          ((hovered === i ? 1 : 0) - g.hover) * (1 - Math.exp(-delta * 7));
        g.group.visible = true;
        g.glow.material.opacity = g.hover * 0.85 * reveal;
        g.group.children.forEach((child) => {
          if (child.isMesh && child.material.transparent) {
            const coreDistance = camera.position.distanceTo(g.group.position);
            const inside =
              1 -
              THREE.MathUtils.smoothstep(
                coreDistance,
                g.size * 0.7,
                g.size * 2,
              );
            child.material.opacity =
              (0.55 + g.hover * 0.3) * reveal * (1 - inside * 0.67);
          }
        });
      });
      const nearest = nearestGalaxy();
      if (
        nearest.distance < nearest.galaxy.size * 2.4 &&
        travelIndex !== nearest.index
      ) {
        travelIndex = nearest.index;
        announce = true;
      }
      let interiorFade = 0;
      if (travelIndex !== null) {
        const g = galaxies[travelIndex],
          distance = camera.position.distanceTo(g.group.position);
        interiorFade =
          1 - THREE.MathUtils.smoothstep(distance, g.size * 0.6, g.size * 2.2);
        if (interiorFade > 0.01 && interiorIndex !== travelIndex) {
          interiorIndex = travelIndex;
          interior.group.position.copy(g.group.position);
          interior.group.scale.setScalar(g.size / 42);
          interior.group.quaternion.copy(camera.quaternion);
        }
        if (announce && distance < g.size * 1.3) {
          onSelect(travelIndex);
          announce = false;
        }
      }
      if (
        travelIndex !== null &&
        !tween &&
        camera.position.distanceTo(galaxies[travelIndex].group.position) >
          galaxies[travelIndex].size * 3
      ) {
        travelIndex = null;
        onSelect(null);
      }
      meteors.update(delta, camera, nearest.distance, paused);
      interior.update(interiorFade, delta, paused);
      if (tween) camera.lookAt(controls.target);
      else controls.update(delta);
      camera.updateMatrixWorld();
      starfield.update(delta, camera, paused);
      dustWish.set(
        travelIndex !== null && interiorFade > 0.45 ? travelIndex : null,
        travelIndex !== null ? wishes[travelIndex] : "",
      );
      dustWish.update(delta, camera, renderer.getPixelRatio());
      if (backdrop.material.uniforms.cameraBasis) {
        backdrop.material.uniforms.cameraBasis.value.setFromMatrix4(
          camera.matrixWorld,
        );
        backdrop.material.uniforms.tanFov.value = Math.tan(
          THREE.MathUtils.degToRad(camera.fov * 0.5),
        );
      }
      if (lastPointer && !activePointers.size)
        pointGalaxy(lastPointer.x, lastPointer.y);
      renderer.clear();
      renderer.render(backdrop.scene, backdrop.camera);
      renderer.clearDepth();
      renderer.render(scene, camera);
    }
    frame = requestAnimationFrame(animate);
    const lost = (event) => {
      event.preventDefault();
      onError(
        "Se interrumpió la vista 3D. Recarga la página para volver al universo.",
      );
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      cancelAnimationFrame(frame);
      dustWish.dispose();
      starfield.dispose();
      meteors.dispose();
      observer.disconnect();
      renderer.domElement.removeEventListener("pointermove", hoverMove);
      renderer.domElement.removeEventListener("pointerleave", hoverLeave);
      document.removeEventListener("visibilitychange", visibility);
      controls.dispose();
      renderer.domElement.removeEventListener("touchstart", touchStart);
      renderer.domElement.removeEventListener("touchmove", touchMove);
      renderer.domElement.removeEventListener("touchend", touchEnd);
      renderer.domElement.removeEventListener("wheel", wheel);
      renderer.domElement.removeEventListener("pointerdown", down);
      renderer.domElement.removeEventListener("pointerup", up);
      renderer.domElement.removeEventListener("pointercancel", cancel);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      scene.traverse((obj) => {
        obj.geometry?.dispose();
        if (obj.material && obj.material !== material) {
          obj.material.map?.dispose();
          obj.material.dispose();
        }
      });
      backdrop.material.dispose();
      backdrop.scene.children[0].geometry.dispose();
      material.dispose();
      renderer.dispose();
      mount.replaceChildren();
      api.current = null;
    };
  }, []);
  return (
    <div
      className="space"
      ref={host}
      aria-label="Universo tridimensional con 21 galaxias. Arrastra para girar y acerca con rueda o dos dedos."
    />
  );
}
function App() {
  const api = useRef(null),
    [step, setStep] = useState(() => {
      try {
        return localStorage.getItem("universo21-guide-done") ? 4 : 0;
      } catch {
        return 0;
      }
    }),
    [hintVisible, setHintVisible] = useState(true),
    [selected, setSelected] = useState(null),
    [error, setError] = useState("");
  const onProgress = useCallback((action) => {
    setStep((current) => {
      const next =
        action === "explore" && current === 0
          ? 1
          : action === "zoom" && current <= 1
            ? 2
            : action === "read" && current === 2
              ? 3
              : action === "exit" && current === 3
                ? 4
                : current;
      if (next === 4) {
        try {
          localStorage.setItem("universo21-guide-done", "1");
        } catch {}
      }
      return next;
    });
  }, []);
  useEffect(() => {
    setHintVisible(true);
  }, [step]);
  const hints = [
    [
      "¡Feliz cumpleaños, Stacy!",
      "21 galaxias celebran tus 21. Arrastra con el ratón o un dedo para explorar.",
    ],
    [
      "Elige tu primera galaxia",
      "Apunta a una galaxia y acerca con la rueda. En el celular, separa dos dedos sobre ella.",
    ],
    [
      "Hay una sorpresa dentro",
      "Acércate a una galaxia y detente dentro: el polvo estelar formará tu mensaje.",
    ],
    [
      "Tu siguiente descubrimiento",
      "Para salir, aleja con la rueda o junta dos dedos. Cada galaxia tiene otro mensaje de cumpleaños.",
    ],
  ];
  return (
    <main className="universe">
      <Space
        api={api}
        onSelect={setSelected}
        onError={setError}
        onProgress={onProgress}
      />
      <header>
        <span className="identity">
          <Orbit size={19} />
          UNIVERSO 21
        </span>
        {step < 2 && hintVisible && <h1>Haz Zoom para continuar</h1>}
        <span className="dedication">STACY · 21</span>
      </header>
      {step < 4 && hintVisible && (
        <aside key={step} className="exploration-hint" aria-live="polite">
          <span className="hint-step">{step + 1} / 4</span>
          <strong>{hints[step][0]}</strong>
          <p>{hints[step][1]}</p>
          <button
            aria-label="Ocultar indicación"
            onClick={() => setHintVisible(false)}
          >
            ×
          </button>
        </aside>
      )}
      <span className="galaxy-count">21 GALAXIAS · 21 DESEOS</span>
      <div className="camera-tools">
        <button
          aria-label="Cómo explorar"
          title="Cómo explorar"
          onClick={() => {
            setStep(0);
            setHintVisible(true);
          }}
        >
          ?
        </button>
        <button
          aria-label="Volver a la vista del universo"
          onClick={() => api.current?.reset()}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {selected !== null ? wishes[selected] : ""}
      </p>
      {error && (
        <div className="error" role="alert">
          {error}
          <button onClick={() => location.reload()}>Volver a intentar</button>
        </div>
      )}
    </main>
  );
}
createRoot(document.getElementById("root")).render(<App />);

import { createGalaxy } from "./galaxy.js";
