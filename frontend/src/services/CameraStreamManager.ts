// CameraStreamManager.ts
// Manages a single camera stream per device ID and shares it across components

type StreamCallback = (stream: MediaStream | null) => void;

class CameraStreamManager {
  private static instance: CameraStreamManager;
  private activeStreams: Map<string, MediaStream> = new Map();
  private streamListeners: Map<string, Set<StreamCallback>> = new Map();
  private streamAcquisitionInProgress: Map<string, boolean> = new Map();
  
  private constructor() {}
  
  public static getInstance(): CameraStreamManager {
    if (!CameraStreamManager.instance) {
      CameraStreamManager.instance = new CameraStreamManager();
    }
    return CameraStreamManager.instance;
  }
  
  /**
   * Request access to a camera stream for a specific device ID.
   * If the stream is already available, it will be returned immediately.
   * If the stream is not available, it will be acquired and shared with all subscribers.
   * 
   * @param deviceId The camera device ID
   * @param callback Function to call with the stream once available
   * @returns A cleanup function to unsubscribe
   */
  public requestStream(deviceId: string, callback: StreamCallback): () => void {
    console.log(`RequestStream for device ${deviceId}`);
    
    // Add listener
    if (!this.streamListeners.has(deviceId)) {
      this.streamListeners.set(deviceId, new Set());
    }
    this.streamListeners.get(deviceId)!.add(callback);
    
    // If stream already exists, notify immediately
    if (this.activeStreams.has(deviceId)) {
      const stream = this.activeStreams.get(deviceId)!;
      console.log(`Stream already exists for ${deviceId}, notifying callback`);
      setTimeout(() => callback(stream), 0);
    }
    // If not already acquiring, start acquisition
    else if (!this.streamAcquisitionInProgress.get(deviceId)) {
      this.acquireStream(deviceId);
    }
    
    // Return cleanup function
    return () => {
      this.releaseStream(deviceId, callback);
    };
  }
  
  /**
   * Acquire a camera stream for the specified device ID
   */
  private async acquireStream(deviceId: string): Promise<void> {
    if (this.streamAcquisitionInProgress.get(deviceId)) return;
    
    this.streamAcquisitionInProgress.set(deviceId, true);
    console.log(`Acquiring stream for device ${deviceId}`);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      // Store the stream
      this.activeStreams.set(deviceId, stream);
      console.log(`Successfully acquired stream for device ${deviceId}`);
      
      // Notify all listeners
      const listeners = this.streamListeners.get(deviceId);
      if (listeners) {
        listeners.forEach(callback => {
          setTimeout(() => callback(stream), 0);
        });
      }
    } catch (error) {
      console.error(`Error acquiring stream for device ${deviceId}:`, error);
      
      // Notify listeners about the error
      const listeners = this.streamListeners.get(deviceId);
      if (listeners) {
        listeners.forEach(callback => {
          setTimeout(() => callback(null), 0);
        });
      }
    } finally {
      this.streamAcquisitionInProgress.set(deviceId, false);
    }
  }
  
  /**
   * Release a camera stream subscription for a specific callback
   */
  private releaseStream(deviceId: string, callback: StreamCallback): void {
    const listeners = this.streamListeners.get(deviceId);
    if (!listeners) return;
    
    // Remove this specific callback
    listeners.delete(callback);
    
    // If no more listeners, stop and cleanup the stream
    if (listeners.size === 0) {
      const stream = this.activeStreams.get(deviceId);
      if (stream) {
        console.log(`No more listeners for device ${deviceId}, stopping stream`);
        stream.getTracks().forEach(track => track.stop());
        this.activeStreams.delete(deviceId);
      }
      this.streamListeners.delete(deviceId);
    }
  }
  
  /**
   * Stop all active streams
   */
  public stopAllStreams(): void {
    this.activeStreams.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    this.activeStreams.clear();
    this.streamListeners.clear();
    this.streamAcquisitionInProgress.clear();
    console.log('All camera streams stopped');
  }
}

export default CameraStreamManager; 