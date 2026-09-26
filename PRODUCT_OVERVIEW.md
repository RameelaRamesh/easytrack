# EasyTrack: Product Overview

**EasyTrack** is a Multi-Tenant, Role-Based Software-as-a-Service (SaaS) platform designed for **Medical Billing Workforce & Operations Management**. It optimizes workflows, ensures complete data isolation across organizations, and provides specialized workspaces tailored to different organizational roles.

---

## 🏗️ Core Architectural Concepts

1. **Multi-Tenancy & Data Isolation**
   - Every organization operates as an isolated tenant.
   - Strict data isolation is enforced at the query level (via `TenantModelViewSet`). Data from one tenant is never visible to another, even if record IDs are guessed.
2. **Role-Based Access Control (RBAC)**
   - Strict, granular permission checks map specific views, actions, and dashboards to roles.
3. **Privacy-First Messaging**
   - Secure private chat conversations are fully restricted to their participants. Management (CEOs, HR, TLs) cannot inspect private chats they are not part of, and audit logs only track message metadata (actor, timestamp) without recording content.
4. **Resilient Technical Foundation**
   - A React/TypeScript/Tailwind CSS frontend backed by a Django REST Framework + PostgreSQL backend, with a fallback to SQLite for easy local development.

---

## 👥 Main Roles & Permissions

EasyTrack enforces 6 core roles, each with custom portals and operations:

### 1. 💼 CEO (Chief Executive Officer)
* **Core Role**: Business oversight, high-level analytics, and strategic operations.
* **Key Functionalities**:
  - Approves payroll and manages organization-wide compensation rules.
  - Monitors high-level recruitment and onboarding metrics.
  - Reviews client portfolios, project milestones, task queues, and quality trends.
  - Access to the **Executive Dashboard** (high-level financial & operational health).
  - Can publish announcements to the organization.

### 2. ⚙️ Operations Head
* **Core Role**: Portfolio management, client relations, process definition, and operational performance.
* **Key Functionalities**:
  - Full management of client portfolios, process definitions, project milestones, and SLA monitoring.
  - Oversees resource and work allocation.
  - Manages quality trends and coordinates with Team Leads.
  - Access to the **Operations Dashboard** and knowledge bases (SOPs/KB).

### 3. 👥 Team Lead (TL)
* **Core Role**: Operational execution, team supervision, quality tracking, and day-to-day coordination.
* **Key Functionalities**:
  - Manages work allocations and daily tasks (Task-style work board) for their team.
  - Supervises team attendance logs and reviews/recommends leave requests.
  - Manages escalation tasks and SLA alerts.
  - Conducts offboarding clearance checks.
  - Access to the **Team Dashboard** and knowledge base documentation.

### 4. 🤝 Human Resources (HR)
* **Core Role**: Talent acquisition, payroll execution, compliance, and employee lifecycle management.
* **Key Functionalities**:
  - Manages the recruitment pipeline, onboarding clearance, and offboarding checklists.
  - Maintains employee profiles, secure document vaults, and asset inventory.
  - Configures attendance, shift/break policies, and processes the payroll engine.
  - Manages and resolves HR helpdesk tickets.
  - Publishes updates to the Announcements Board.

### 5. 💻 Employee
* **Core Role**: Operations execution and self-management.
* **Key Functionalities**:
  - Focuses on personal work queues and executes daily tasks.
  - Interacts with the check-in/break/shift state machine to log daily productivity.
  - Submits leave requests, uploads secure documents, and requests HR support.
  - Reviews personal billing logs, performance goals, and self-assessments.
  - Performs reworks on audits flagged by the QA team.

### 6. 🔍 QA Auditor (IsQAEnabled = True)
* **Core Role**: Quality control and compliance auditing.
* **Key Functionalities**:
  - Access to the **QA Workspace**.
  - Audits completed work against compliance checklists.
  - Logs errors, classifies severity levels, and tracks overall quality compliance.

---

## 🛠️ Core Functional Modules

The platform is divided into 6 functional modules, mapped strictly by role:

* **HRMS**: Recruitment Pipeline, Onboarding Clearance, Employee Profiles, HR Helpdesk, Secure Documents, Asset Inventory.
* **Operations**: Client Portfolio, Process Definitions, Project Milestones, Work Allocation, Daily Tasks (Task-Style Kanban), Escalations & SLA Management.
* **Finance**: Payroll Engine (processing and approvals), Custom Compensation & Incentive Rules.
* **QA System**: QA Workspace, Auditing Checklists, Quality Trends & Severity Logs.
* **Knowledge**: Client Standard Operating Procedures (SOP) & Knowledge Base (KB) docs.
* **Communication**: Secure Private Chats & organization-wide Announcements Board.
* **Analytics**: Specialized Dashboards (Executive, Operations, and Team-level).
