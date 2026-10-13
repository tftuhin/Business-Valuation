# AI Agentic Market Brief & Valuation Engine

An autonomous AI agentic assistance system for M&A deal intelligence, market research, precedent transaction discovery, and institutional valuation report generation.

---

## 🌟 Key Features

1. **Multi-Stage AI Agent Pipeline**:
   - **01 Company Detective Agent**: Explores public company data, business model, core products, target customers, and technology moats.
   - **02 Market Dynamics Agent**: Analyzes TAM/SAM, sector growth drivers, regulatory environment, and competitive positioning.
   - **03 Deal Scout Agent**: Discovers and benchmarks recent comparable M&A and funding transactions with EV/Revenue and EV/EBITDA multiples.
   - **04 Valuation Engine**: Computes Lower, Central (median), and Strong-Buyer reference valuation cases and models an Enterprise-to-Equity Net Debt bridge.
   - **05 Institutional Report Synthesizer**: Formats a comprehensive 8-section M&A Market Brief adhering to investment banking and private equity standards.

2. **Multi-Provider AI Architecture (5 Supported Engines)**:
   - **Google Gemini**: Gemini 3.8 Flash, 3 Flash Preview, and Search Grounding.
   - **OpenAI / ChatGPT**: GPT-4o, GPT-4o mini, o3-mini, and structured JSON synthesis.
   - **Anthropic Claude**: Claude 3.7 Sonnet (Hybrid Reasoning), Claude 3.5 Sonnet, and Haiku.
   - **xAI Grok**: Grok 2, Grok Beta real-time market telemetry.
   - **Perplexity AI**: Sonar Pro & Sonar Reasoning with automatic real-time web citations on precedent deals.
   - **Intelligent Offline Simulator**: Zero-configuration domain synthesizer that runs instantly if no keys are provided.

3. **Hybrid Company Input Flow**:
   - Select from pre-loaded industry presets across Healthcare IT, FinTech, CyberSecurity, and B2B SaaS.
   - Add any custom or real-world target company with custom domain, sector, financial benchmarks, and diligence notes.

4. **Knowledge Base Grounding & Agent Skills**:
   - Upload or manage reference documents, diligence checklists, and valuation guidelines in the Knowledge Base modal.
   - Configure modular `.skill` files (e.g. Unit Economics Audit, Precedent Deal Calibrator, Strategic Synergy Evaluator).
   - Switch or upload custom Report Layout templates (Standard M&A, Quick Pitch Deck, PE Investment Memo).
   - Interactive Agent Chat assistant to query deal dynamics, adjust valuation ranges, or draft buyer profiles in real-time.

5. **Institutional Review & Governance Gate**:
   - Banker-in-the-loop audit checklist verifying Sources, Valuation Assumptions, and Strategic Buyer Fit before sign-off.
   - Export options: Print/PDF formatting, Markdown export, and single-click clipboard copy.

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Configure Gemini API Key
# Copy .env.example to .env.local and add your key from Google AI Studio:
# https://aistudio.google.com/apikey
cp .env.example .env.local

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:3002` if port 3000 is occupied).

---

## 📂 Core Project Architecture

- **`app/api/research/route.js`**: Server-side multi-agent orchestrator integrating `@google/genai` with search grounding tools and intelligent domain fallback.
- **`app/api/verify-key/route.js`**: Health-check endpoint testing Gemini API connectivity.
- **`app/agent-monitor.js`**: Interactive visual pipeline monitoring agent stages and real-time execution logs.
- **`app/agent-chat-view.js`**: Real-time conversational AI assistant for deal diligence and valuation QA.
- **`app/knowledge-base-modal.js`**: Grounding documents and diligence notes management.
- **`app/skills-modal.js`**: Agent capability extensions and evaluation playbooks (`.skill`).
- **`app/report-layouts-modal.js`**: Report layout template selector and parser.
- **`app/api-key-modal.js`**: In-app modal for testing and persisting Gemini API credentials.
- **`app/custom-company-modal.js`**: Modal for registering custom companies with bespoke metrics.
- **`app/market-brief-view.js`**: Main workflow view featuring financial models, precedent comps tables, and formatted brief preview.
- **`app/globals.css`**: shadcn-inspired design system tokens, dark/light modes, terminal logs, responsive layouts, and print styles.
