import React, { useState } from 'react';
import { 
  X, 
  FlaskConical, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Cpu, 
  Eye, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { SAMPLE_SCENARIOS, SampleScenario } from '../data/sampleScenarios';
import { DetectionResult, ModelEngineMode, SafetyAlert } from '../types';
import { soundManager } from '../utils/audioAlert';

interface SampleGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  engineMode: ModelEngineMode;
  onApplyScenarioResult: (result: DetectionResult, snapshotUrl: string, zone: string) => void;
}

export const SampleGalleryModal: React.FC<SampleGalleryModalProps> = ({
  isOpen,
  onClose,
  engineMode,
  onApplyScenarioResult,
}) => {
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [customImageLoading, setCustomImageLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle selecting a pre-built benchmark scenario
  const handleSelectScenario = async (scenario: SampleScenario) => {
    setAnalyzingId(scenario.id);
    setStatusMessage(`Loading ${scenario.title}...`);

    try {
      // If Real AI mode is active, fetch the image, convert to base64, and run real vision detection!
      if (engineMode === 'REAL_GEMINI') {
        setStatusMessage('Sending frame to Gemini 3.8 Flash Vision for live object detection...');
        const imgResponse = await fetch(scenario.imageUrl);
        const blob = await imgResponse.blob();

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = reader.result as string;
          try {
            const apiRes = await fetch('/api/analyze-frame', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageBase64: base64Data,
                mimeType: 'image/jpeg',
                locationZone: scenario.zone,
              }),
            });

            const data = await apiRes.json();
            if (apiRes.ok && data.success && data.data) {
              const result: DetectionResult = {
                persons: data.data.persons || [],
                overallHazardLevel: data.data.overallHazardLevel || 'LOW',
                safetySummary: data.data.safetySummary || 'AI Vision analysis complete.',
                actionableAdvice: data.data.actionableAdvice,
                timestamp: new Date().toISOString(),
                latencyMs: data.latencyMs || 350,
                isRealAi: true,
                modelName: 'Gemini 3.8 Flash',
              };

              if (result.overallHazardLevel === 'HIGH') {
                soundManager.playCriticalBreach();
              } else if (result.overallHazardLevel === 'MEDIUM') {
                soundManager.playWarning();
              }

              onApplyScenarioResult(result, base64Data, scenario.zone);
              onClose();
            } else {
              alert(data.error || 'AI analysis failed. Check API key status.');
            }
          } catch (e: any) {
            console.error('Inference error:', e);
            alert('Failed to process image with AI: ' + e.message);
          } finally {
            setAnalyzingId(null);
            setStatusMessage(null);
          }
        };
        reader.readAsDataURL(blob);
      } else {
        // DEMO BENCHMARK MODE: Apply pre-calculated benchmark result directly
        setTimeout(() => {
          const result = {
            ...scenario.expectedResult,
            timestamp: new Date().toISOString(),
          };

          if (result.overallHazardLevel === 'HIGH') {
            soundManager.playCriticalBreach();
          } else if (result.overallHazardLevel === 'MEDIUM') {
            soundManager.playWarning();
          }

          onApplyScenarioResult(result, scenario.imageUrl, scenario.zone);
          setAnalyzingId(null);
          setStatusMessage(null);
          onClose();
        }, 300);
      }
    } catch (err: any) {
      console.error('Scenario error:', err);
      setAnalyzingId(null);
      setStatusMessage(null);
    }
  };

  // Handle custom user image upload
  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomImageLoading(true);
    setStatusMessage('Uploading and parsing image...');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64Data = evt.target?.result as string;
      try {
        if (engineMode === 'REAL_GEMINI') {
          setStatusMessage('Gemini 3.8 Flash Vision analyzing uploaded frame...');
          const apiRes = await fetch('/api/analyze-frame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64Data,
              mimeType: file.type || 'image/jpeg',
              locationZone: 'Zone A: Foundation & Deep Excavation',
            }),
          });

          const data = await apiRes.json();
          if (apiRes.ok && data.success && data.data) {
            const result: DetectionResult = {
              persons: data.data.persons || [],
              overallHazardLevel: data.data.overallHazardLevel || 'LOW',
              safetySummary: data.data.safetySummary || 'Custom image analyzed.',
              actionableAdvice: data.data.actionableAdvice,
              timestamp: new Date().toISOString(),
              latencyMs: data.latencyMs || 420,
              isRealAi: true,
              modelName: 'Gemini 3.8 Flash',
            };

            if (result.overallHazardLevel === 'HIGH') {
              soundManager.playCriticalBreach();
            } else if (result.overallHazardLevel === 'MEDIUM') {
              soundManager.playWarning();
            }

            onApplyScenarioResult(result, base64Data, 'Zone A: Foundation & Deep Excavation');
            onClose();
          } else {
            alert(data.error || 'Analysis failed. Make sure API key is configured.');
          }
        } else {
          // Fallback in demo mode
          alert('Switch to "Real AI Engine" in the top bar to analyze custom uploaded images with live vision detection.');
        }
      } catch (err: any) {
        console.error('Custom image processing error:', err);
        alert('Upload failed: ' + err.message);
      } finally {
        setCustomImageLoading(false);
        setStatusMessage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl my-6 flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  Test Bench & Benchmark Gallery
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Instant Verification
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Test hard hat & safety vest detection instantly without turning on your camera
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast Banner if processing */}
        {statusMessage && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-5 py-2 text-xs font-semibold text-amber-300 flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Custom File Upload Option */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-dashed border-slate-700 hover:border-amber-400/60 transition-colors flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-slate-900 text-amber-400 border border-slate-800">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Upload Your Own Construction Photo</h4>
                <p className="text-[11px] text-slate-400">
                  Select any JPG, PNG from your phone or PC to test real AI detection
                </p>
              </div>
            </div>

            <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shrink-0">
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>{customImageLoading ? 'Processing...' : 'Browse Image'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleCustomUpload}
                disabled={customImageLoading}
                className="hidden"
              />
            </label>
          </div>

          {/* Pre-configured Scenarios */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select a Ground-Truth Test Scenario
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SAMPLE_SCENARIOS.map((scenario) => {
                const isAnalyzingThis = analyzingId === scenario.id;
                const isHighRisk = scenario.expectedResult.overallHazardLevel === 'HIGH';
                const isMediumRisk = scenario.expectedResult.overallHazardLevel === 'MEDIUM';

                return (
                  <div
                    key={scenario.id}
                    className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all shadow-md group"
                  >
                    {/* Thumbnail Image */}
                    <div className="relative aspect-video bg-black overflow-hidden">
                      <img
                        src={scenario.imageUrl}
                        alt={scenario.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            isHighRisk
                              ? 'bg-red-500/80 text-white'
                              : isMediumRisk
                              ? 'bg-amber-500/80 text-slate-950'
                              : 'bg-emerald-500/80 text-white'
                          }`}
                        >
                          {scenario.expectedResult.overallHazardLevel} Risk
                        </span>
                      </div>
                    </div>

                    {/* Scenario Information */}
                    <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                          {scenario.title}
                        </h5>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {scenario.description}
                        </p>
                      </div>

                      {/* Expected Detection Stats */}
                      <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Workers: {scenario.expectedResult.persons.length}</span>
                        <span className={isHighRisk ? 'text-red-400 font-bold' : isMediumRisk ? 'text-amber-400' : 'text-emerald-400'}>
                          {isHighRisk ? 'Breach Expected' : isMediumRisk ? 'Partial Warning' : '100% Compliant'}
                        </span>
                      </div>
                    </div>

                    {/* Trigger Button */}
                    <div className="p-3 bg-slate-900/60 border-t border-slate-800">
                      <button
                        onClick={() => handleSelectScenario(scenario)}
                        disabled={analyzingId !== null}
                        className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-40"
                      >
                        {isAnalyzingThis ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <span>Run Test Bench</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
          <span className="text-[11px] text-slate-400">
            Mode:{' '}
            <b className="text-amber-400">
              {engineMode === 'REAL_GEMINI' ? 'Live Gemini Vision Inference' : 'Pre-calculated Benchmark'}
            </b>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
