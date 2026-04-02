# ResuAI - AI-Powered Resume Builder

An intelligent resume builder powered by Google Gemini AI, built with React, Vite, and Express.

## Features

- 🤖 AI-powered resume generation using Google Gemini API
- 🎨 Beautiful, responsive design
- 📱 Mobile-friendly interface
- 🔒 Secure API key handling on the backend
- ⚡ Fast performance with Vite
- 🎯 ATS-friendly resume formats
- ✏️ Manual resume editing with full control
- 📄 Complete resume sections (Personal Info, Summary, Experience, Education, Skills)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
GEMINI_MODEL=gemini-1.5-flash
```

### 3. Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in your `.env` file

### 4. Run the Development Servers

You have two options:

**Option 1: Run both servers together (Recommended)**
```bash
npm run dev:all
```

**Option 2: Run servers separately**

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The backend API server runs on port 3001, and the frontend runs on port 3000.

## Project Structure

```
├── server.js              # Express backend server
├── App.tsx                # Main React application
├── components/            # React components
│   ├── Editor.tsx         # Resume editor component
│   ├── ResumePreview.tsx  # Resume preview component
│   └── UIComponents.tsx   # Reusable UI components
├── services/              # Frontend API services
│   └── aiService.ts       # API client for backend
├── pages/                 # (Legacy Next.js structure - not used)
├── styles/                # CSS styles
└── types.ts               # TypeScript types
```

## Key Features

### Security
- API keys stored securely on the server side (Express backend)
- No sensitive data exposed to the frontend
- Proper error handling and validation
- CORS protection

### Architecture
- Clean separation between frontend (Vite + React) and backend (Express)
- RESTful API design
- Type-safe API calls
- Proxy configuration for seamless API calls

### Performance
- Server-side API calls reduce client-side load
- Optimized bundle size with Vite
- Fast hot module replacement

## API Endpoints

All endpoints are served by the Express backend on port 3001:

- `POST /api/generate-resume` - Generate a complete resume with AI
- `POST /api/generate-summary` - Generate a professional summary
- `POST /api/improve-text` - Improve resume text with AI
- `GET /api/health` - Health check endpoint

## Usage

1. **Sign up/Login** - Create an account or sign in
2. **Choose AI Generation** - Click "Start Building" and select AI generation
3. **Fill Details** - Enter your job title, experience level, and context
4. **Generate** - Let AI create your resume
5. **Edit & Customize** - Fine-tune your resume in the editor
6. **Download** - Export your resume as PDF

## Troubleshooting

### API Key Issues
- Make sure your Gemini API key is valid and has sufficient quota
- Check that the key is properly set in `.env` file (not `.env.local`)
- Restart both servers after changing environment variables
- Verify the API key at: https://aistudio.google.com/app/apikey

### Server Connection Issues
- Ensure the backend server is running on port 3001
- Check that the frontend proxy is configured correctly in `vite.config.ts`
- Verify CORS is enabled in `server.js`

### Build Issues
- Ensure all dependencies are installed: `npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check for TypeScript errors: `npm run build`

### Common Errors

**"GEMINI_API_KEY is missing"**
- Create a `.env` file in the root directory
- Add `GEMINI_API_KEY=your_key_here`

**"Failed to fetch" or CORS errors**
- Make sure the backend server is running: `npm run server`
- Check that the backend is on port 3001

**"Model not found"**
- The default model is `gemini-1.5-flash`
- You can change it by setting `GEMINI_MODEL` in `.env`
- Available models: `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash-exp`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.