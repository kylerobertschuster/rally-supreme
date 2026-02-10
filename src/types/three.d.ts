declare module "three/examples/jsm/loaders/GLTFLoader" {
  import { Loader, LoadingManager, Scene } from "three";

  interface GLTF {
    animations: unknown[];
    scene: Scene;
    scenes: Scene[];
    cameras: unknown[];
    asset: Record<string, unknown>;
    parser: unknown;
    userData: Record<string, unknown>;
  }

  class GLTFLoader extends Loader {
    constructor(manager?: LoadingManager);
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
  }

  export { GLTFLoader, GLTF };
}
