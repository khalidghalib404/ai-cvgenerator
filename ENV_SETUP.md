# Environment Setup

To use the Gemini API, you need to create a `.env` file in the root directory with your API key.

## Steps:

1. Create a file named `.env` in the root directory (same level as `package.json`)

2. Add the following content:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```

3. Get your Gemini API key:
   - Go to https://aistudio.google.com/app/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the key and paste it in your `.env` file

4. Start the development servers:
   ```bash
   # Install dependencies (if not already done)
   npm install
   
   # Start both frontend and backend
   npm run dev:all
   
   # OR start them separately:
   # Terminal 1: Backend server
   npm run server
   
   # Terminal 2: Frontend (Vite)
   npm run dev
   ```

## Important Notes:

- Never commit `.env` to version control (it's already in `.gitignore`)
- The API key is used server-side only in the Express backend for security
- The backend server runs on port 3001, frontend on port 3000
- Make sure your Gemini API key has sufficient quota for API calls


