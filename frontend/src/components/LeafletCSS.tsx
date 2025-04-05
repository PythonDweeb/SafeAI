'use client';

const LeafletCSS = () => {
  // This is a simple component that loads Leaflet CSS
  // We're not using useEffect with dynamic import as it was causing errors
  return (
    <link 
      rel="stylesheet" 
      href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css"
      integrity="sha256-kLaT2GOSpHechhsozzB+flnD+zUyjE2LlfWPgU04xyI="
      crossOrigin=""
    />
  );
};

export default LeafletCSS;
