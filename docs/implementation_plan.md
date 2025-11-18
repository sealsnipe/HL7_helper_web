# Implementation Plan - Web App Port

This plan outlines the steps to port the MARIS-HL7-Helper WPF application to a hosted web application using Next.js and ASP.NET Core.

## User Review Required
> [!IMPORTANT]
> **Architecture Decision**: This plan assumes a **Next.js Frontend** + **ASP.NET Core Backend** architecture. This allows reusing the existing `NHapi` parsing logic without rewriting it in JavaScript.
>
> **Storage**: For the "Hosted" aspect, we need to decide where to store Templates. This plan assumes a simple **File System** storage for the MVP (if running in a container with a volume) or **In-Memory** for demo purposes, but for production, a Database or Blob Storage is recommended.

## Proposed Changes

### Phase 1: Backend Implementation (ASP.NET Core)
Create a new ASP.NET Core Web API project to host the parsing logic.

#### [NEW] `HL7Helper.Api` Project
-   **Setup**: Initialize new .NET 8 Web API project.
-   **Dependencies**: Add `NHapi` NuGet package.
-   **Core Logic Migration**:
    -   Copy `Hl7ParsingService.cs` and `TemplateService.cs` from the WPF project.
    -   Refactor `SegmentViewModel` and `FieldViewModel` into DTOs (Data Transfer Objects) suitable for JSON serialization (remove `INotifyPropertyChanged`).
-   **Endpoints**:
    -   `POST /api/parse`: Accepts HL7 string, returns `MessageDto`.
    -   `POST /api/generate`: Accepts `MessageDto`, returns HL7 string.
    -   `GET /api/templates`: Returns list of templates.

### Phase 2: Frontend Implementation (Next.js)
Create a new Next.js application for the UI.

#### [NEW] `hl7-helper-web` (Next.js App)
-   **Setup**: `npx create-next-app@latest` with TypeScript and Tailwind CSS.
-   **UI Components**:
    -   `FileUpload`: Component to upload `.hl7` or `.txt` files.
    -   `MessageEditor`: Main view rendering the segments and fields.
    -   `SegmentRow`: Renders a single segment.
    -   `FieldInput`: Renders a single field input.
-   **Integration**:
    -   Implement API client functions (`parseMessage`, `generateMessage`).
    -   Connect UI state to API calls.

### Phase 3: Integration & Polish
-   **Validation**: Display validation errors returned by the backend.
-   **Styling**: Apply a modern, clean design using Tailwind CSS.
-   **Docker**: Create `Dockerfile` and `docker-compose.yml` to run both services together.

## Verification Plan

### Automated Tests
-   **Backend Unit Tests**: Verify that `Hl7ParsingService` in the API project correctly parses sample messages and returns expected DTOs.
    -   *Command*: `dotnet test HL7Helper.Api.Tests`
-   **Frontend Component Tests**: Use Jest/React Testing Library to verify that `MessageEditor` renders segments correctly.

### Manual Verification
1.  **Start System**: Run `docker-compose up` (or start both projects manually).
2.  **Load File**: Open the web app, upload a sample HL7 file (e.g., `ADT_A01.hl7`).
3.  **Verify Display**: Check that segments (MSH, PID, etc.) are listed correctly.
4.  **Edit & Update**: Change a field value (e.g., PID-5 Patient Name), click "Update/Regenerate", and verify the raw HL7 text updates.
5.  **Templates**: Try loading a template and verify fields are marked editable/read-only as expected.
