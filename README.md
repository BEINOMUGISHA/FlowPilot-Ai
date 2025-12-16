
# FlowPilot AI 🚀

**FlowPilot AI** is a lightweight, intelligent operations assistant designed to streamline daily workflows for individuals and small teams. It leverages AI to capture tasks via voice or text, prioritizes work automatically, and helps manage team distribution.

## ✨ Features

### 🧠 AI-Powered Task Capture
- **Smart Parsing**: Type naturally (e.g., "Email Sarah report by Friday urgent") and FlowPilot extracts the title, priority, due date, and category.
- **Voice Input**: Record voice notes which are transcribed and parsed into structured tasks automatically using Gemini AI.

### 📊 Interactive Dashboard
- **Productivity Pulse**: Visual focus gauge tracking your daily flow score.
- **Unified Inbox**: Centralized feed for system notifications, messages, and alerts.
- **Visual Analytics**: D3.js powered charts for workload distribution and category breakdown.

### ⚡ Automation Engine
- **If-This-Then-That**: Create custom rules (e.g., "If task contains 'Client', set priority to 'High'").
- **Triggers**: React to task creation, completion, due dates, or keyword matches.

### 👥 Team Workspace
- **Workload Visibility**: Admins can view task distribution across the team.
- **Member Management**: Invite members and assign roles (Admin/Member).
- **Task Drill-down**: Click on any member to see their specific task list.

### 🎨 Modern UI/UX
- **Dark/Light Mode**: Fully responsive theme support.
- **PWA Ready**: Mobile-first design.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **AI Integration**: Google Gemini API (`@google/genai`)
- **Visualizations**: D3.js
- **State Management**: React Context API
- **Icons**: Lucide React

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Ensure you have a Google Gemini API Key.
   Create a `.env` file (if running locally with a backend) or ensure the process environment has `API_KEY`.
   *Note: This demo uses a client-side integration pattern.*

3. **Run Application**
   ```bash
   npm run dev
   ```

## 📱 Usage Guide

1. **Dashboard**: Start here to see your daily focus plan and capture new tasks.
2. **Tasks Page**: Toggle between "My Tasks" to see your assigned work (your "roles") or "Team Tasks" to see the big picture. Click the circle icon to "Submit" (complete) a task.
3. **Team Page**: (Admin Only) View team velocity. Click on "View Tasks" next to a member to audit their assigned workload.
4. **Automations**: Set up rules to automate housekeeping (e.g., auto-notify on overdue items).

## 📄 License

MIT
