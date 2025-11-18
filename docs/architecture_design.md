# Architecture Design: MARIS-HL7-Helper Web Port

## 1. Executive Summary
This document outlines the architecture for porting the **MARIS-HL7-Helper** WPF application to a hosted web application. The goal is to provide the same HL7 parsing, editing, and validation capabilities in a browser-based environment, accessible from any device.

## 2. High-Level Architecture
The system will use a **Hybrid Architecture** combining a modern React-based frontend with a robust .NET backend to leverage existing business logic.

### 2.1. Technology Stack
-   **Frontend**: **Next.js** (React Framework)
    -   *Why*: Industry standard for React apps, excellent performance, easy deployment (Vercel/Azure), and strong ecosystem.
    -   *Language*: TypeScript.
    -   *Styling*: Tailwind CSS (for rapid, modern UI development).
-   **Backend**: **ASP.NET Core Web API** (.NET 8)
    -   *Why*: Allows direct reuse of the existing `NHapi`-based parsing logic (`Hl7ParsingService.cs`). Porting this complex logic to Node.js would be error-prone and redundant.
    -   *Language*: C#.
-   **Communication**: RESTful API (JSON).
-   **Hosting**:
    -   **Frontend**: Vercel, Netlify, or Azure Static Web Apps.
    -   **Backend**: Azure App Service, AWS Elastic Beanstalk, or Docker Container.

## 3. Component Design

### 3.1. Frontend (Next.js)
The frontend will replicate the WPF `MainWindow` functionality but adapted for the web.

-   **Pages**:
    -   `/`: Dashboard / Upload area.
    -   `/editor`: Main HL7 editor view (Segments/Fields).
    -   `/templates`: Template management.
-   **Components**:
    -   `Hl7Viewer`: A tree/list view component to display Segments and Fields.
    -   `FieldEditor`: Input component for editing field values.
    -   `ValidationPanel`: Displays validation errors/warnings.
-   **State Management**: React Context or Zustand for managing the loaded message state.

### 3.2. Backend (ASP.NET Core)
The backend will expose the core logic as stateless API endpoints.

-   **Controllers**:
    -   `ParseController`:
        -   `POST /api/parse`: Receives raw HL7 text/file. Returns a structured JSON object (Segments -> Fields).
    -   `GenerateController`:
        -   `POST /api/generate`: Receives structured JSON. Returns raw HL7 text.
    -   `TemplateController`:
        -   `GET /api/templates`: Lists available templates.
        -   `POST /api/templates`: Saves a new template.
-   **Services**:
    -   `Hl7ParsingService`: Ported from WPF app.
    -   `TemplateService`: Ported from WPF app (adapted to use database or cloud storage instead of local file system).

### 3.3. Data Model (JSON Contract)
The API will return data similar to the WPF ViewModels but serialized as JSON.

```json
{
  "segments": [
    {
      "name": "MSH",
      "fields": [
        { "position": 1, "value": "|", "isEditable": false },
        { "position": 2, "value": "^~\\&", "isEditable": false },
        ...
      ]
    },
    ...
  ],
  "validationErrors": []
}
```

## 4. Deployment & Security
-   **Authentication**: Integrate with an Identity Provider (Auth0, Azure AD, or NextAuth.js) if user-specific templates or secure access is required.
-   **Storage**:
    -   Templates: Store in a database (SQL/NoSQL) or Blob Storage (Azure Blob/S3) instead of local disk.
    -   Session: Redis (optional) if stateful editing is needed, though stateless (sending full state back and forth) is simpler for MVP.

## 5. Migration Strategy
1.  **Extract Core Logic**: Move `Hl7ParsingService`, `TemplateService`, and related models to a separate .NET Class Library (`HL7Helper.Core`).
2.  **Create API**: Build the ASP.NET Core API referencing `HL7Helper.Core`.
3.  **Build Frontend**: Develop the Next.js app to consume the API.
