# Debugging Guide

## Issues Fixed

1. **Favicon 404 Error**: Added a data URI favicon to prevent 404 errors
2. **Map Not Loading**: 
   - Changed from npm import to CDN loading (more reliable)
   - Added comprehensive debugging logs
   - Added SDK loading detection with retry mechanism

## Debugging Features Added

### Console Logs

All components now have detailed console logging with prefixes:
- `[App]` - Main app component logs
- `[MapDisplay]` - Map component logs

### Map Initialization Debugging

The map component logs:
- When useEffect is triggered
- Container availability
- SDK availability checks
- Initialization steps
- Map instance creation
- Available map methods
- Error details with stack traces

### Search Debugging

The search function logs:
- Query received
- Request details
- Response status and data
- Error details

## How to Debug

1. **Open Browser Console** (F12 or Right-click → Inspect → Console)

2. **Check for SDK Loading**:
   - Look for `[MapDisplay] SDK already available` or `[MapDisplay] SDK not available`
   - If SDK not found, check Network tab for `olamaps-web-sdk.umd.js` loading

3. **Check Map Initialization**:
   - Look for `[MapDisplay] Map initialized successfully`
   - Check for any error messages

4. **Check Search Functionality**:
   - Look for `[App] handleSearch called`
   - Check response status and data

## Common Issues

### SDK Not Loading
- **Symptom**: `Ola Maps SDK not loaded` error
- **Check**: Network tab for CDN script loading
- **Solution**: Check internet connection, CDN availability

### Map Container Not Available
- **Symptom**: `Map container not available yet`
- **Check**: React component mounting
- **Solution**: Usually resolves automatically on next render

### API Key Issues
- **Symptom**: Map loads but shows errors
- **Check**: Console for API key related errors
- **Solution**: Verify API key in MapDisplay.jsx

## Network Tab Checks

1. Check if `olamaps-web-sdk.umd.js` loads successfully (status 200)
2. Check if style JSON loads: `default-light-standard/style.json`
3. Check if tile requests are made (should see requests to `api.olamaps.io/tiles`)

## Browser Compatibility

The Ola Maps SDK should work in:
- Chrome (recommended)
- Firefox
- Safari
- Edge

If issues persist, try:
1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Check browser console for specific errors

