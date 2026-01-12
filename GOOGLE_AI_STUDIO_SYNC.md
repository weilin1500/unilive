# Google AI Studio Sync Guide

This document explains how to keep your local project synchronized with Google AI Studio.

## Project Information

- **AI Studio URL**: https://ai.studio/apps/drive/1_ExrvFiORYkWXX2shNgqjI4aFL11L13T
- **Project ID**: 1_ExrvFiORYkWXX2shNgqjI4aFL11L13T
- **Local Project**: unilive

## Configuration Files

### 1. API Key Configuration

The API key is stored in `.env.local` and is automatically loaded by `vite.config.ts`:

```env
GEMINI_API_KEY=AIzaSyAwhGThVaYmgTAi-02XgIW2VM0hCqgrKlM
```

**Important**: Keep your API key synchronized between:
- Local `.env.local` file
- Google AI Studio console settings
- Google Cloud Platform (GCP) project credentials

### 2. Project Metadata

The `metadata.json` file contains project metadata that Google AI Studio uses:

```json
{
  "name": "unilive",
  "description": "A comprehensive social media super-app...",
  "aiStudioProjectId": "1_ExrvFiORYkWXX2shNgqjI4aFL11L13T",
  "aiStudioUrl": "https://ai.studio/apps/drive/1_ExrvFiORYkWXX2shNgqjI4aFL11L13T"
}
```

## Sync Process

### Syncing Changes FROM Local to Google AI Studio

1. **Code Changes**: 
   - Make changes to your local codebase
   - Commit changes to Git (if using version control)
   - Upload/download project files through Google AI Studio web interface if needed

2. **API Key Updates**:
   - Update `.env.local` locally
   - Update the API key in Google AI Studio console settings
   - Restart your local dev server: `npm run dev`

3. **Configuration Changes**:
   - Update `metadata.json` locally
   - Ensure changes are reflected in Google AI Studio project settings

### Syncing Changes FROM Google AI Studio to Local

1. **API Key Changes**:
   - Get the new API key from Google AI Studio
   - Update `.env.local` file:
     ```bash
     echo "GEMINI_API_KEY=YOUR_NEW_KEY" > .env.local
     ```
   - Restart your dev server

2. **Project Configuration**:
   - Review changes in Google AI Studio console
   - Update local `metadata.json` if project settings changed
   - Pull any code changes if using version control

## Best Practices

1. **Version Control**: 
   - Use Git to track code changes
   - Commit frequently with descriptive messages
   - Never commit `.env.local` (already in `.gitignore`)

2. **API Key Management**:
   - Keep API keys secure and never commit them
   - Use the same API key in both environments for consistency
   - Regenerate keys in Google AI Studio if compromised

3. **Environment Variables**:
   - Always use `.env.local` for local development
   - Document required environment variables in README
   - Use `vite.config.ts` to properly load environment variables

4. **Testing**:
   - Test changes locally before deploying
   - Verify API functionality after key updates
   - Check both environments for consistency

## Troubleshooting

### API Key Not Working

1. Verify the key in `.env.local` matches Google AI Studio
2. Check that `vite.config.ts` is loading the environment variable correctly
3. Restart the dev server after changing `.env.local`
4. Verify the API key has proper permissions in Google Cloud Console

### Changes Not Reflecting

1. Ensure you've saved all files
2. Restart the dev server: `npm run dev`
3. Clear browser cache if testing in browser
4. Check that environment variables are loaded correctly

### Sync Issues

1. Compare `metadata.json` with Google AI Studio project settings
2. Verify API key is the same in both environments
3. Check Git status for uncommitted changes
4. Review recent changes in both environments

## Quick Reference Commands

```bash
# Start development server
npm run dev

# Check Git status
git status

# View current API key (first line only, secure)
head -1 .env.local

# Check metadata configuration
cat metadata.json

# Restart dev server (after env changes)
npm run dev
```
