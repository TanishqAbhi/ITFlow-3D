import React, { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Center, Float } from '@react-three/drei';
import { RotateCw, ZoomIn, ZoomOut, Maximize2, RefreshCw, Eye } from 'lucide-react';

// Procedural 3D Tech Device Model (Used when GLB is not uploaded or loading)
function ProceduralLaptopModel({ wireframe }) {
  const group = useRef();

  useFrame((state, delta) => {
    // Subtle breathing float animation
  });

  return (
    <group ref={group} dispose={null} scale={[1.2, 1.2, 1.2]} position={[0, -0.4, 0]}>
      {/* Laptop Base / Chassis */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.8, 0.08, 1.9]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.9}
          roughness={0.2}
          wireframe={wireframe}
        />
      </mesh>

      {/* Keyboard Bed */}
      <mesh position={[0, 0.05, 0.2]}>
        <boxGeometry args={[2.5, 0.02, 1.1]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.6}
          roughness={0.4}
          wireframe={wireframe}
        />
      </mesh>

      {/* Glowing Keyboard RGB Backlight */}
      <mesh position={[0, 0.065, 0.2]}>
        <planeGeometry args={[2.4, 1.0]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#06b6d4"
          emissiveIntensity={0.5}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      </mesh>

      {/* Trackpad */}
      <mesh position={[0, 0.05, -0.55]}>
        <boxGeometry args={[1.0, 0.015, 0.6]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.8}
          roughness={0.1}
          wireframe={wireframe}
        />
      </mesh>

      {/* Screen Hinge & Display Panel (Opened at 115 degrees) */}
      <group position={[0, 0.05, 0.95]} rotation={[-1.15, 0, 0]}>
        {/* Screen Lid Back Cover */}
        <mesh position={[0, 0.95, 0]}>
          <boxGeometry args={[2.8, 1.9, 0.06]} />
          <meshStandardMaterial
            color="#090d16"
            metalness={0.95}
            roughness={0.15}
            wireframe={wireframe}
          />
        </mesh>

        {/* Illuminated Screen Glass with Holographic ITFlow Brand */}
        <mesh position={[0, 0.95, 0.035]}>
          <planeGeometry args={[2.65, 1.75]} />
          <meshStandardMaterial
            color="#6366f1"
            emissive="#4338ca"
            emissiveIntensity={0.6}
            roughness={0.1}
            wireframe={wireframe}
          />
        </mesh>

        {/* Screen Content Glow Element */}
        <mesh position={[0, 0.95, 0.036]}>
          <planeGeometry args={[1.8, 1.0]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#06b6d4"
            emissiveIntensity={0.8}
            wireframe={wireframe}
          />
        </mesh>
      </group>
    </group>
  );
}

// GLB External Model Loader
function ExternalModel({ url, wireframe }) {
  const { scene } = useGLTF(url);

  React.useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material.wireframe = wireframe;
      }
    });
  }, [scene, wireframe]);

  return (
    <Center>
      <primitive object={scene} scale={[1.8, 1.8, 1.8]} />
    </Center>
  );
}

function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-white backdrop-blur-md">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-2" />
        <span className="text-xs font-mono text-cyan-300">Rendering 3D Engine...</span>
      </div>
    </Html>
  );
}

export default function ProductViewer3D({ modelUrl, fallbackImage }) {
  const controlsRef = useRef();
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleZoomIn = () => {
    if (controlsRef.current) {
      controlsRef.current.dollyIn(1.2);
      controlsRef.current.update();
    }
  };

  const handleZoomOut = () => {
    if (controlsRef.current) {
      controlsRef.current.dollyOut(1.2);
      controlsRef.current.update();
    }
  };

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  if (hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/80 rounded-2xl border border-slate-800 p-6">
        <img
          src={fallbackImage || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80'}
          alt="Product Showcase"
          className="max-h-72 object-contain rounded-xl shadow-2xl"
        />
        <p className="mt-4 text-xs font-mono text-slate-400">High-Definition 2D Showcase Mode</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#060913] via-[#090e1a] to-[#04060c] border border-slate-800/80 shadow-2xl group">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 1.2, 3.8], fov: 45 }}
        onError={() => setHasError(true)}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1.8} color="#ffffff" />
        <pointLight position={[-5, -2, -5]} intensity={1.2} color="#6366f1" />
        <pointLight position={[5, 3, -2]} intensity={1.0} color="#06b6d4" />
        <spotLight position={[0, 8, 0]} intensity={2.0} angle={0.6} penumbra={0.8} />

        <Suspense fallback={<Loader />}>
          {modelUrl && (modelUrl.endsWith('.glb') || modelUrl.endsWith('.gltf')) ? (
            <ExternalModel url={modelUrl} wireframe={wireframe} />
          ) : (
            <ProceduralLaptopModel wireframe={wireframe} />
          )}
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          autoRotate={autoRotate}
          autoRotateSpeed={1.2}
          minDistance={1.8}
          maxDistance={6.0}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 6}
        />
      </Canvas>

      {/* Cyber Floating Overlay Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-xl opacity-90 hover:opacity-100 transition-opacity">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          title="Toggle 360 Auto-Rotation"
          className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
            autoRotate ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
          <span className="font-mono text-[11px]">360°</span>
        </button>

        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setWireframe(!wireframe)}
          title="Toggle Wireframe Architecture"
          className={`p-2 rounded-lg transition-all ${
            wireframe ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleResetCamera}
          title="Reset Camera View"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top Banner Tag */}
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/70 backdrop-blur-md border border-cyan-500/30">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span className="text-[11px] font-mono font-medium text-cyan-300 uppercase tracking-wider">
          Interactive 3D WebGL
        </span>
      </div>
    </div>
  );
}
