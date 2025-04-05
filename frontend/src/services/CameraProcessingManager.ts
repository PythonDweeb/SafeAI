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
  processedFrame: string | null;
}

export class CameraProcessingManager {
  private static instance: CameraProcessingManager;
  private processingService: ProcessingService;
  private cameras: Map<string, CameraProcessingInfo> = new Map();
  private deviceToCameras: Map<string, Set<string>> = new Map();
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
    const cameraIds = this.deviceToCameras.get(deviceId);
    if (!cameraIds) return;

    const camera = this.cameras.get(deviceId);
    if (!camera) return;

    // Update status for all nodes using this specific device
    cameraIds.forEach(cameraId => {
      const nodeStatus = camera.nodeStatuses.get(cameraId);
      if (!nodeStatus) return;

      // Clear any existing status timeout
      if (nodeStatus.statusTimeout) {
        clearTimeout(nodeStatus.statusTimeout);
        nodeStatus.statusTimeout = null;
      }

      // Update status immediately
      nodeStatus.currentStatus = newStatus;
      nodeStatus.onStatusUpdate(newStatus);

      // Emit global status update event
      const event = new CustomEvent('cameraStatusChanged', {
        detail: { cameraId, status: newStatus }
      });
      window.dispatchEvent(event);

      if (newStatus !== 'NORMAL') {
        // For non-NORMAL status, set timeout to revert
        nodeStatus.lastThreatTime = Date.now();
        nodeStatus.statusTimeout = setTimeout(() => {
          const currentCamera = this.cameras.get(deviceId);
          const currentNodeStatus = currentCamera?.nodeStatuses.get(cameraId);
          if (currentNodeStatus) {
            currentNodeStatus.currentStatus = 'NORMAL';
            currentNodeStatus.onStatusUpdate('NORMAL');
            currentNodeStatus.statusTimeout = null;
            // Emit global status update event for NORMAL status
            const normalEvent = new CustomEvent('cameraStatusChanged', {
              detail: { cameraId, status: 'NORMAL' }
            });
            window.dispatchEvent(normalEvent);
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
      // Clean up any existing registration for this camera
      const oldDeviceId = this.cameraToDevice.get(cameraId);
      if (oldDeviceId) {
        // Remove this camera from old device's tracking
        const oldCameraIds = this.deviceToCameras.get(oldDeviceId);
        if (oldCameraIds) {
          oldCameraIds.delete(cameraId);
          // If old device has no more cameras, clean it up
          if (oldCameraIds.size === 0) {
            this.cleanupDevice(oldDeviceId);
          } else {
            // Just remove this camera's status tracking
            const oldCamera = this.cameras.get(oldDeviceId);
            if (oldCamera) {
              const oldNodeStatus = oldCamera.nodeStatuses.get(cameraId);
              if (oldNodeStatus?.statusTimeout) {
                clearTimeout(oldNodeStatus.statusTimeout);
              }
              oldCamera.nodeStatuses.delete(cameraId);
            }
          }
        }
      }

      // Set up new device if needed
      let camera = this.cameras.get(deviceId);
      if (!camera) {
        // Create new camera processing for this device
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
          nodeStatuses: new Map(),
          processedFrame: null
        };

        this.cameras.set(deviceId, camera);
        this.startProcessing(deviceId);
      }

      // Update mappings
      if (!this.deviceToCameras.has(deviceId)) {
        this.deviceToCameras.set(deviceId, new Set());
      }
      this.deviceToCameras.get(deviceId)!.add(cameraId);
      this.cameraToDevice.set(cameraId, deviceId);

      // Add status tracking for this node
      camera.nodeStatuses.set(cameraId, {
        onStatusUpdate,
        currentStatus: 'NORMAL',
        lastThreatTime: 0,
        statusTimeout: null
      });

    } catch (error) {
      console.error(`Error registering camera ${cameraId}:`, error);
      throw error;
    }
  }

  public unregisterCamera(cameraId: string): void {
    const deviceId = this.cameraToDevice.get(cameraId);
    if (!deviceId) return;

    const cameraIds = this.deviceToCameras.get(deviceId);
    if (cameraIds) {
      cameraIds.delete(cameraId);
      
      const camera = this.cameras.get(deviceId);
      if (camera) {
        // Clear status timeout for this node
        const nodeStatus = camera.nodeStatuses.get(cameraId);
        if (nodeStatus?.statusTimeout) {
          clearTimeout(nodeStatus.statusTimeout);
        }
        camera.nodeStatuses.delete(cameraId);

        // If this was the last camera using this device, clean up everything
        if (cameraIds.size === 0) {
          this.cleanupDevice(deviceId);
        }
      }
    }

    // Always remove the camera-to-device mapping
    this.cameraToDevice.delete(cameraId);
  }

  private startProcessing(deviceId: string): void {
    const camera = this.cameras.get(deviceId);
    if (!camera) return;

    // Clear any existing processing interval
    if (camera.processingInterval) {
      clearTimeout(camera.processingInterval);
      camera.processingInterval = null;
    }

    const processFrame = async () => {
      const now = Date.now();
      if (now - camera.lastProcessedTime < this.PROCESSING_INTERVAL) return;

      try {
        // Ensure camera is still registered and streaming
        if (!this.cameras.has(deviceId) || !camera.stream) {
          this.stopProcessing(deviceId);
          return;
        }

        // Set canvas dimensions to match video
        camera.canvas.width = camera.videoElement.videoWidth;
        camera.canvas.height = camera.videoElement.videoHeight;

        // Draw the current frame to canvas
        const context = camera.canvas.getContext('2d');
        if (!context) return;
        context.drawImage(camera.videoElement, 0, 0, camera.canvas.width, camera.canvas.height);

        // Process the frame
        const imageData = this.processingService.canvasToBase64(camera.canvas);
        const result = await this.processingService.processFrame(imageData);

        // Store the processed frame with red boxes
        if (result.processed_image) {
          camera.processedFrame = `data:image/jpeg;base64,${result.processed_image}`;
        }

        // Update status based on threats
        if (result.threats && result.threats.length > 0) {
          const highestThreat = result.threats.sort((a: { confidence: number }, b: { confidence: number }) => b.confidence - a.confidence)[0];
          const newStatus: CameraStatus = 
            highestThreat.confidence > 0.8 ? 'HIGH' :
            highestThreat.confidence > 0.5 ? 'MEDIUM' : 'LOW';
          this.updateCameraStatus(deviceId, newStatus);
        } else {
          // Always update to NORMAL when no threats are detected
          this.updateCameraStatus(deviceId, 'NORMAL');
        }

        camera.lastProcessedTime = now;
      } catch (error) {
        console.error(`Error processing frame for device ${deviceId}:`, error);
      }
    };

    // Start continuous processing with interval matching backend timing
    const process = () => {
      if (!this.cameras.has(deviceId)) {
        this.stopProcessing(deviceId);
        return;
      }
      processFrame();
      camera.processingInterval = setTimeout(process, 1500); // Match backend's min_process_interval
    };

    process();
  }

  private stopProcessing(deviceId: string): void {
    const camera = this.cameras.get(deviceId);
    if (camera?.processingInterval) {
      clearTimeout(camera.processingInterval);
      camera.processingInterval = null;
      // Set status to NORMAL for all nodes using this device
      this.updateCameraStatus(deviceId, 'NORMAL');
    }
  }

  public getProcessedFrame(cameraId: string): string | null {
    const deviceId = this.cameraToDevice.get(cameraId);
    if (!deviceId) return null;

    const camera = this.cameras.get(deviceId);
    if (!camera || !camera.processingInterval) return null;
    
    return camera.processedFrame;
  }
} 