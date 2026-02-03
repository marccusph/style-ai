# Style AI - Fashion Styling Assistant 👗✨

An AI-powered app that analyzes your fashion items and provides instant styling suggestions with shopping links.

## 🚀 Deploy to Vercel - SIMPLE VERSION

This is a **much simpler version** that should work right away!

### Step 1: Get Your Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Go to "API Keys" → "Create Key"
4. Copy your API key

### Step 2: Upload to GitHub

1. Go to https://github.com/new
2. Name it: `style-ai`
3. Make it **Public**
4. Click "Create repository"
5. Click "uploading an existing file"
6. Unzip the folder and drag ALL files:
   - `index.html`
   - `api/analyze.js`
   - `vercel.json`
   - `README.md`
7. Click "Commit changes"

### Step 3: Deploy on Vercel

1. Go to https://vercel.com
2. Click "Add New Project"
3. Select your `style-ai` repository
4. **BEFORE clicking Deploy:**
   - Scroll down to "Environment Variables"
   - Add:
     - Name: `ANTHROPIC_API_KEY`
     - Value: (your API key from Step 1)
   - Click "Add"
5. Click "Deploy"
6. Wait 1-2 minutes

### Step 4: Done! 🎉

Your app link will be: `https://style-ai.vercel.app` (or similar)

---

## What Changed?

This is a **simpler version** that uses:
- Plain HTML + React (no build step!)
- Vercel Serverless Functions (not Next.js)
- Should work immediately without any build issues

---

## 📱 How to Use

1. Open the app on your phone
2. Take a photo of any fashion item
3. Get AI styling suggestions
4. Shop the look!

---

## 🔧 Troubleshooting

If you still get "API key not configured":
1. Check Vercel → Settings → Environment Variables
2. Make sure `ANTHROPIC_API_KEY` is there
3. Redeploy from Deployments tab

---

Made with 💜 by Claude AI
