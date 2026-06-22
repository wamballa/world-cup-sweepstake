"use client";

import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
import {
  CuboidCollider,
  Physics,
  RigidBody,
  type RapierRigidBody,
} from "@react-three/rapier";
import { useRef } from "react";
import * as THREE from "three";

export function ThreeLeaderKeepyUppyScene({
  onFloor,
  onKeepUp,
}: {
  onFloor: () => void;
  onKeepUp: () => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0.45, 5], fov: 38 }}
      className="pointer-events-none absolute inset-0"
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
        preserveDrawingBuffer: true,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
    >
      <ambientLight intensity={1.4} />
      <directionalLight intensity={2.3} position={[2.5, 3, 4]} />
      <pointLight intensity={1.2} position={[-2, 1.5, 2]} />
      <Physics gravity={[0, -9.2, 0]} timeStep="vary">
        <KeepyUppyBall onFloor={onFloor} onKeepUp={onKeepUp} />
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[2.15, 0.08, 1.2]} position={[0, -1.25, 0]} />
          <CuboidCollider args={[0.08, 1.9, 1.2]} position={[-2.15, 0.45, 0]} />
          <CuboidCollider args={[0.08, 1.9, 1.2]} position={[2.15, 0.45, 0]} />
          <CuboidCollider args={[2.15, 1.9, 0.08]} position={[0, 0.45, -1.1]} />
          <CuboidCollider args={[2.15, 1.9, 0.08]} position={[0, 0.45, 1.1]} />
        </RigidBody>
      </Physics>
    </Canvas>
  );
}

function KeepyUppyBall({
  onFloor,
  onKeepUp,
}: {
  onFloor: () => void;
  onKeepUp: () => void;
}) {
  const ballRef = useRef<RapierRigidBody>(null);
  const lastValidHitAt = useRef(0);
  const wasOnFloor = useRef(false);

  useFrame(() => {
    const ball = ballRef.current;

    if (!ball) {
      return;
    }

    const position = ball.translation();
    const isOnFloor = position.y <= -0.78;

    if (position.y < -1.15) {
      ball.setTranslation({ x: 0, y: -0.55, z: 0 }, true);
      ball.setLinvel({ x: 0, y: 0, z: 0 }, true);
      ball.setAngvel({ x: 0, y: 0, z: 0 }, true);
      onFloor();
      wasOnFloor.current = true;
      return;
    }

    if (isOnFloor && !wasOnFloor.current) {
      onFloor();
    }

    wasOnFloor.current = isOnFloor;
  });

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();

    const ball = ballRef.current;
    const now = performance.now();

    if (!ball || now - lastValidHitAt.current < 180) {
      return;
    }

    const center = ball.translation();

    if (center.y <= -0.82) {
      return;
    }

    const hitOffset = new THREE.Vector3(
      event.point.x - center.x,
      event.point.y - center.y,
      event.point.z - center.z,
    );
    const lowerHalfLift = hitOffset.y < 0 ? 3.25 : 1.9;
    const sidewaysChaos = (Math.random() - 0.5) * 0.18;
    const upwardChaos = Math.random() * 0.28;
    const impulse = {
      x: -hitOffset.x * 2.35 + sidewaysChaos,
      y: lowerHalfLift + Math.min(Math.abs(hitOffset.y), 0.45) * 1.4 + upwardChaos,
      z: -hitOffset.z * 0.8,
    };
    const torque = {
      x: hitOffset.z * 2.8 + (Math.random() - 0.5) * 0.35,
      y: -hitOffset.x * 1.8,
      z: hitOffset.x * 4.2,
    };

    ball.applyImpulse(impulse, true);
    ball.applyTorqueImpulse(torque, true);
    lastValidHitAt.current = now;
    wasOnFloor.current = false;
    onKeepUp();
  }

  return (
    <RigidBody
      ref={ballRef}
      angularDamping={0.35}
      colliders="ball"
      linearDamping={0.12}
      position={[0, 0.35, 0]}
      restitution={0.78}
    >
      <mesh castShadow onPointerDown={handlePointerDown}>
        <sphereGeometry args={[0.42, 48, 48]} />
        <meshStandardMaterial
          color="#fff6d6"
          metalness={0.05}
          roughness={0.38}
        />
        <mesh>
          <sphereGeometry args={[0.424, 24, 12]} />
          <meshBasicMaterial color="#4d147d" wireframe transparent opacity={0.22} />
        </mesh>
      </mesh>
    </RigidBody>
  );
}
