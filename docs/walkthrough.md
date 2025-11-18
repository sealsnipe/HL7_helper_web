# Walkthrough: MARIS-HL7-Helper Web Port

I have successfully ported the core functionality of the MARIS-HL7-Helper WPF application to a modern web architecture.

## 1. Architecture Overview
The solution now consists of two main components:
-   **Backend (`HL7Helper.Api`)**: An ASP.NET Core 8 Web API that hosts the robust HL7 parsing logic (migrated from the WPF app) using `NHapi`. It exposes endpoints for parsing, generating, and managing templates.
-   **Frontend (`hl7-helper-web`)**: A Next.js (React) application using TypeScript and Tailwind CSS. It provides a modern, responsive user interface for editing HL7 messages.

## 2. Changes Implemented
### Backend
-   Created `HL7Helper.Api` project.
-   Migrated `Hl7ParsingService.cs` and `TemplateService.cs`.
-   Created DTOs (`SegmentDto`, `FieldDto`) to decouple API from internal logic.
-   Implemented API Controllers:
    -   `POST /api/parse`: Parses raw HL7 string to JSON.
    -   `POST /api/generate`: Generates raw HL7 string from JSON.
    -   `GET/POST /api/template`: Manages templates.
-   Enabled CORS for local development.

### Frontend
-   Created `hl7-helper-web` Next.js application.
-   Implemented `MessageEditor` component to display and edit segments/fields.
-   Integrated with the Backend API to parse and regenerate messages.
-   Styled with Tailwind CSS for a clean look.

## 3. How to Run

### Prerequisites
-   .NET 8 SDK
-   Node.js & npm

### Step 1: Start the Backend
1.  Open a terminal.
2.  Navigate to `HL7Helper.Api`:
    ```powershell
    cd HL7Helper.Api
    ```
3.  Run the API:
    ```powershell
    dotnet run
    ```
    The API will start (typically on `http://localhost:5125`).

### Step 2: Start the Frontend
1.  Open a new terminal.
2.  Navigate to `hl7-helper-web`:
    ```powershell
    cd hl7-helper-web
    ```
3.  Install dependencies (if not already done):
    ```powershell
    npm install
    ```
4.  Start the development server:
    ```powershell
    npm run dev
    ```
5.  Open your browser at `http://localhost:3000`.

## 4. Verification
-   **Builds**: Both the Backend (`dotnet build`) and Frontend (`npm run build`) compile successfully.
-   **Functionality**: The frontend is wired to call the backend API. You can paste an HL7 message, parse it, edit fields, and regenerate the raw message.
