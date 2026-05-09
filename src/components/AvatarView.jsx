import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import * as Kalidokit from 'kalidokit';

const AvatarView = ({ videoRef }) => {
  const canvasRef = useRef(null);
  const currentVrm = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !videoRef?.current) return;

    // --- 1. Three.js Setup ---
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    const camera = new THREE.PerspectiveCamera(35, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.set(0.0, 1.4, 1.5); // Focus on face
    cameraRef.current = camera;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // --- 2. Load VRM ---
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    loader.load('/models/AliciaSolid.vrm', (gltf) => {
      const vrm = gltf.userData.vrm;
      scene.add(vrm.scene);
      currentVrm.current = vrm;
      
      // Face towards camera
      vrm.scene.rotation.y = Math.PI; 
    });

    // Render Loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      if (currentVrm.current) {
        currentVrm.current.update(clock.getDelta());
      }
      renderer.render(scene, camera);
    };
    animate();

    // --- 3. MediaPipe & Kalidokit Setup ---
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMesh.onResults((results) => {
      if (!currentVrm.current || !results.multiFaceLandmarks[0]) return;
      
      const faceLandmarks = results.multiFaceLandmarks[0];
      const videoElement = videoRef.current;
      
      // Kalidokit Face Solve
      const riggedFace = Kalidokit.Face.solve(faceLandmarks, {
        runtime: "mediapipe",
        video: videoElement
      });

      if (riggedFace) {
        const vrm = currentVrm.current;
        
        // Apply Head Rotation
        const headNode = vrm.humanoid.getNormalizedBoneNode('head');
        if (headNode) {
          // Adjust rotation for mirror/camera
          const yaw = Math.sin(riggedFace.head.degrees.y * Math.PI / 180);
          const pitch = Math.sin(riggedFace.head.degrees.x * Math.PI / 180);
          const roll = Math.sin(riggedFace.head.degrees.z * Math.PI / 180);
          
          headNode.rotation.y = yaw;
          headNode.rotation.x = pitch;
          headNode.rotation.z = -roll; // invert roll
        }

        // Apply Expressions (Blendshapes)
        const expressions = vrm.expressionManager;
        if (expressions) {
          expressions.setValue('blinkLeft', riggedFace.eye.l);
          expressions.setValue('blinkRight', riggedFace.eye.r);
          expressions.setValue('aa', riggedFace.mouth.shape.A);
          expressions.setValue('ih', riggedFace.mouth.shape.I);
          expressions.setValue('ou', riggedFace.mouth.shape.U);
          expressions.setValue('ee', riggedFace.mouth.shape.E);
          expressions.setValue('oh', riggedFace.mouth.shape.O);
        }
      }
    });

    let cameraUtils;
    // We start Camera tracking the video feed
    const startCamera = async () => {
      if (videoRef.current) {
         cameraUtils = new Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current) {
              await faceMesh.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });
        cameraUtils.start();
      }
    };

    // Wait slightly to ensure video is playing
    setTimeout(startCamera, 1000);

    return () => {
      if (cameraUtils) cameraUtils.stop();
      if (faceMesh) faceMesh.close();
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, [videoRef]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full object-cover z-0" 
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default AvatarView;
