
# MindCare AI - Local Development Guide

MindCare AI is a full-stack mental health copilot combining clinical severity engines, state-of-the-art AI inference pipelines, and cloud database persistence.

---

## Startup Instructions

To run the complete application locally, follow these two steps:

### Step 1: Start the FastAPI Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Activate your virtual environment:
   ```bash
   .\venv\Scripts\Activate.ps1   # Windows PowerShell
   ```
3. Run the development server:
   ```bash
   python -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
   ```
- **API Base Endpoint**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Database Status**: Connects directly to the **MongoDB Atlas** cloud cluster.

---

### Step 2: Start the Next.js Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Build and start the Next.js development server:
   ```bash
   npm run dev
   ```
- **Frontend Dashboard**: Access [http://localhost:3000](http://localhost:3000) to start your wellness assessment.

---

## Verifying the End-to-End Workflow

1. Open **[http://localhost:3000](http://localhost:3000)** (Home Page).
2. Click **Start Assessment** to open the Questionnaire.
3. Fill out steps 1-5 (Personal info, PHQ-9, GAD-7, Sleep/Stress, Lifestyle) and click **Submit Evaluation**.
4. The frontend will trigger a POST request to the **FastAPI Backend**, which saves the questionnaire, calculates risk scores, coordinates with the **IBM Granite AI** model, validates the structured response, and writes the assessment report to **MongoDB Atlas**.
5. You will be redirected to the **Results Page** showing your risk profile and Watsonx recommendations.
6. Click **History** to view all completed assessments and perform CRUD queries (like Delete).

---

## Running Test Suites

- **Backend tests**:
  ```bash
  cd backend
  python -m unittest discover tests
  ```
- **Frontend tests**:
  ```bash
  cd frontend
  node --test tests/api_service.test.js
  ```

---

## Optional: Local MongoDB Setup (Fallback)

If you prefer to run a local database instead of MongoDB Atlas:
1. Start the database containers from the **project root**:
   ```bash
   docker compose up -d
   ```
   This spins up a local MongoDB instance (`localhost:27017`) and Mongo Express dashboard (`localhost:8081`).
2. Update the `MONGODB_URL` in `backend/.env` to `mongodb://localhost:27017`.


---

## Nearby Mental Health Professionals Recommendation

The application includes an advanced, interactive post-assessment recommendation component that displays nearby psychiatrists, clinical psychologists, clinics, counseling centers, and psychiatric hospitals.

### Core Capabilities
* **Intelligent Severity Guidance**: Dynamically scales recommended resource lists, prioritizes category sorting (e.g. hospitals first for Severe cases), and adjusts guidance warnings depending on the patient's severity level.
* **Dual Places Providers**:
  * *Google Places API*: Checks for `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in environment variables. If present, it loads the Google client JS SDK dynamically.
  * *OpenStreetMap (OSM) Fallback*: If the API key is absent or empty, it automatically queries the OSM Overpass API and geocodes manual search inputs using OSM Nominatim.
* **Interactive Maps**: Integrates customized Google Maps (when API key is active) or Leaflet + OpenStreetMap interactive overlays client-side.
* **Manual Location Input**: Users can query GPS or type any address (City, Landmark, PIN code) to search another area.
* **Privacy Preserved**: Never transmits coordinates or locations to the backend; all geocoding matches are resolved on the frontend.

### Setup & Environment Variables
To enable Google Maps integrations, set the following variable in your local frontend configuration:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key-here
```
If this key is left undefined, the app will automatically load Leaflet + OpenStreetMap and function with zero API key dependencies.

#Architecture 
<img width="1536" height="1024" alt="ChatGPT Image Jul 23, 2026, 11_44_29 PM" src="https://github.com/user-attachments/assets/213ad593-82bc-4a77-b8b0-8f5561f92160" />

