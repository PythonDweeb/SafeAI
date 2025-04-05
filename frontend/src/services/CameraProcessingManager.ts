// Service for managing camera processing
export class CameraProcessingManager {
  private static instance: CameraProcessingManager;
  private cameraToDevice: Map<string, string> = new Map();
  private deviceToCameras: Map<string, Set<string>> = new Map();
  private nodeStatuses: Map<string, 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = new Map();
  private processedFrames: Map<string, string> = new Map();

  private constructor() {}

  public static getInstance(): CameraProcessingManager {
    if (!CameraProcessingManager.instance) {
      CameraProcessingManager.instance = new CameraProcessingManager();
    }
    return CameraProcessingManager.instance;
  }

  public registerCamera(cameraId: string, deviceId: string | null) {
    // Remove old device mapping if it exists
    const oldDeviceId = this.cameraToDevice.get(cameraId);
    if (oldDeviceId) {
      const cameras = this.deviceToCameras.get(oldDeviceId);
      if (cameras) {
        cameras.delete(cameraId);
        if (cameras.size === 0) {
          this.deviceToCameras.delete(oldDeviceId);
        }
      }
    }

    // Add new device mapping
    if (deviceId) {
      this.cameraToDevice.set(cameraId, deviceId);
      if (!this.deviceToCameras.has(deviceId)) {
        this.deviceToCameras.set(deviceId, new Set());
      }
      this.deviceToCameras.get(deviceId)?.add(cameraId);
    } else {
      this.cameraToDevice.delete(cameraId);
    }
  }

  public unregisterCamera(cameraId: string) {
    const deviceId = this.cameraToDevice.get(cameraId);
    if (deviceId) {
      const cameras = this.deviceToCameras.get(deviceId);
      if (cameras) {
        cameras.delete(cameraId);
        if (cameras.size === 0) {
          this.deviceToCameras.delete(deviceId);
        }
      }
    }
    this.cameraToDevice.delete(cameraId);
    this.nodeStatuses.delete(cameraId);
    this.processedFrames.delete(cameraId);
  }

  public updateCameraStatus(cameraId: string, status: 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW') {
    this.nodeStatuses.set(cameraId, status);
  }

  public getCameraStatus(cameraId: string): 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    return this.nodeStatuses.get(cameraId) || 'NORMAL';
  }

  public getDeviceForCamera(cameraId: string): string | null {
    return this.cameraToDevice.get(cameraId) || null;
  }

  public setProcessedFrame(cameraId: string, frame: string) {
    this.processedFrames.set(cameraId, frame);
  }

  public getProcessedFrame(cameraId: string): string | null {
    return this.processedFrames.get(cameraId) || null;
  }
} 