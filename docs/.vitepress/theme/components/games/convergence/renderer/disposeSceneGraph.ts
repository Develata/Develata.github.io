import * as THREE from 'three';

function disposeRenderable(object: THREE.Mesh | THREE.Line) {
  object.geometry.dispose();
  const material = object.material;
  if (Array.isArray(material)) {
    material.forEach((entry) => entry.dispose());
    return;
  }
  material.dispose();
}

export function disposeSceneGraph(scene: THREE.Scene) {
  scene.traverse((object: THREE.Object3D) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
      disposeRenderable(object);
    }
  });
}
