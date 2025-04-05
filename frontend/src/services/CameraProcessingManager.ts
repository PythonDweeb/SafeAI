import { ProcessingService } from './ProcessingService';

type CameraStatus = 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface CameraProcessingInfo {
  deviceId: string;
  stream: MediaStream | null;
  videoElement: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  processingInterval: NodeJS.Timeout | null;
  lastProcessedTime: number;
  // Track status for each camera ID using this device
  nodeStatuses: Map<string, {
    onStatusUpdate: (status: CameraStatus) => void;
    currentStatus: CameraStatus;
    lastThreatTime: number;
    statusTimeout: NodeJS.Timeout | null;
  }>;
}

export class CameraProcessingManager {
  private static instance: CameraProcessingManager;
  private processingService: ProcessingService;
  private cameras: Map<string, CameraProcessingInfo> = new Map();
  // Map to track which device is used by which camera IDs
  private deviceToCameras: Map<string, Set<string>> = new Map();
  // Map to track which device each camera is using
  private cameraToDevice: Map<string, string> = new Map();
  private readonly PROCESSING_INTERVAL = 1000; // 1 second
  private readonly STATUS_PERSISTENCE = 2000; // How long to maintain threat status

  private constructor() {
    this.processingService = ProcessingService.getInstance();
  }

  public static getInstance(): CameraProcessingManager {
    if (!CameraProcessingManager.instance) {
      CameraProcessingManager.instance = new CameraProcessingManager();
    }
    return CameraProcessingManager.instance;
  }

  private cleanupDevice(deviceId: string) {
    const camera = this.cameras.get(deviceId);
    if (camera) {
      if (camera.processingInterval) {
        clearTimeout(camera.processingInterval);
      }
      if (camera.stream) {
        camera.stream.getTracks().forEach(track => track.stop());
      }
      camera.videoElement.remove();
      const context = camera.canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, camera.canvas.width, camera.canvas.height);
      }
      this.cameras.delete(deviceId);
    }

    // Clean up device mappings
    const cameraIds = this.deviceToCameras.get(deviceId);
    if (cameraIds) {
      cameraIds.forEach(cameraId => {
        this.cameraToDevice.delete(cameraId);
      });
      this.deviceToCameras.delete(deviceId);
    }
  }

  private updateCameraStatus(deviceId: string, newStatus: CameraStatus) {
    const camera = this.cameras.get(deviceId);
    if (!camera) return;

    // Get all cameras using this device
    const cameraIds = this.deviceToCameras.get(deviceId);
    if (!cameraIds) return;

    // Create a copy of the set to avoid modification during iteration
    const camerasToUpdate = new Set(cameraIds);
    
    // Update all cameras using this device
    camerasToUpdate.forEach(cameraId => {
      // Double-check that this camera is still assigned to this device
      if (this.cameraToDevice.get(cameraId) !== deviceId) {
        // Camera has been reassigned, remove it from the set
        cameraIds.delete(cameraId);
        return;
      }

      const nodeStatus = camera.nodeStatuses.get(cameraId);
      if (!nodeStatus) return;

      // Clear any existing status timeout
      if (nodeStatus.statusTimeout) {
        clearTimeout(nodeStatus.statusTimeout);
        nodeStatus.statusTimeout = null;
      }

      if (newStatus !== 'NORMAL') {
        nodeStatus.currentStatus = newStatus;
        nodeStatus.lastThreatTime = Date.now();
        nodeStatus.onStatusUpdate(newStatus);

        // Set timeout to revert to NORMAL
        nodeStatus.statusTimeout = setTimeout(() => {
          // Double-check that camera is still assigned to this device before updating
          if (this.cameraToDevice.get(cameraId) === deviceId) {
            const currentCamera = this.cameras.get(deviceId);
            const currentNodeStatus = currentCamera?.nodeStatuses.get(cameraId);
            if (currentNodeStatus) {
              currentNodeStatus.currentStatus = 'NORMAL';
              currentNodeStatus.onStatusUpdate('NORMAL');
              currentNodeStatus.statusTimeout = null;
            }
          }
        }, this.STATUS_PERSISTENCE);
      } else if (nodeStatus.currentStatus !== 'NORMAL' && 
                 Date.now() - nodeStatus.lastThreatTime >= this.STATUS_PERSISTENCE) {
        nodeStatus.currentStatus = 'NORMAL';
        nodeStatus.onStatusUpdate('NORMAL');
      }
    });
  }

  public async registerCamera(
    cameraId: string,
    deviceId: string,
    onStatusUpdate: (status: CameraStatus) => void
  ): Promise<void> {
    try {
      // First, unregister this camera from any previous device
      await this.unregisterCamera(cameraId);

      // Set up new device if needed
      let camera = this.cameras.get(deviceId);
      if (!camera) {
        const videoElement = document.createElement('video');
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.muted = true;

        const canvas = document.createElement('canvas');
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: deviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        videoElement.srcObject = stream;
        await videoElement.play();

        camera = {
          deviceId,
          stream,
          videoElement,
          canvas,
          processingInterval: null,
          lastProcessedTime: 0,
          nodeStatuses: new Map()
        };

        this.cameras.set(deviceId, camera);
      }

      // Update mappings - ensure we're not adding to a stale set
      if (!this.deviceToCameras.has(deviceId)) {
        this.deviceToCameras.set(deviceId, new Set());
      }
      
      // Ensure the camera is not already in another device's set
      for (const [existingDeviceId, existingCameras] of this.deviceToCameras.entries()) {
        if (existingDeviceId !== deviceId && existingCameras.has(cameraId)) {
          existingCameras.delete(cameraId);
        }
      }
      
      this.deviceToCameras.get(deviceId)!.add(cameraId);
      this.cameraToDevice.set(cameraId, deviceId);

      // Set up status tracking for this camera
      camera.nodeStatuses.set(cameraId, {
        onStatusUpdate,
        currentStatus: 'NORMAL',
        lastThreatTime: 0,
        statusTimeout: null
      });

      // Start processing if not already started
      if (!camera.processingInterval) {
        this.startProcessing(deviceId);
      }

    } catch (error) {
      console.error(`Error registering camera ${cameraId}:`, error);
      throw error;
    }
  }

  public unregisterCamera(cameraId: string): void {
    const deviceId = this.cameraToDevice.get(cameraId);
    if (!deviceId) return;

    const camera = this.cameras.get(deviceId);
    if (camera) {
      // Clear status timeout for this camera
      const nodeStatus = camera.nodeStatuses.get(cameraId);
      if (nodeStatus?.statusTimeout) {
        clearTimeout(nodeStatus.statusTimeout);
      }
      camera.nodeStatuses.delete(cameraId);

      // Remove from device tracking
      const cameraIds = this.deviceToCameras.get(deviceId);
      if (cameraIds) {
        cameraIds.delete(cameraId);
        
        // If no more cameras are using this device, clean it up
        if (cameraIds.size === 0) {
          this.cleanupDevice(deviceId);
        }
      }
    }

    // Remove camera-to-device mapping
    this.cameraToDevice.delete(cameraId);

    // Set status to NORMAL before removing
    const nodeStatus = camera?.nodeStatuses.get(cameraId);
    if (nodeStatus) {
      nodeStatus.onStatusUpdate('NORMAL');
    }
  }

  private startProcessing(deviceId: string): void {
    const camera = this.cameras.get(deviceId);
    if (!camera) return;

    // Clear any existing processing
    if (camera.processingInterval) {
      clearTimeout(camera.processingInterval);
      camera.processingInterval = null;
    }

    const processFrame = async () => {
      const now = Date.now();
      if (now - camera.lastProcessedTime < this.PROCESSING_INTERVAL) return;

      try {
        // Verify the device is still being used
        if (!this.cameras.has(deviceId) || !camera.stream) {
          this.stopProcessing(deviceId);
          return;
        }

        // Verify there are still cameras using this device
        const activeCameras = this.deviceToCameras.get(deviceId);
        if (!activeCameras || activeCameras.size === 0) {
          this.stopProcessing(deviceId);
          return;
        }

        camera.canvas.width = camera.videoElement.videoWidth;
        camera.canvas.height = camera.videoElement.videoHeight;

        const context = camera.canvas.getContext('2d');
        if (!context) return;
        context.drawImage(camera.videoElement, 0, 0, camera.canvas.width, camera.canvas.height);

        const imageData = this.processingService.canvasToBase64(camera.canvas);
        const result = await this.processingService.processFrame(imageData);

        // Only update status if we still have cameras using this device
        if (activeCameras && activeCameras.size > 0) {
          if (result.threats.length > 0) {
            const highestThreat = result.threats.sort((a: { confidence: number }, b: { confidence: number }) => b.confidence - a.confidence)[0];
            const newStatus: CameraStatus = 
              highestThreat.confidence > 0.8 ? 'HIGH' :
              highestThreat.confidence > 0.5 ? 'MEDIUM' : 'LOW';
            this.updateCameraStatus(deviceId, newStatus);
          } else {
            this.updateCameraStatus(deviceId, 'NORMAL');
          }
        }

        camera.lastProcessedTime = now;
      } catch (error) {
        console.error(`Error processing frame for device ${deviceId}:`, error);
      }
    };

    const process = () => {
      // Verify the device is still being used
      if (!this.cameras.has(deviceId)) {
        this.stopProcessing(deviceId);
        return;
      }
      
      // Verify there are still cameras using this device
      const activeCameras = this.deviceToCameras.get(deviceId);
      if (!activeCameras || activeCameras.size === 0) {
        this.stopProcessing(deviceId);
        return;
      }
      
      processFrame();
      camera.processingInterval = setTimeout(process, this.PROCESSING_INTERVAL);
    };

    process();
  }

  private stopProcessing(deviceId: string): void {
    const camera = this.cameras.get(deviceId);
    if (camera?.processingInterval) {
      clearTimeout(camera.processingInterval);
      camera.processingInterval = null;
    }
  }

  public getProcessedFrame(cameraId: string): string | null {
    const deviceId = this.cameraToDevice.get(cameraId);
    if (!deviceId) return null;

    const camera = this.cameras.get(deviceId);
    if (!camera || !camera.processingInterval) return null;
    
    // Verify the camera is still assigned to this device
    if (this.cameraToDevice.get(cameraId) !== deviceId) return null;
    
    return camera.canvas.toDataURL('image/jpeg');
  }
} 