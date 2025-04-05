// Service for handling frame processing through the backend
export class ProcessingService {
  private static instance: ProcessingService;
  private readonly API_BASE_URL = 'http://localhost:8000/api';

  private constructor() {}

  public static getInstance(): ProcessingService {
    if (!ProcessingService.instance) {
      ProcessingService.instance = new ProcessingService();
    }
    return ProcessingService.instance;
  }

  // Process a single frame through the backend
  public async processFrame(imageData: string, cameraId: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/detect/${cameraId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error processing frame:', error);
      throw error;
    }
  }

  // Convert canvas to base64
  public canvasToBase64(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL('image/jpeg').split(',')[1];
  }

  public async checkHealth(cameraId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/health/${cameraId}`);
      if (!response.ok) {
        return false;
      }
      const data = await response.json();
      return data.status === 'healthy' && data.model_loaded;
    } catch (error) {
      console.error('Error checking health:', error);
      return false;
    }
  }
} 