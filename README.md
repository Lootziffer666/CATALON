# Catalon - The Agentic Design System (v2.0)

**Vision:** Eine "lebende" Entwicklungsumgebung mit A2UI Composer + OpenHands Execution Core + Self-Healing Logic.

---

## 🚀 Quickstart

```bash
# Projekt klonen
git clone https://github.com/Lootziffer666/Catalon.git
cd Catalon

# Abhängigkeiten installieren
npm install

# Entwicklung starten
npm run dev
```

---

## 🏗️ Architektur

### A2UI Composer (Die Brücke)
Bidirektionale Schnittstelle zwischen Mensch und KI. Erzeugt temporäre Vorschauen (Sandboxes) für Konzept-Verfeinerung. Verwendet shadcn/ui als atomare Bausteine.

### OpenHands Execution Layer (Das Gehirn)
Sobald ein Design abgenommen wurde, schreibt OpenHands den echten Code in das Dateisystem. Ermöglicht Self-Mutation des Tools selbst.

### Self-Healing & Layout-Reflow (Das Immunsystem)
Überwachung der UI-Integrität. Erkennt und korrigiert CSS-Konflikte autonom.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Animation:** Framer Motion
- **Agent Protocol:** A2UI
- **Execution:** OpenHands (Docker)
- **AI Models:** Claude 3.5 Sonnet / Ollama

---

## 📁 Struktur

```
catalon/
├── app/                    # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── atelier/           # A2UI Sandbox
│       └── page.tsx
├── components/
│   ├── ui/                # shadcn/ui Komponenten
│   └── catalon/           # Catalon-spezifisch
│       ├── A2UIComposer.tsx
│       ├── OpenHandsExecutor.tsx
│       └── SelfHealing.tsx
├── lib/
│   ├── a2ui-client.ts      # A2UI Kommunikation
│   ├── openhands.ts       # OpenHands Integration
│   └── self-healing.ts    # Self-Healing Logik
├── prd/                   # PRD Dokumentation
└── package.json
```

---

## 🎯 User Stories

### 1. Semantische Komposition
Input: "Ich brauche ein Steuerelement für die Lichtstimmung, das sich nach Picasso anfühlt."
→ A2UI Composer schlägt abstrakte Formen vor → Nutzer wählt → OpenHands generiert Code

### 2. Radikale Tool-Anpassung
Input: "Mach das Menü zu einer schwebenden Toolbar mit Glaseffekt."
→ OpenHands lokalisiert Komponente → schreibt auf Radix-UI um → applies Tailwind backdrop-blur

### 3. Smart Insertion & Reflow
Input: "Pack das neue Icon zwischen Header und Content."
→ Layout-Engine berechnet Platz → Self-Healing passt gap/padding an

---

## 🔧 Konfiguration

Environment Variables in `.env.local`:
```env
# OpenHands
OPENHANDS_API_URL=http://localhost:3000
OPENHANDS_API_KEY=your-key

# AI Models
ANTHROPIC_API_KEY=your-key
# Oder lokale Models via Ollama
OLLAMA_BASE_URL=http://localhost:11434
```

---

## 📝 Lizenz

MIT License
