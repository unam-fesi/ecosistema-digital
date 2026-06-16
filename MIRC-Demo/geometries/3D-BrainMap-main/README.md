# 3D Brain Anatomy Map

An interactive 3D brain anatomy visualization built with React and Three.js, inspired by BrainFacts.org's 3D brain model.

## Features

- **Interactive 3D Brain Model**: Explore the brain from all angles with smooth rotation, zoom, and pan controls
- **Clickable Brain Regions**: Each major brain structure is clickable and provides detailed information
- **Comprehensive Information**: Detailed descriptions and functions for 12 major brain regions
- **Modern UI**: Beautiful, responsive design with smooth animations and hover effects
- **Educational Content**: Based on scientific brain anatomy data

## Brain Regions Included

1. **Cerebral Cortex** - Higher-order thinking and consciousness
2. **Frontal Lobe** - Executive functions and decision making
3. **Parietal Lobe** - Sensory processing and spatial awareness
4. **Temporal Lobe** - Auditory processing and memory
5. **Occipital Lobe** - Visual processing
6. **Cerebellum** - Movement coordination and balance
7. **Brain Stem** - Basic life functions
8. **Hippocampus** - Memory formation
9. **Amygdala** - Emotion processing
10. **Thalamus** - Sensory relay station
11. **Hypothalamus** - Autonomic functions
12. **Corpus Callosum** - Interhemispheric communication

## Technologies Used

- **React 18** - Frontend framework
- **Three.js** - 3D graphics library
- **React Three Fiber** - React renderer for Three.js
- **React Three Drei** - Useful helpers for React Three Fiber
- **Styled Components** - CSS-in-JS styling

## Installation

1. Navigate to the project directory:
   ```bash
   cd "Brain map"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## How to Use

- **Rotate**: Click and drag to rotate the brain model
- **Zoom**: Use mouse wheel to zoom in and out
- **Pan**: Right-click and drag to pan the view
- **Select Regions**: Click on any colored brain region to view detailed information
- **Hover Effects**: Hover over regions to see them highlighted

## Project Structure

```
Brain map/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── BrainMap.js      # Main 3D brain visualization
│   │   └── InfoPanel.js     # Information display panel
│   ├── data/
│   │   └── brainRegions.js  # Brain anatomy data
│   ├── App.js              # Main application component
│   └── index.js            # React entry point
├── package.json
└── README.md
```

## Customization

### Adding New Brain Regions

To add new brain regions, edit `src/data/brainRegions.js`:

```javascript
{
  id: 'new-region',
  name: 'New Region',
  position: [x, y, z],  // 3D coordinates
  size: 0.5,           // Sphere size
  color: '#hexcolor',  // Region color
  description: 'Description of the region',
  functions: [
    'Function 1',
    'Function 2',
    // ... more functions
  ]
}
```

### Modifying Colors and Styling

- Brain region colors: Edit the `color` property in `brainRegions.js`
- UI styling: Modify styled components in `InfoPanel.js`
- 3D appearance: Adjust material properties in `BrainMap.js`

## Educational Use

This application is perfect for:
- Neuroscience education
- Medical training
- Psychology courses
- General brain anatomy learning
- Interactive presentations

## Live demo
https://3dbrainmap.com/

## Credits

- Inspired by [BrainFacts.org 3D Brain](https://www.brainfacts.org/3d-brain)
- Brain anatomy data based on scientific research
- Built with modern web technologies for optimal performance

## License

This project is open source and available under the MIT License. 
