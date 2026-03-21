# MediScan AI Deployment Guide (Frontend on Vercel, Backend via Ngrok)

This guide perfectly handles the "Hackathon Setup" where you host the heavy Machine Learning backend on your local laptop hardware, while still making the application accessible to judges globally via Vercel.

By using **Ngrok**, we establish a secure HTTPS tunnel to your local Python server, avoiding all "Mixed Content" errors from browsers and instantly giving judges secure access.

---

## Step 1: Push Code to GitHub
1. You have already pushed the latest code to your repository (`main` branch).
2. The `.gitignore` successfully excludes the massive `resnet50.onnx` file so GitHub doesn't reject your push.

---

## Step 2: Deploy Frontend on Vercel
1. Go to [Vercel.com](https://vercel.com/) and click **Add New...** -> **Project**.
2. Connect your GitHub and select your `MediScanAI` repository.
3. In the setup screen, modify the **Root Directory** and select `frontend`.
4. Leave the Framework Preset as **Vite**.
5. IMPORTANT: Add your Supabase environment variables!
   - `VITE_SUPABASE_URL` = (From Supabase -> Settings -> API)
   - `VITE_SUPABASE_ANON_KEY` = (From Supabase -> Settings -> API)
   - *Leave `VITE_API_URL` empty for just a second, we will add it soon!*
6. Click **Deploy**.

---

## Step 3: Run Your Backend Locally
Your backend must be running on your laptop for the AI to work. 

1. Open a terminal in `backend/`
2. Run your Flask app:
   ```bash
   python app.py
   ```
*(This is already running on port 5000)*

---

## Step 4: Expose Backend securely with Ngrok
Since your Flask app runs on `http://localhost:5000` (which is insecure HTTP), Vercel's HTTPS frontend cannot talk to it due to strict browser security policies. We fix this with Ngrok.

1. **Install Ngrok**:
   - Download from [ngrok.com/download](https://ngrok.com/download) or use Windows Package Manager in PowerShell: `winget install ngrok`.
2. **Authenticate**:
   - Sign up at Ngrok, grab your Auth Token, and run:
     ```bash
     ngrok config add-authtoken YOUR_TOKEN
     ```
3. **Start the Tunnel**:
   - In a new terminal, run:
     ```bash
     ngrok http 5000
     ```
4. **Copy the URL**:
   - Ngrok will show a "Forwarding" address like `https://a1b2c3d4.ngrok-free.app`. **Copy this secure HTTPS URL.**

*(Note: Every time you restart Ngrok on the free tier, this URL changes. You must leave this terminal window open while judges are reviewing!)*

---

## Step 5: Connect Vercel to Ngrok
1. Go back to your **Vercel** dashboard -> Settings -> **Environment Variables**.
2. Add a new variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://a1b2c3d4.ngrok-free.app` (Your exact Ngrok URL, *no trailing slash*)
3. Go to the **Deployments** tab and click **Redeploy** so Vercel builds the app with the new backend URL.

---

## Step 6: Fix Supabase Redirects
Because Vercel generated a new public domain for your frontend (e.g. `https://mediscan.vercel.app`), Supabase needs to be told it's a safe domain to redirect back to after Login.

1. Go to **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.
2. Add your Vercel URL (e.g., `https://mediscan.vercel.app`) to the **Redirect URLs** list.

---

## 🎉 Done!
Your fully functioning AI platform is live. Judges can open the Vercel link on their phones, upload an X-Ray, and the image data will tunnel directly to your laptop's powerful ONNX runtime for instant processing!
