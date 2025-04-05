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
  private cameraCallbacks: Map<string, (status: 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW') => void>;
  private cameraDevices: Map<string, string>;
  private processingIntervals: Map<string, NodeJS.Timeout>;
  private processedFrames: Map<string, string>;
  private processingService: ProcessingService;
  private cameras: Map<string, CameraProcessingInfo> = new Map();
  private deviceToCameras: Map<string, Set<string>> = new Map();
  private cameraToDevice: Map<string, string> = new Map();
  private readonly PROCESSING_INTERVAL = 1000; // 1 second
  private readonly STATUS_PERSISTENCE = 2000; // How long to maintain threat status

  private constructor() {
    this.cameraCallbacks = new Map();
    this.cameraDevices = new Map();
    this.processingIntervals = new Map();
    this.processedFrames = new Map();
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
          }
        }, this.STATUS_PERSISTENCE);
      }
    });
  }

  public registerCamera(
    cameraId: string,
    deviceId: string,
    onStatusUpdate: (status: 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW') => void
  ): void {
    this.cameraCallbacks.set(cameraId, onStatusUpdate);
    this.cameraDevices.set(cameraId, deviceId);
  }

  public unregisterCamera(cameraId: string): void {
    this.cameraCallbacks.delete(cameraId);
    this.cameraDevices.delete(cameraId);
    this.stopProcessing(cameraId);
  }

  public startProcessing(cameraId: string): void {
    if (this.processingIntervals.has(cameraId)) {
      return;
    }

    const interval = setInterval(async () => {
      const frame = this.processedFrames.get(cameraId);
      if (frame) {
        try {
          const result = await this.processingService.processFrame(frame);
          const callback = this.cameraCallbacks.get(cameraId);
          
          if (callback && result.threats) {
            if (result.threats.length > 0) {
              const highestThreat = result.threats.sort((a: { confidence: number }, b: { confidence: number }) => b.confidence - a.confidence)[0];
              const status = highestThreat.confidence > 0.8 ? 'HIGH' :
                           highestThreat.confidence > 0.5 ? 'MEDIUM' : 'LOW';
              callback(status);
            } else {
              callback('NORMAL');
            }
          }
        } catch (error) {
          console.error('Error processing frame:', error);
        }
      }
    }, 1500); // Process every 1.5 seconds to match backend timing

    this.processingIntervals.set(cameraId, interval);
  }

  public stopProcessing(cameraId: string): void {
    const interval = this.processingIntervals.get(cameraId);
    if (interval) {
      clearInterval(interval);
      this.processingIntervals.delete(cameraId);
    }
  }

  public processFrame(cameraId: string, frame: string): void {
    this.processedFrames.set(cameraId, frame);
  }

  public getProcessedFrame(cameraId: string): string | null {
    return this.processedFrames.get(cameraId) || null;
  }
} 