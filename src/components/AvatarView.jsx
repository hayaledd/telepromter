import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import * as faceMeshPkg from '@mediapipe/face_mesh';
import * as cameraUtilsPkg from '@mediapipe/camera_utils';
import * as Kalidokit from 'kalidokit';

const FaceMesh = faceMeshPkg.FaceMesh || window.FaceMesh;
const Camera = cameraUtilsPkg.Camera || window.Camera;

const AvatarView = ({ videoRef, isMirrored }) => {
  const isMirroredRef = useRef(isMirrored);
  useEffect(() => { isMirroredRef.current = isMirrored; }, [isMirrored]);
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
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;

    const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

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

      // Kafa hariç gövdeyi gizlemek için kesme düzlemi (clipping) uyguluyoruz
      vrm.scene.traverse((obj) => {
        if (obj.isMesh) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => { m.clippingPlanes = [clipPlane]; m.side = THREE.DoubleSide; });
          } else {
            obj.material.clippingPlanes = [clipPlane];
            obj.material.side = THREE.DoubleSide;
          }
        }
      });

      scene.add(vrm.scene);
      currentVrm.current = vrm;
      
      // Face towards camera
      vrm.scene.rotation.y = Math.PI; 
    }, 
    (progress) => console.log('Loading VRM...', (progress.loaded / progress.total * 100) + '%'),
    (error) => console.error('VRM Load Error:', error));

    // Render Loop
    const clock = new THREE.Clock();
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (currentVrm.current) {
        currentVrm.current.update(clock.getDelta());
      }
      if (rendererRef.current) {
        rendererRef.current.render(scene, camera);
      }
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
        const headNode = vrm.humanoid.getNormalizedBoneNode('head');
        const neckNode = vrm.humanoid.getNormalizedBoneNode('neck');

        // --- AR MASKE (YÜZ TAKİBİ VE BOYUTLANDIRMA) ---
        const nose = faceLandmarks[1];
        
        // Kamera aynalanmışsa X eksenini ters çeviriyoruz
        const isMirror = isMirroredRef.current;
        const ndcX = isMirror ? (0.5 - nose.x) * 2 : (nose.x - 0.5) * 2;
        const ndcY = -(nose.y - 0.5) * 2;
        
        // Yüzün ekrandaki pozisyonunu 3D dünyaya çeviriyoruz
        const targetPos = new THREE.Vector3(ndcX, ndcY, 0.5);
        targetPos.unproject(cameraRef.current);
        const dir = targetPos.sub(cameraRef.current.position).normalize();
        const dist = -cameraRef.current.position.z / dir.z;
        const worldTarget = cameraRef.current.position.clone().add(dir.multiplyScalar(dist));
        
        // Avatarı gerçek kafanın üzerine pürüzsüzce taşıyoruz
        const currentHeadPos = new THREE.Vector3();
        if (headNode) headNode.getWorldPosition(currentHeadPos);
        vrm.scene.position.x += (worldTarget.x - currentHeadPos.x) * 0.4;
        vrm.scene.position.y += (worldTarget.y - currentHeadPos.y) * 0.4;

        // Yüzün ekrandaki büyüklüğüne göre Avatarın kafasını ölçeklendiriyoruz
        const topHead = faceLandmarks[10];
        const chin = faceLandmarks[152];
        const faceHeightNDC = Math.abs(chin.y - topHead.y) * 2;
        const vFov = cameraRef.current.fov * Math.PI / 180;
        const visibleHeight = 2 * Math.tan(vFov / 2) * cameraRef.current.position.z;
        const targetFaceWorldHeight = faceHeightNDC * visibleHeight;
        
        const targetScale = (targetFaceWorldHeight / 0.25); // 0.25 model kafa payı
        const smoothedScale = vrm.scene.scale.x + (targetScale - vrm.scene.scale.x) * 0.3;
        const finalScale = Math.max(0.3, Math.min(4.0, smoothedScale)); // Çok büyüme/küçülmeyi sınırla
        vrm.scene.scale.set(finalScale, finalScale, finalScale);

        // Gövdeyi gizlemek için kesme düzlemini boyun hizasına ayarlıyoruz
        if (neckNode) {
          const neckWorld = new THREE.Vector3();
          neckNode.getWorldPosition(neckWorld);
          clipPlane.constant = -neckWorld.y + (0.02 * finalScale); // Boynun hemen altından kes
        }

        // --- KAFA VE MİMİK HAREKETLERİ ---
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
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
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
