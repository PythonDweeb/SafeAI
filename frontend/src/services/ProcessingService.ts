// Service for handling frame processing through the backend
export class ProcessingService {
  private static instance: ProcessingService;
  private baseUrl: string = 'http://localhost:8000';

  private constructor() {}

  public static getInstance(): ProcessingService {
    if (!ProcessingService.instance) {
      ProcessingService.instance = new ProcessingService();
    }
    return ProcessingService.instance;
  }

  // Process a single frame through the backend
  public async processFrame(imageData: string): Promise<{
    processed_image: string;
    threats: Array<{
      type: string;
      confidence: number;
      bbox: [number, number, number, number];
    }>;
    timestamp: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error processing frame:', error);
      throw error;
    }
  }

  // Convert canvas to base64
  public canvasToBase64(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
  }
} 