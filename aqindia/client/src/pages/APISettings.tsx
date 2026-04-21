import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAPIKeys, addAPIKey, removeAPIKey, toggleAPIKey, type APIKeyEntry } from "@/lib/apiKeys";
import { useTranslation } from "@/i18n/provider";
import { SUPPORTED_LANGUAGES, Language } from "@/i18n/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Key, Plus, Trash2, CheckCircle2, Eye, EyeOff,
  RefreshCw, Zap, Shield, Info, Copy, ExternalLink, ToggleLeft, ToggleRight,
  Languages, Globe
} from "lucide-react";
import { toast } from "sonner";
import FloatingGuide from "@/components/FloatingGuide";
import { helpContent } from "@/lib/helpContent";
import { getActiveKeys } from "@/lib/apiKeys";

const API_PROVIDERS: {
  id: APIKeyEntry["provider"];
  name: string;
  description: string;
  url: string;
  docs: string;
  placeholder: string;
  icon: string;
  special?: boolean;
  getKeyUrl: string;
}[] = [
  {
    id: "waqi",
    name: "WAQI (World Air Quality Index)",
    description: "Global air quality monitoring network — free token",
    url: "https://waqi.info",
    docs: "https://aqicn.org/api",
    placeholder: "Enter WAQI token",
    icon: "🌐",
    getKeyUrl: "https://aqicn.org/api",
  },
  {
    id: "openmeteo",
    name: "Open-Meteo",
    description: "Free weather & air quality API — no key needed",
    url: "https://open-meteo.com",
    docs: "https://open-meteo.com/en/docs/air-quality-api",
    placeholder: "No key required (leave blank for public access)",
    icon: "🌤️",
    getKeyUrl: "https://open-meteo.com",
  },
  {
    id: "nasa",
    name: "NASA FIRMS / MERRA-2",
    description: "Satellite-based air quality and fire data",
    url: "https://firms.modaps.eosdis.nasa.gov",
    docs: "https://firms.modaps.eosdis.nasa.gov/api",
    placeholder: "Enter NASA API key (DEMO_KEY for testing)",
    icon: "🛸",
    getKeyUrl: "https://api.nasa.gov",
  },
  {
    id: "cpcb",
    name: "OpenAQ India (Backup for WAQI)",
    description: "BACKUP API: Automatically used when WAQI is disconnected. OpenAQ v3 provides CPCB data — free key required.",
    url: "https://openaq.org",
    docs: "https://docs.openaq.org",
    placeholder: "Enter OpenAQ v3 API key (backup when WAQI offline)",
    icon: "🇮",
    getKeyUrl: "https://explore.openaq.org/register",
  },
  {
    id: "gemini",
    name: "Google Gemini AI",
    description: "AI validation layer — verifies AQI data accuracy",
    url: "https://ai.google.dev",
    docs: "https://ai.google.dev/docs",
    placeholder: "Enter Gemini API key (AIza...)",
    icon: "🤖",
    special: true,
    getKeyUrl: "https://aistudio.google.com/app/apikey",
  },
];

function ProviderCard({ provider }: { provider: typeof API_PROVIDERS[0] }) {
  const { store, add, remove, toggle, refresh } = useAPIKeys();
  const keys = store[provider.id] ?? [];
  const [newKey, setNewKey] = useState("");
  const [showKeys, setShowKeys] = useState(false);
  const [adding, setAdding] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleAdd = async () => {
    if (!newKey.trim() && provider.id !== "openmeteo") {
      toast.error("Please enter a valid API key");
      return;
    }
    
    setTesting(true);
    
    // Test the API key before saving
    let isValid = true;
    let testMessage = "Key saved successfully";
    
    try {
      if (provider.id === "waqi") {
        // Test WAQI key with Delhi
        console.log("[WAQI Test] Testing key:", newKey.trim().substring(0, 8) + "***");
        const res = await fetch(`https://api.waqi.info/feed/delhi/?token=${newKey.trim()}`, { 
          signal: AbortSignal.timeout(5000) 
        });
        const data = await res.json();
        console.log("[WAQI Test] Response:", data.status, data.data?.aqi);
        
        if (data.status === "ok") {
          isValid = true;
          testMessage = `✅ WAQI key valid! AQI for Delhi: ${data.data?.aqi}`;
        } else if (data.status === "error") {
          isValid = false;
          testMessage = `❌ WAQI Error: ${data.data || "Invalid token"}. Check your token at aqicn.org/data-platform/token/`;
        } else {
          isValid = false;
          testMessage = `❌ Unexpected response: ${data.status}`;
        }
      } else if (provider.id === "gemini") {
        // Test Gemini key - FIXED: Try multiple FREE models
        console.log("[Gemini Test] Testing key:", newKey.trim().substring(0, 10) + "***");
        
        // Try multiple FREE models in order of preference
        const modelsToTry = [
          "gemini-2.5-flash",           // Newest FREE model
          "gemini-2.5-flash-lite",      // Cheapest FREE model  
          "gemini-1.5-flash",           // Previous FREE model
          "gemini-2.0-flash",           // Deprecated but still FREE
        ];
        
        let success = false;
        let lastError = "";
        let workingModel = "";
        
        for (const model of modelsToTry) {
          try {
            console.log(`[Gemini Test] Trying model: ${model}`);
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${newKey.trim()}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                contents: [{ parts: [{ text: "Say OK" }] }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 10 }
              }),
              signal: AbortSignal.timeout(8000)
            });
            
            const data = await res.json();
            console.log(`[Gemini Test] ${model} - HTTP Status:`, res.status);
            
            if (res.ok && data.candidates?.[0]?.content) {
              // Success!
              success = true;
              workingModel = model;
              console.log(`[Gemini Test] ✅ Model ${model} works!`);
              break;
            } else if (!res.ok) {
              lastError = data.error?.message || `HTTP ${res.status}`;
              console.log(`[Gemini Test] ${model} failed:`, lastError);
            }
          } catch (err) {
            lastError = err instanceof Error ? err.message : String(err);
            console.log(`[Gemini Test] ${model} error:`, err instanceof Error ? err.message : String(err));
          }
        }
        
        if (success) {
          isValid = true;
          testMessage = `✅ Gemini key validated! Using model: ${workingModel} (FREE tier)`;
          console.log(`[Gemini Test] Success with model: ${workingModel}`);
        } else {
          isValid = false;
          // Provide specific help based on error
          if (lastError.includes("country") || lastError.includes("billing")) {
            testMessage = `❌ Gemini: Free tier not available in your country. Enable billing at aistudio.google.com (free, no charge)`;
          } else if (lastError.includes("API key not valid") || lastError.includes("403")) {
            testMessage = `❌ Gemini: API key blocked or invalid. Create NEW key at aistudio.google.com/app/apikey (old keys get blocked if exposed)`;
          } else if (lastError.includes("429") || lastError.includes("quota")) {
            testMessage = `❌ Gemini: Rate limit exceeded. Wait 1 minute and try again. Free tier: 15 RPM`;
          } else {
            testMessage = `❌ Gemini Error: ${lastError}. Check console for details.`;
          }
          console.error("[Gemini Test] All models failed:", {
            last_error: lastError,
            models_tried: modelsToTry,
            key_prefix: newKey.trim().substring(0, 10) + "***"
          });
        }
      } else if (provider.id === "cpcb") {
        // Test OpenAQ v3 API key using direct fetch to our own server
        console.log("[OpenAQ Test] Testing v3 key via server:", newKey.trim().substring(0, 10) + "***");
        
        try {
          // Call our server's test endpoint directly (bypasses CORS, no React hooks needed)
          const response = await fetch("/api/trpc/apiTest.openaq", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              json: { apiKey: newKey.trim() }
            })
          });
          
          const data = await response.json();
          console.log("[OpenAQ Test] Server response:", data);
          
          // tRPC wraps response in result object
          const result = data.result?.data?.json;
          
          if (result && result.success) {
            isValid = true;
            testMessage = result.message;
            console.log("[OpenAQ Test] Success!", result);
          } else {
            isValid = false;
            testMessage = result?.message || `❌ Test failed: Unknown error`;
            console.error("[OpenAQ Test] Failed:", result);
          }
        } catch (err) {
          console.error("[OpenAQ Test] Client error:", err);
          isValid = false;
          testMessage = `❌ Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
        }
      }
    } catch (err) {
      isValid = false;
      testMessage = `❌ Connection test failed: ${err instanceof Error ? err.message : String(err)}. Check your internet connection.`;
      console.error(`[${provider.id.toUpperCase()} Test] Network error:`, err);
    }
    
    setTesting(false);
    
    if (isValid) {
      add(provider.id, newKey.trim() || "public", `${provider.name} Key ${keys.length + 1}`);
      setNewKey("");
      setAdding(false);
      toast.success(testMessage, { duration: 4000 });
    } else {
      toast.error(testMessage, { duration: 8000 });
    }
  };

  const handleRemove = (id: string) => {
    remove(provider.id, id);
    toast.success("Key removed");
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Copied to clipboard");
  };

  const activeKeys = keys.filter(k => k.isActive);

  return (
    <div className={cn(
      "glass-card rounded-xl p-4 border transition-colors",
      provider.special ? "border-purple-500/30" : "border-border",
      activeKeys.length > 0 && "border-green-500/20"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{provider.icon}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm" style={{ fontFamily: "Exo, sans-serif" }}>{provider.name}</h3>
              <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">Free</Badge>
              {provider.special && (
                <Badge variant="outline" className="text-xs text-purple-400 border-purple-500/30">
                  <Zap className="w-2.5 h-2.5 mr-1" />AI Validation
                </Badge>
              )}
              {activeKeys.length > 0 && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{provider.description}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <a href={provider.docs} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground">
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </a>
        </div>
      </div>

      {/* Existing keys */}
      {keys.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {keys.map(k => (
            <div key={k.id} className="flex items-center gap-2 p-2 rounded-lg bg-accent/30">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono-data text-muted-foreground truncate">
                    {showKeys ? k.key : k.key.slice(0, 8) + "•".repeat(16) + k.key.slice(-4)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs" style={{
                    borderColor: k.isActive ? "#22C55E" : "#6B7280",
                    color: k.isActive ? "#22C55E" : "#6B7280"
                  }}>
                    {k.isActive ? "active" : "disabled"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Uses: {k.usageCount}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setShowKeys(!showKeys)} className="p-1 text-muted-foreground hover:text-foreground">
                  {showKeys ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
                <button onClick={() => copyKey(k.key)} className="p-1 text-muted-foreground hover:text-foreground">
                  <Copy className="w-3 h-3" />
                </button>
                <button onClick={() => toggle(provider.id, k.id)} className="p-1 text-muted-foreground hover:text-blue-400">
                  {k.isActive ? <ToggleRight className="w-3.5 h-3.5 text-green-400" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => handleRemove(k.id)} className="p-1 text-muted-foreground hover:text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add key form */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 mb-2 overflow-hidden"
          >
            <Input
              type="password"
              placeholder={provider.placeholder}
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              className="h-8 text-sm bg-background border-border font-mono-data"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={testing} className="gap-1 h-7 text-xs">
                {testing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                {testing ? "Saving..." : "Save Key"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setNewKey(""); }} className="h-7 text-xs">
                Cancel
              </Button>
              <a href={provider.getKeyUrl} target="_blank" rel="noopener noreferrer" className="ml-auto">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-blue-400">
                  Get key <ExternalLink className="w-3 h-3" />
                </Button>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!adding && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAdding(true)}
          className="gap-1 h-7 text-xs w-full"
        >
          <Plus className="w-3 h-3" />
          Add {provider.name} Key {keys.length > 0 && `(${keys.length} saved)`}
        </Button>
      )}
    </div>
  );
}

export default function APISettings() {
  const { store, hasGemini } = useAPIKeys();
  const { language, setLanguage, t } = useTranslation();
  const totalKeys = Object.values(store).flat().filter(k => k.isActive).length;

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    const langName = SUPPORTED_LANGUAGES.find(l => l.code === lang)?.nativeName || lang;
    toast.success(`Language changed to ${langName}`, { duration: 2000 });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Exo, sans-serif" }}>{t('settings.title', 'API Key Settings')}</h1>
            <p className="text-sm text-muted-foreground">{t('settings.subtitle', 'Manage data sources and AI validation keys')}</p>
          </div>
          <FloatingGuide content={helpContent.apiSettings} />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Key className="w-3 h-3" />
            {totalKeys} {t('settings.activeKeys', 'active keys')}
          </Badge>
          {hasGemini && (
            <Badge variant="outline" className="gap-1 text-purple-400 border-purple-500/30">
              <Zap className="w-3 h-3" />
              {t('settings.aiValidationOn', 'AI Validation ON')}
            </Badge>
          )}
        </div>
      </div>

      {/* Language Settings Section */}
      <div className="glass-card rounded-xl p-4 border border-blue-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily: "Exo, sans-serif" }}>{t('settings.language', 'Language / भाषा')}</h2>
            <p className="text-sm text-muted-foreground">{t('settings.languageSubtitle', 'Choose your preferred language for the interface')}</p>
          </div>
          <Badge variant="outline" className="ml-auto gap-1">
            <Languages className="w-3 h-3" />
            {SUPPORTED_LANGUAGES.length} {t('settings.languages', 'Languages')}
          </Badge>
        </div>

        {/* Current Language Display */}
        <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {SUPPORTED_LANGUAGES.find(l => l.code === language)?.flag}
            </span>
            <div>
              <p className="text-sm font-semibold">
                {t('settings.currentLanguage', 'Current')}: {SUPPORTED_LANGUAGES.find(l => l.code === language)?.nativeName} ({language.toUpperCase()})
              </p>
              <p className="text-xs text-muted-foreground">{t('settings.preferenceSaved', 'Your preference is saved automatically')}</p>
            </div>
          </div>
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isActive = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border transition-all hover:scale-105",
                  isActive
                    ? "bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/20"
                    : "bg-accent/30 border-border hover:border-blue-500/50"
                )}
              >
                <span className="text-xl">{lang.flag}</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold" style={{ fontFamily: "Exo, sans-serif" }}>
                    {lang.nativeName}
                  </p>
                  <p className="text-xs text-muted-foreground">{lang.name}</p>
                </div>
                {isActive && (
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <Info className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-green-300 font-semibold">{t('settings.multiLanguageSupport', 'Multi-Language Support')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('settings.multiLanguageDesc', 'This application supports 10 Indian languages + English. Your language preference is saved in your browser and will be remembered on your next visit.')}
            </p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-300">{t('settings.securityNotice', 'AES-256 Client-Side Encryption')}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('settings.securityDesc', 'All API keys are encrypted with AES-256 and stored in your browser\'s localStorage only. Keys never leave your device. Load balancing automatically switches between multiple keys for the same provider.')}
          </p>
        </div>
      </div>

      {/* Gemini AI Notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
        <Zap className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-purple-300">
            {t('settings.geminiValidation', 'Gemini AI Validation')} {hasGemini ? `— ${t('settings.geminiActive', 'ACTIVE ✓')}` : `— ${t('settings.geminiNotConfigured', 'Not configured')}`}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hasGemini
              ? t('settings.geminiActiveDesc', 'All incoming AQI data is being verified by Gemini AI before display. Erroneous values are filtered out automatically.')
              : t('settings.geminiInactiveDesc', 'Add a Gemini API key to enable AI-powered data validation. Without it, raw API data is displayed with standard range checks only.')}
          </p>
          {!hasGemini && (
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:text-purple-300 mt-1 inline-flex items-center gap-1">
              Get free Gemini API key <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Load Balancing Info */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
        <Info className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-green-300">{t('settings.loadBalancing', 'Intelligent Multi-Key Load Balancing')}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('settings.loadBalancingDesc', 'Add multiple keys per provider for automatic load balancing and data redundancy. If one source lacks data for a city, the system fetches from another automatically. Each data card shows the source API name used.')}
          </p>
        </div>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {API_PROVIDERS.map(provider => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </div>

      {/* Quick Guide */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "Exo, sans-serif" }}>
          {t('settings.quickSetup', 'Quick Setup Guide')}
        </h3>
        <div className="space-y-2">
          {[
            { step: "1", text: "Get a free WAQI token at aqicn.org/api (instant email delivery)", color: "#3B82F6" },
            { step: "2", text: "Get a free Gemini key at aistudio.google.com (Google account required)", color: "#8B5CF6" },
            { step: "3", text: "Open-Meteo works without any key — just click Add and leave blank", color: "#10B981" },
            { step: "4", text: "Add multiple keys per provider for load balancing and redundancy", color: "#F59E0B" },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-3 p-2.5 rounded-lg bg-accent/30">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: item.color + "30", color: item.color }}>
                {item.step}
              </div>
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
