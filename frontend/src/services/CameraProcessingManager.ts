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
  private readonly PROCESSING_INTERVAL = 1000; // 1 second between queries
  private readonly STATUS_PERSISTENCE = 1000; // Show threat for 1 second

  private constructor() {
    this.processingService = ProcessingService.getInstance();
  }

  public static getInstance(): CameraProcessingManager {
    if (!CameraProcessingManager.instance) {
      CameraProcessingManager.instance = new CameraProcessingManager();
    }
    return CameraProcessingManager.instance;
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

      // Only update if status is different or it's a new threat
      if (newStatus !== 'NORMAL') {
        nodeStatus.currentStatus = newStatus;
        nodeStatus.lastThreatTime = Date.now();
        nodeStatus.onStatusUpdate(newStatus);

        // Set timeout to revert to NORMAL after STATUS_PERSISTENCE time
        nodeStatus.statusTimeout = setTimeout(() => {
          const currentCamera = this.cameras.get(deviceId);
          const currentNodeStatus = currentCamera?.nodeStatuses.get(cameraId);
          if (currentNodeStatus) {
            currentNodeStatus.currentStatus = 'NORMAL';
            currentNodeStatus.onStatusUpdate('NORMAL');
            currentNodeStatus.statusTimeout = null;
          }
        }, this.STATUS_PERSISTENCE);
      } else if (nodeStatus.currentStatus !== 'NORMAL' && 
                 Date.now() - nodeStatus.lastThreatTime >= this.STATUS_PERSISTENCE) {
        // Only revert to NORMAL if enough time has passed since last threat
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
      this.unregisterCamera(cameraId);

      // Check if this device is already being processed
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
          nodeStatuses: new Map()
        };

        this.cameras.set(deviceId, camera);
        this.startProcessing(deviceId);
      }

      // Add this camera ID to the device's tracking
      if (!this.deviceToCameras.has(deviceId)) {
        this.deviceToCameras.set(deviceId, new Set());
      }
      this.deviceToCameras.get(deviceId)!.add(cameraId);

      // Track which device this camera is using
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
    // Get the device this camera was using
    const deviceId = this.cameraToDevice.get(cameraId);
    if (!deviceId) return;

    // Remove camera from device tracking
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

        // If no more cameras are using this device, clean it up
        if (cameraIds.size === 0) {
          this.stopProcessing(deviceId);
          if (camera.stream) {
            camera.stream.getTracks().forEach(track => track.stop());
          }
          camera.videoElement.remove();
          const context = camera.canvas.getContext('2d');
          if (context) {
            context.clearRect(0, 0, camera.canvas.width, camera.canvas.height);
          }
          this.cameras.delete(deviceId);
          this.deviceToCameras.delete(deviceId);
        }
      }
    }

    // Remove camera from device mapping
    this.cameraToDevice.delete(cameraId);
  }

  private startProcessing(deviceId: string): void {
    const camera = this.cameras.get(deviceId);
    if (!camera) return;

    // Clear any existing processing interval
    this.stopProcessing(deviceId);

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

        // Update status based on threats
        if (result.threats.length > 0) {
          const highestThreat = result.threats.sort((a: { confidence: number }, b: { confidence: number }) => b.confidence - a.confidence)[0];
          const newStatus: CameraStatus = 
            highestThreat.confidence > 0.8 ? 'HIGH' :
            highestThreat.confidence > 0.5 ? 'MEDIUM' : 'LOW';
          this.updateCameraStatus(deviceId, newStatus);
        }

        camera.lastProcessedTime = now;
      } catch (error) {
        console.error(`Error processing frame for device ${deviceId}:`, error);
      }
    };

    // Start continuous processing
    const process = () => {
      if (!this.cameras.has(deviceId)) {
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
      // Set status to NORMAL for all nodes using this device
      this.updateCameraStatus(deviceId, 'NORMAL');
    }
  }

  public getProcessedFrame(cameraId: string): string | null {
    // Get the device this camera is using
    const deviceId = this.cameraToDevice.get(cameraId);
    if (!deviceId) return null;

    const camera = this.cameras.get(deviceId);
    if (!camera || !camera.processingInterval) return null;
    return camera.canvas.toDataURL('image/jpeg');
  }
} 