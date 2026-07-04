"use client";

import { useRef, useEffect, useState } from "react";
import * as THREE from "three";

export default function HeroScene3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    const container = containerRef.current;
    const W = container.clientWidth;
    const H = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 200);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir1 = new THREE.DirectionalLight(0x60a5fa, 0.8);
    dir1.position.set(5, 5, 5);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0xa78bfa, 0.4);
    dir2.position.set(-4, 3, -3);
    scene.add(dir2);

    // ── Main shape: low-poly sphere ──
    const sphereGeo = new THREE.IcosahedronGeometry(2, 2);
    const edges = new THREE.EdgesGeometry(sphereGeo);

    // Solid transparent fill
    const fillMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.06,
      metalness: 0.8,
      roughness: 0.2,
      side: THREE.DoubleSide,
    });
    const fill = new THREE.Mesh(sphereGeo, fillMat);
    scene.add(fill);

    // Glowing wireframe edges
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.3 });
    const wireframe = new THREE.LineSegments(edges, edgeMat);
    scene.add(wireframe);

    // ── Floating ring ──
    const ringGeo = new THREE.TorusGeometry(3, 0.018, 16, 200);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.35 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.2;
    scene.add(ring);

    // ── Small orbiting dots ──
    const DOT_COUNT = 80;
    const dotPositions = new Float32Array(DOT_COUNT * 3);
    const dotSpeeds: number[] = [];
    const dotRadii: number[] = [];
    const dotYOffsets: number[] = [];
    for (let i = 0; i < DOT_COUNT; i++) {
      const angle = (i / DOT_COUNT) * Math.PI * 2 + Math.random() * 0.5;
      const r = 3.5 + Math.random() * 2;
      const y = (Math.random() - 0.5) * 3;
      dotPositions[i * 3] = Math.cos(angle) * r;
      dotPositions[i * 3 + 1] = y;
      dotPositions[i * 3 + 2] = Math.sin(angle) * r;
      dotSpeeds.push(0.0003 + Math.random() * 0.001);
      dotRadii.push(r);
      dotYOffsets.push(y);
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute("position", new THREE.BufferAttribute(dotPositions, 3));
    const dotMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.04,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
    });
    const dots = new THREE.Points(dotGeo, dotMat);
    scene.add(dots);

    // ── Animation ──
    let frameId: number;
    let mx = 0, my = 0;
    const onMove = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove);

    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Slow, elegant rotation
      fill.rotation.y = t * 0.1 + mx * 0.2;
      fill.rotation.x = t * 0.06 + my * 0.12;
      wireframe.rotation.copy(fill.rotation);

      ring.rotation.z = t * 0.08;

      // Orbit dots
      const pos = dotGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < DOT_COUNT; i++) {
        const angle = t * dotSpeeds[i] * 60 + (i / DOT_COUNT) * Math.PI * 2;
        pos.array[i * 3] = Math.cos(angle) * dotRadii[i];
        pos.array[i * 3 + 1] = dotYOffsets[i] + Math.sin(t * 0.3 + i) * 0.3;
        pos.array[i * 3 + 2] = Math.sin(angle) * dotRadii[i];
      }
      pos.needsUpdate = true;

      // Gentle camera follow
      camera.position.x += (mx * 0.6 - camera.position.x) * 0.01;
      camera.position.y += (-my * 0.4 - camera.position.y) * 0.01;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [mounted]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.9 }}
    />
  );
}
