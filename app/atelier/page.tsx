"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Wand2,
  Eye,
  Settings,
  Palette,
  Layout,
  Type,
  Sparkles,
  Loader2,
  Play,
  RotateCcw,
} from "lucide-react";

interface DesignConfig {
  radius: number;
  spacing: number;
  primaryColor: string;
  fontFamily: string;
  darkMode: boolean;
  animation: boolean;
}

const defaultConfig: DesignConfig = {
  radius: 8,
  spacing: 16,
  primaryColor: "#222",
  fontFamily: "Inter",
  darkMode: false,
  animation: true,
};

export default function Atelier() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState<DesignConfig>(defaultConfig);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("composer");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setGeneratedCode(`<div className="flex items-center justify-center p-8">
  <div className="rounded-lg border bg-card p-6 shadow-sm">
    <h2 className="text-xl font-semibold">AI Generated Component</h2>
    <p className="text-muted-foreground">${prompt}</p>
    <Button>Get Started</Button>
  </div>
</div>`);
    setIsGenerating(false);
  };

  const handleReset = () => {
    setConfig(defaultConfig);
    setPrompt("");
    setGeneratedCode(null);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            <span className="text-xl font-bold">A2UI Atelier</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:underline">
              Home
            </Link>
            <Link href="/docs" className="text-sm font-medium hover:underline">
              Docs
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="container flex h-[calc(100vh-4rem)] gap-6 py-6">
          <div className="w-80 shrink-0 overflow-y-auto rounded-lg border bg-card p-4">
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {["composer", "preview", "controls"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === "composer" && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Semantic Input</label>
                  <textarea
                    placeholder="Describe your UI component... e.g., 'A mood lighting control that feels like Picasso'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Style Preset</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="minimal">Minimal</option>
                    <option value="glass">Glassmorphism</option>
                    <option value="brutalist">Brutalist</option>
                    <option value="organic">Organic</option>
                    <option value="futuristic">Futuristic</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Complexity</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="simple">Simple</option>
                    <option value="medium">Medium</option>
                    <option value="complex">Complex</option>
                  </select>
                </div>

                <Button
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Design
                    </>
                  )}
                </Button>
              </div>
            )}

            {activeTab === "controls" && (
              <div className="space-y-6 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layout className="h-4 w-4" />
                      <span className="text-sm font-medium">Border Radius</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {config.radius}px
                    </span>
                  </div>
                  <input
                    type="range"
                    value={config.radius}
                    onChange={(e) =>
                      setConfig({ ...config, radius: parseInt(e.target.value) })
                    }
                    max={32}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layout className="h-4 w-4" />
                      <span className="text-sm font-medium">Spacing</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {config.spacing}px
                    </span>
                  </div>
                  <input
                    type="range"
                    value={config.spacing}
                    onChange={(e) =>
                      setConfig({ ...config, spacing: parseInt(e.target.value) })
                    }
                    max={48}
                    min={4}
                    step={4}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    <span className="text-sm font-medium">Primary Color</span>
                  </div>
                  <div className="flex gap-2">
                    {["#222", "#2563eb", "#dc2626", "#16a34a", "#9333ea"].map(
                      (color) => (
                        <button
                          key={color}
                          onClick={() =>
                            setConfig({ ...config, primaryColor: color })
                          }
                          className={`h-8 w-8 rounded-full border-2 ${
                            config.primaryColor === color
                              ? "border-primary"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      )
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    <span className="text-sm font-medium">Typography</span>
                  </div>
                  <select
                    value={config.fontFamily}
                    onChange={(e) =>
                      setConfig({ ...config, fontFamily: e.target.value })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Courier New">Courier New</option>
                    <option value="system-ui">System UI</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Dark Mode</span>
                  <button
                    onClick={() =>
                      setConfig({ ...config, darkMode: !config.darkMode })
                    }
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      config.darkMode ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                        config.darkMode ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Animation</span>
                  <button
                    onClick={() =>
                      setConfig({ ...config, animation: !config.animation })
                    }
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      config.animation ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                        config.animation ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleReset}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Controls
                </Button>
              </div>
            )}

            {activeTab === "preview" && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Generated Code</label>
                  <pre className="h-[300px] overflow-auto rounded-md bg-muted p-4 text-xs font-mono">
                    {generatedCode || "// Generated code will appear here..."}
                  </pre>
                </div>

                {generatedCode && (
                  <Button className="w-full" variant="secondary">
                    <Play className="mr-2 h-4 w-4" />
                    Run in Sandbox
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 rounded-lg border bg-muted/30">
            <div className="flex h-full flex-col">
              <div className="border-b px-4 py-2">
                <span className="text-sm font-medium">Live Preview</span>
              </div>
              <div className="flex-1 flex items-center justify-center p-8">
                {generatedCode ? (
                  <div
                    className="rounded-lg border bg-card p-8 shadow-sm transition-all"
                    style={{
                      borderRadius: `${config.radius}px`,
                      gap: `${config.spacing}px`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      fontFamily: config.fontFamily,
                    }}
                  >
                    <h2
                      className="text-xl font-semibold"
                      style={{ color: config.primaryColor }}
                    >
                      AI Generated Component
                    </h2>
                    <p className="text-muted-foreground text-center max-w-md">
                      {prompt}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Button
                        style={{
                          borderRadius: `${config.radius}px`,
                          backgroundColor: config.primaryColor,
                        }}
                      >
                        Get Started
                      </Button>
                      <Button
                        variant="outline"
                        style={{ borderRadius: `${config.radius}px` }}
                      >
                        Learn More
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Eye className="mx-auto h-12 w-12 opacity-50" />
                    <p className="mt-4">
                      Enter a description and generate a design to see the
                      preview
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
