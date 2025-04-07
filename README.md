# SafeAI

SafeAI is a school security system that uses computer vision to detect weapons in security camera feeds and alert authorities in real-time.

## Demo

- https://devpost.com/software/safeai
- https://www.youtube.com/watch?v=fkReZUtE-ZI

## Overview

SafeAI provides a comprehensive solution for school safety by leveraging AI-powered weapon detection to identify potential threats before they escalate. The system processes camera feeds in real-time, displaying alerts and threat information on an intuitive dashboard interface.

### Core Features

- Real-time weapon detection in camera feeds
- Threat level categorization (NORMAL, LOW, MEDIUM, HIGH)
- Interactive map interface showing camera locations and status
- Security personnel dispatch and response management
- Multi-campus monitoring capabilities

## Technologies Used

**Frontend**:
- Next.js
- React & TypeScript
- Tailwind CSS
- Framer Motion

**Backend**:
- Flask
- Python

**AI/ML**:
- Moondream 2 model for image processing
- PyTorch (CUDA-optimized)
- Hardware acceleration for Apple Silicon (MPS), CUDA GPU, with CPU fallback
- Misc: OpenCV, Pillow, HF-Transfer, Gemini

## Getting Started

### Prerequisites

- Node.js
- Python 3.8+
- CUDA-capable GPU (optional but recommended)

### Installation

1. Clone this repository
2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

**IMPORTANT NOTE**:
If you are running on GPU, after installing requirements.txt, remove the default torch and install the torch for CUDA with:
```bash
pip uninstall torch torchvision torchaudio
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Running the Application

1. Start the backend:
```bash
cd backend
python app.py
```

2. In a separate terminal, start the frontend:
```bash
cd frontend
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Credits

Developed by:
- Vihaan Sharma
- Rikhil Tanugula
- Jason Shnaper
