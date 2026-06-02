# MediSort Robotic Simulation Core

MediSort is a React + Vite simulation for AI-assisted medical waste sorting. It models a robotic classification workflow where a specimen image is analyzed, assigned to a waste category, reviewed by an operator or supervisor, and routed into a bin with safety checks, telemetry, and audit logging.

## What the project does

- Classifies biomedical waste into categories such as infectious, sharps, pharmaceutical, pathological, radioactive, chemical, general, and mixed waste.
- Uses Google Gemini for image-based specimen classification when an API key is available.
- Supports preset specimen samples for offline demo and testing.
- Simulates a robotic arm, conveyor/mobility modes, thermal limits, collision interlocks, and emergency stop behavior.
- Tracks sorting history, overrides, bin fill levels, and operational analytics.
- Exports history as CSV and supervisor correction data as JSON for retraining workflows.

## Main screens

- Dashboard: upload or pick a specimen, classify it, review the result, and approve or reject the sort.
- Manual Control: adjust robot joints, gripper settings, and safety overrides in conveyor mode.
- History Log: search, filter, sort, override, clear, and export past classifications.
- Analytics: view category distribution, system health, override counts, and retraining feedback.

## Tech stack

- React 19
- Vite
- Gemini API integration for visual classification
- Plain CSS and inline UI styling for the simulator layout

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

4. Preview the production build:

```bash
npm run preview
```

## Environment setup

The app can read a Gemini API key from either:

- `VITE_GEMINI_API_KEY` in your local environment
- Browser local storage after entering the key in the app

If no key is present, the app still works with preset specimen mocks for demo use.

## Notes

- The robotic simulation scene is embedded from [public/medisort-simulation.html](public/medisort-simulation.html).
- The app uses [src/App.jsx](src/App.jsx) as the main controller for classification, sorting logic, history, and analytics.
- `test_models.js` is a small helper script for checking available Gemini models.
