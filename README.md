# Ola Maps Search - React Frontend

A React application for searching places using Ola Maps API with interactive map display.

## Features

- 🔍 Search for places using Ola Maps Autocomplete API
- 🗺️ Interactive 2D map display using Ola Maps Web SDK
- 📍 Display essential details for selected places
- 🎨 Modern, responsive UI

## Setup

### Install Dependencies

```bash
npm install
```

### Environment Variables

Make sure your `.env` file has the Ola Maps API key:

```
OLA_MAPS_API_KEY=your_api_key_here
```

### Run the Application

1. Start the backend server:
```bash
npm run server
```

2. In a new terminal, start the React frontend:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`
The backend server runs on `http://localhost:8000`

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── SearchBar.jsx      # Search input component
│   │   ├── ResultList.jsx     # List of search results
│   │   └── MapDisplay.jsx     # Ola Maps integration
│   ├── App.jsx                # Main app component
│   ├── main.jsx               # React entry point
│   └── index.css              # Global styles
├── server.js                  # Express backend
├── vite.config.js             # Vite configuration
└── package.json
```

## Usage

1. Enter a place name in the search bar
2. Click "Search" or press Enter
3. Select a result from the list to view it on the map
4. View essential details in the bottom panel

## Technologies

- React 18
- Vite
- Ola Maps Web SDK
- Express.js
- Axios

