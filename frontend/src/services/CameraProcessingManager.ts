import { ProcessingService } from './ProcessingService';

export type CameraStatus = 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH';

interface CameraProcessingInfo {
  videoElement: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  stream: MediaStream | null;
  processingInterval: NodeJS.Timeout | null;
  lastProcessedTime: number;
  status: CameraStatus;
  statusTimeout: NodeJS.Timeout | null;
}

export class CameraProcessingManager {
  private static instance: CameraProcessingManager;
  private readonly PROCESSING_INTERVAL = 1000; // 1 second
  private readonly STATUS_PERSISTENCE = 2000; // 2 seconds
  private cameras: Map<string, CameraProcessingInfo>;
  private deviceToCameras: Map<string, Set<string>>;
  private processingService: ProcessingService;

  private constructor() {
    this.cameras = new Map();
    this.deviceToCameras = new Map();
    this.processingService = ProcessingService.getInstance();
  }

  public static getInstance(): CameraProcessingManager {
    if (!CameraProcessingManager.instance) {
      CameraProcessingManager.instance = new CameraProcessingManager();
    }
    return CameraProcessingManager.instance;
  }

  private cleanupDevice(deviceId: string): void {
    const cameras = this.deviceToCameras.get(deviceId);
    if (cameras) {
      cameras.forEach(cameraId => {
        const camera = this.cameras.get(cameraId);
        if (camera) {
          if (camera.processingInterval) {
            clearTimeout(camera.processingInterval);
          }
          if (camera.statusTimeout) {
            clearTimeout(camera.statusTimeout);
          }
          if (camera.stream) {
            camera.stream.getTracks().forEach(track => track.stop());
          }
          this.cameras.delete(cameraId);
        }
      });
      this.deviceToCameras.delete(deviceId);
    }
  }

  private updateCameraStatus(deviceId: string, status: CameraStatus): void {
    const cameras = this.deviceToCameras.get(deviceId);
    if (!cameras) return;

    cameras.forEach(cameraId => {
      const camera = this.cameras.get(cameraId);
      if (camera) {
        camera.status = status;
        if (camera.statusTimeout) {
          clearTimeout(camera.statusTimeout);
        }
        camera.statusTimeout = setTimeout(() => {
          const cam = this.cameras.get(cameraId);
          if (cam) {
            cam.status = 'NORMAL';
          }
        }, this.STATUS_PERSISTENCE);
      }
    });
  }

  public async registerCamera(
    cameraId: string,
    deviceId: string,
    onStatusUpdate: (status: CameraStatus) => void
  ): Promise<void> {
    try {
      // Create video element
      const videoElement = document.createElement('video');
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.muted = true;

      // Create canvas for frame capture
      const canvas = document.createElement('canvas');

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      });

      // Set up video element
      videoElement.srcObject = stream;
      await new Promise<void>((resolve) => {
        videoElement.onloadedmetadata = () => resolve();
      });
      await videoElement.play();

      // Register camera
      const cameraInfo: CameraProcessingInfo = {
        videoElement,
        canvas,
        stream,
        processingInterval: null,
        lastProcessedTime: 0,
        status: 'NORMAL',
        statusTimeout: null,
      };

      this.cameras.set(cameraId, cameraInfo);

      // Add to device mapping
      let deviceCameras = this.deviceToCameras.get(deviceId);
      if (!deviceCameras) {
        deviceCameras = new Set();
        this.deviceToCameras.set(deviceId, deviceCameras);
      }
      deviceCameras.add(cameraId);

      // Start processing if this is the first camera for this device
      if (deviceCameras.size === 1) {
        this.startProcessing(deviceId);
      }

      // Set up status update listener
      const statusInterval = setInterval(() => {
        const camera = this.cameras.get(cameraId);
        if (camera) {
          onStatusUpdate(camera.status);
        } else {
          clearInterval(statusInterval);
        }
      }, 100);

    } catch (error) {
      console.error('Error registering camera:', error);
      throw error;
    }
  }

  public unregisterCamera(cameraId: string): void {
    const camera = this.cameras.get(cameraId);
    if (!camera) return;

    // Find the device this camera belongs to
    let deviceId: string | undefined;
    for (const [device, cameras] of this.deviceToCameras.entries()) {
      if (cameras.has(cameraId)) {
        deviceId = device;
        break;
      }
    }

    if (deviceId) {
      const deviceCameras = this.deviceToCameras.get(deviceId);
      if (deviceCameras) {
        deviceCameras.delete(cameraId);
        if (deviceCameras.size === 0) {
          this.cleanupDevice(deviceId);
        }
      }
    }

    // Cleanup camera resources
    if (camera.processingInterval) {
      clearTimeout(camera.processingInterval);
    }
    if (camera.statusTimeout) {
      clearTimeout(camera.statusTimeout);
    }
    if (camera.stream) {
      camera.stream.getTracks().forEach(track => track.stop());
    }
    this.cameras.delete(cameraId);
  }

  private startProcessing(deviceId: string): void {
    const camera = this.cameras.get(deviceId);
    if (!camera) return;

    const processFrame = async () => {
      try {
        const now = Date.now();
        if (now - camera.lastProcessedTime < this.PROCESSING_INTERVAL) return;

        camera.canvas.width = camera.videoElement.videoWidth;
        camera.canvas.height = camera.videoElement.videoHeight;
        const context = camera.canvas.getContext('2d');
        if (!context) return;

        context.drawImage(camera.videoElement, 0, 0);
        const imageData = this.processingService.canvasToBase64(camera.canvas);
        const result = await this.processingService.processFrame(imageData);

        if (result.threats && result.threats.length > 0) {
          const highestThreat = result.threats.sort((a: any, b: any) => b.confidence - a.confidence)[0];
          const newStatus: CameraStatus = 
            highestThreat.confidence > 0.8 ? 'HIGH' :
            highestThreat.confidence > 0.5 ? 'MEDIUM' : 'LOW';
          this.updateCameraStatus(deviceId, newStatus);
        }

        camera.lastProcessedTime = now;
      } catch (error) {
        console.error('Error processing frame:', error);
      }
    };

    const process = () => {
      processFrame();
      camera.processingInterval = setTimeout(process, this.PROCESSING_INTERVAL);
    };

    process();
  }

  public getProcessedFrame(cameraId: string): string | null {
    const camera = this.cameras.get(cameraId);
    if (!camera) return null;

    const context = camera.canvas.getContext('2d');
    if (!context) return null;

    return camera.canvas.toDataURL('image/jpeg');
  }
} 