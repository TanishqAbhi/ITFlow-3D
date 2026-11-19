import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Torus, OrbitControls } from '@react-three/drei';

function CyberTechCore() {
  const meshRef = useRef();
  const torusRef = useRef();
  const outerTorusRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.3;
      meshRef.current.rotation.y += delta * 0.4;
    }
    if (torusRef.current) {
      torusRef.current.rotation.x -= delta * 0.5;
      torusRef.current.rotation.z += delta * 0.2;
    }
    if (outerTorusRef.current) {
      outerTorusRef.current.rotation.y += delta * 0.3;
      outerTorusRef.current.rotation.x += delta * 0.15;
    }
  });

  return (
    <group>
      {/* Central Pulsing Plasma Core */}
      <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
        <Sphere ref={meshRef} args={[1.2, 64, 64]}>
          <MeshDistortMaterial
            color="#4f46e5"
            attach="material"
            distort={0.4}
            speed={2}
            roughness={0.2}
            metalness={0.8}
          />
        </Sphere>
      </Float>

      {/* Inner Glowing Gyroscopic Ring */}
      <Torus ref={torusRef} args={[2.0, 0.06, 16, 100]}>
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#06b6d4"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.9}
        />
      </Torus>

      {/* Outer Gyroscopic Ring */}
      <Torus ref={outerTorusRef} args={[2.5, 0.04, 16, 100]}>
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.9}
        />
      </Torus>

      {/* Floating Cyber Data Nodes */}
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * 3.2;
        const y = Math.sin(angle) * 1.5;
        const z = Math.sin(angle) * 2;
        return (
          <mesh key={i} position={[x, y, z]}>
            <octahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#38bdf8"
              emissiveIntensity={1}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Starfield() {
  const pointsRef = useRef();

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.03;
    }
  });

  const count = 300;
  const positions = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 25;
      pos[i + 1] = (Math.random() - 0.5) * 25;
      pos[i + 2] = (Math.random() - 0.5) * 25;
    }
    return pos;
  }, []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#60a5fa" transparent opacity={0.6} />
    </points>
  );
}

export default function Hero3DCanvas() {
  const [hasWebGLError, setHasWebGLError] = useState(false);

  if (hasWebGLError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-64 h-64 rounded-full bg-gradient-to-tr from-indigo-600 via-cyan-500 to-purple-600 opacity-75 blur-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        onError={() => setHasWebGLError(true)}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-10, -10, -5]} intensity={1} color="#6366f1" />
        <pointLight position={[0, 5, 0]} intensity={1.2} color="#06b6d4" />

        <CyberTechCore />
        <Starfield />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.8}
          maxPolarAngle={Math.PI / 1.7}
          minPolarAngle={Math.PI / 2.3}
        />
      </Canvas>
    </div>
  );
}
