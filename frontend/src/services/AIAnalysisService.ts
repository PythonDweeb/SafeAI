import axios from 'axios';

// Interface for the AI analysis response
export interface AIAnalysisResponse {
  analysis: string;
  responseTime: string;
  threatLevel: string;
  recommendedActions: string[];
  timestamp: number;
}

// AI Analysis Service - Singleton
export class AIAnalysisService {
  private static instance: AIAnalysisService;
  private apiKey: string = 'AIzaSyAtEliIkJUDxAgGMrN91OEhFd2goK03-Bw'; // Hard-coded API key
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private modelName = 'gemini-2.0-flash'; // Updated to use gemini-2.0-flash
  
  private constructor() {}
  
  public static getInstance(): AIAnalysisService {
    if (!AIAnalysisService.instance) {
      AIAnalysisService.instance = new AIAnalysisService();
    }
    return AIAnalysisService.instance;
  }
  
  // Get the API key - now simply returns the hardcoded key
  private getApiKey(): string {
    return this.apiKey;
  }
  
  // Generate an analysis for a security threat situation
  public async analyzeSecurityThreat(
    cameraInfo: {
      name: string;
      location: string;
      status: 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    },
    schoolName: string
  ): Promise<AIAnalysisResponse> {
    try {
      // Prepare the prompt for Gemini
      const prompt = `
        You are SafeAI's security analysis assistant. Analyze this security threat situation and provide recommendations:
        
        School: ${schoolName}
        Camera Location: ${cameraInfo.name} (${cameraInfo.location})
        Threat Level: ${cameraInfo.status}
        Current Time: ${new Date().toLocaleTimeString()}
        
        Provide a concise analysis that includes:
        1. Assessment of the situation
        2. Estimated security response time
        3. Recommended actions for security personnel
        4. Potential evacuation needs
        
        Format the response as JSON with these fields:
        - analysis: A paragraph describing the situation
        - responseTime: Estimated time for security to reach the location 
        - threatLevel: A description of the threat severity
        - recommendedActions: An array of 3-4 specific actions security should take
      `;
      
      // Make the API call to Gemini
      const response = await axios.post(
        `${this.baseUrl}/models/${this.modelName}:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 1024
          }
        }
      );
      
      // Parse the response
      const textResponse = response.data.candidates[0].content.parts[0].text;
      let jsonStart = textResponse.indexOf('{');
      let jsonEnd = textResponse.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1) {
        console.error('Invalid response format from Gemini API');
        return this.getSimulatedResponse(cameraInfo, schoolName);
      }
      
      const jsonStr = textResponse.substring(jsonStart, jsonEnd + 1);
      const analysisData = JSON.parse(jsonStr);
      
      return {
        ...analysisData,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error analyzing security threat:', error);
      // Fallback to simulated response in case of errors
      return this.getSimulatedResponse(cameraInfo, schoolName);
    }
  }
  
  // Generate a simulated response when API is not available
  private getSimulatedResponse(
    cameraInfo: { name: string; location: string; status: string },
    schoolName: string
  ): AIAnalysisResponse {
    const responseTimeMap = {
      'HIGH': '1-2 minutes',
      'MEDIUM': '2-3 minutes',
      'LOW': '3-5 minutes',
      'NORMAL': '5-7 minutes'
    };
    
    const threatLevelDescriptions = {
      'HIGH': 'Critical situation requiring immediate response. Potential active threat.',
      'MEDIUM': 'Serious situation that requires prompt attention. Suspicious activity detected.',
      'LOW': 'Potential concern that should be investigated. May be a false positive.',
      'NORMAL': 'Routine monitoring. No immediate concerns detected.'
    };
    
    const recommendedActionsMap = {
      'HIGH': [
        'Deploy all available security personnel to the location',
        'Consider immediate lockdown procedures for adjacent areas',
        'Notify local law enforcement for immediate support',
        'Prepare for possible evacuation of nearby classrooms'
      ],
      'MEDIUM': [
        'Send security team to investigate the situation',
        'Alert nearby staff members to be on standby',
        'Monitor adjacent camera feeds for related activity',
        'Prepare communication channels for potential escalation'
      ],
      'LOW': [
        'Dispatch a single security officer to assess the situation',
        'Continue monitoring the camera feed for changes',
        'Alert staff in the immediate area to be vigilant',
        'Document the incident in the security log'
      ],
      'NORMAL': [
        'Maintain regular monitoring rotation',
        'Conduct routine security checks of the area',
        'Document any unusual observations',
        'Ensure equipment is functioning properly'
      ]
    };
    
    // Build analysis text based on status
    let analysisText = '';
    switch (cameraInfo.status) {
      case 'HIGH':
        analysisText = `Critical alert at ${cameraInfo.name} in ${schoolName}. Potential weapon detected requiring immediate security response. This appears to be a serious situation that may pose an immediate threat to school safety. Security personnel should follow emergency protocols and consider initiating lockdown procedures for nearby areas.`;
        break;
      case 'MEDIUM':
        analysisText = `Security alert at ${cameraInfo.name} in ${schoolName}. Suspicious activity detected that requires prompt investigation. The system has identified potential threatening behavior that should be addressed quickly. Security personnel should approach with caution and be prepared for a potential escalation.`;
        break;
      case 'LOW':
        analysisText = `Potential security concern at ${cameraInfo.name} in ${schoolName}. Low-confidence detection that requires verification. This may be a false positive, but security protocol recommends investigation to confirm. A single officer should be sufficient to assess the situation.`;
        break;
      default:
        analysisText = `Normal status at ${cameraInfo.name} in ${schoolName}. No threats detected. Routine monitoring recommended as part of standard security procedures. Area appears to be clear and functioning normally.`;
    }
    
    return {
      analysis: analysisText,
      responseTime: responseTimeMap[cameraInfo.status as keyof typeof responseTimeMap] || '5-7 minutes',
      threatLevel: threatLevelDescriptions[cameraInfo.status as keyof typeof threatLevelDescriptions] || 'Status unknown',
      recommendedActions: recommendedActionsMap[cameraInfo.status as keyof typeof recommendedActionsMap] || ['Investigate the situation', 'Report findings to security office'],
      timestamp: Date.now()
    };
  }
} 