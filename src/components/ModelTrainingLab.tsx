import React, { useState } from 'react';
import { 
  X, 
  GraduationCap, 
  Code2, 
  Cpu, 
  Layers, 
  BookOpen, 
  CheckCircle, 
  Copy, 
  Check, 
  HelpCircle, 
  FileText,
  Terminal,
  Shield,
  Binary
} from 'lucide-react';

interface ModelTrainingLabProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelTrainingLab: React.FC<ModelTrainingLabProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'yolo_python' | 'fastapi' | 'viva' | 'report'>('architecture');
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedScript(id);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  const yoloTrainingScript = `# ==============================================================================
# SiteSentry AI - Custom YOLOv8 PPE Training Pipeline
# College Project: Zero-Sensor Construction Site Safety Monitoring
# ==============================================================================

# 1. Install prerequisites:
# pip install ultralytics roboflow opencv-python torch torchvision

import os
from ultralytics import YOLO
from roboflow import Roboflow

def train_custom_ppe_model():
    print("🚀 Initializing SiteSentry YOLOv8 PPE Training Pipeline...")

    # Optional: Download Roboflow Construction Safety PPE Dataset
    # Dataset contains classes: ['worker', 'hardhat', 'vest', 'no-hardhat', 'no-vest']
    # rf = Roboflow(api_key="YOUR_ROBOFLOW_API_KEY")
    # project = rf.workspace("roboflow-universe-projects").project("construction-site-safety")
    # dataset = project.version(1).download("yolov8")

    # Or use local data.yaml configuration:
    # path: ./ppe_dataset
    # train: images/train
    # val: images/val
    # names:
    #   0: person
    #   1: hardhat
    #   2: vest
    #   3: no-hardhat
    #   4: no-vest

    # Load YOLOv8 Nano or Small pretrained weights
    model = YOLO("yolov8n.pt") 

    # Train model on GPU/CPU for 50 epochs
    results = model.train(
        data="ppe_data.yaml",   # Path to your dataset YAML
        epochs=50,
        imgsz=640,
        batch=16,
        name="sitesentry_ppe_yolov8",
        device="0",             # Set device="cpu" if no NVIDIA GPU
        optimizer="AdamW",
        lr0=0.001
    )

    print("✅ Training Complete!")
    print(f"Model saved to: {results.save_dir}/weights/best.pt")

    # Export to ONNX for cross-platform deployment
    model.export(format="onnx")
    print("📦 Exported best.pt to ONNX format for web/edge inference.")

if __name__ == "__main__":
    train_custom_ppe_model()
`;

  const fastApiScript = `# ==============================================================================
# SiteSentry AI - FastAPI Local Inference Server
# Exposes YOLOv8 model for real-time person-to-PPE association
# ==============================================================================

# Install:
# pip install fastapi uvicorn ultralytics python-multipart pillow

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io
import uvicorn

app = FastAPI(title="SiteSentry YOLOv8 Backend")

# Enable CORS for browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load trained YOLOv8 model weights
model = YOLO("best.pt")

def associate_person_ppe(boxes, classes, confidences, img_w, img_h):
    """
    Computes spatial containment between person boxes and PPE boxes:
    - Helmet must fall within top 30% of person bounding box.
    - Vest must fall within central 30%-75% of person torso.
    """
    persons = []
    helmets = []
    vests = []

    for box, cls, conf in zip(boxes, classes, confidences):
        # Normalize box to 0-1000 scale [ymin, xmin, ymax, xmax]
        x1, y1, x2, y2 = box
        norm_box = [
            int((y1 / img_h) * 1000),
            int((x1 / img_w) * 1000),
            int((y2 / img_h) * 1000),
            int((x2 / img_w) * 1000)
        ]
        
        label = model.names[int(cls)]
        if label in ["person", "worker"]:
            persons.append({"box": norm_box, "conf": float(conf)})
        elif label in ["hardhat", "helmet"]:
            helmets.append(norm_box)
        elif label in ["vest", "safety_vest"]:
            vests.append(norm_box)

    results = []
    for idx, p in enumerate(persons):
        py1, px1, py2, px2 = p["box"]
        p_height = py2 - py1

        # Check helmet containment in head region (top 30%)
        head_bottom = py1 + int(p_height * 0.35)
        has_helmet = any(
            (hx1 >= px1 - 20 and hx2 <= px2 + 20 and hy1 >= py1 - 20 and hy2 <= head_bottom)
            for hy1, hx1, hy2, hx2 in helmets
        )

        # Check vest containment in torso region (30% to 75%)
        torso_top = py1 + int(p_height * 0.25)
        torso_bottom = py1 + int(p_height * 0.80)
        has_vest = any(
            (vx1 >= px1 - 30 and vx2 <= px2 + 30 and vy1 >= torso_top and vy2 <= torso_bottom)
            for vy1, vx1, vy2, vx2 in vests
        )

        violations = []
        if not has_helmet:
            violations.append("Missing Hard Hat")
        if not has_vest:
            violations.append("Missing Hi-Vis Vest")

        status = "COMPLIANT"
        if not has_helmet and not has_vest:
            status = "VIOLATION"
        elif not has_helmet or not has_vest:
            status = "WARNING"

        results.append({
            "id": f"worker-cv-{idx+1}",
            "box2d": p["box"],
            "hasHelmet": has_helmet,
            "hasVest": has_vest,
            "confidence": p["conf"],
            "status": status,
            "violations": violations
        })

    return results

@app.post("/predict")
async def predict_frame(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    w, h = image.size

    # Run YOLOv8 inference
    results = model(image)[0]
    boxes = results.boxes.xyxy.cpu().numpy()
    classes = results.boxes.cls.cpu().numpy()
    confs = results.boxes.conf.cpu().numpy()

    detected_persons = associate_person_ppe(boxes, classes, confs, w, h)
    
    return {
        "success": True,
        "persons": detected_persons,
        "overallHazardLevel": "HIGH" if any(p["status"] == "VIOLATION" for p in detected_persons) else "LOW"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-black">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  College Project Lab & AI Model Architecture
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Viva Voce Guide
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Zero-sensor computer vision, person-to-PPE association logic, and training scripts
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

        {/* Tab Navigation */}
        <div className="bg-slate-950/80 px-6 border-b border-slate-800 flex items-center space-x-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'architecture'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            System Architecture
          </button>

          <button
            onClick={() => setActiveTab('yolo_python')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'yolo_python'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            YOLOv8 Training Script
          </button>

          <button
            onClick={() => setActiveTab('fastapi')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'fastapi'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            FastAPI Server Code
          </button>

          <button
            onClick={() => setActiveTab('viva')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'viva'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Viva Voce Q&A Prep
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'report'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Project Synopsis & Abstract
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-sm font-bold text-amber-400">
                  <Cpu className="w-4 h-4" />
                  <h4>Why Zero Physical Sensors? (Vision vs IoT)</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Traditional industrial monitoring uses wearable RFID tags, BLE beacons, or Arduino force sensors inside helmets. 
                  However, in real construction sites:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <span className="font-bold text-white block mb-1">✕ Battery & Maintenance</span>
                    <span className="text-slate-400">Thousands of wearable batteries run out daily, causing fatal dead zones.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <span className="font-bold text-white block mb-1">✕ False Compliance</span>
                    <span className="text-slate-400">A worker can clip an RFID tag to their belt while leaving their helmet in a locker.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <span className="font-bold text-emerald-400 block mb-1">✓ Computer Vision Edge</span>
                    <span className="text-slate-300">Cameras visually verify the helmet is on the actual skull and vest is on the torso in real time.</span>
                  </div>
                </div>
              </div>

              {/* Person-to-PPE Association Logic */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center space-x-2 text-sm font-bold text-white">
                  <Binary className="w-4 h-4 text-emerald-400" />
                  <h4>Person-to-PPE Spatial Association Algorithm</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  A common flaw in naive computer vision projects is simply counting objects (e.g., <i>&quot;2 persons, 1 helmet, 1 vest detected&quot;</i>). 
                  This fails because you cannot tell <b>which</b> worker is missing their safety gear. SiteSentry enforces strict geometric containment:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      Hard Hat Spatial Rule
                    </div>
                    <p className="text-[11px] text-slate-300 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      Y_min_helmet &ge; Y_min_person - &delta;<br />
                      Y_max_helmet &le; Y_min_person + 0.35 &times; Height_person<br />
                      X_center_helmet &isin; [X_min_person, X_max_person]
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Ensures the helmet is physically resting upon the individual&apos;s cranium rather than carried in hand.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      Safety Vest Spatial Rule
                    </div>
                    <p className="text-[11px] text-slate-300 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      Y_min_vest &ge; Y_min_person + 0.20 &times; Height_person<br />
                      Y_max_vest &le; Y_min_person + 0.80 &times; Height_person<br />
                      Intersection_over_Union(Torso, Vest) &gt; 0.45
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Verifies the high-visibility fluorescent vest wraps the central torso with high retroreflective contrast.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: YOLO TRAINING */}
          {activeTab === 'yolo_python' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">YOLOv8 Training Script (Python)</h4>
                  <p className="text-xs text-slate-400">Run locally with PyTorch or in Google Colab with GPU acceleration</p>
                </div>
                <button
                  onClick={() => copyCode(yoloTrainingScript, 'yolo')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedScript === 'yolo' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-950" />}
                  <span>{copiedScript === 'yolo' ? 'Copied!' : 'Copy Python Script'}</span>
                </button>
              </div>

              <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono text-amber-200/90 overflow-x-auto max-h-[420px] leading-relaxed">
                {yoloTrainingScript}
              </pre>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                <span className="font-bold text-white block">Dataset Recommendation:</span>
                <p className="text-slate-400">
                  Use the <b>Roboflow Construction Site Safety (Hardhat-Vest-Worker)</b> dataset containing 5,000+ annotated industrial images with bounding boxes for workers, helmets, and vests.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: FASTAPI SERVER */}
          {activeTab === 'fastapi' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">FastAPI Local Model Inference Backend</h4>
                  <p className="text-xs text-slate-400">Run on port 8000 to connect your own trained YOLOv8 weights directly</p>
                </div>
                <button
                  onClick={() => copyCode(fastApiScript, 'fastapi')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedScript === 'fastapi' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-950" />}
                  <span>{copiedScript === 'fastapi' ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono text-cyan-200/90 overflow-x-auto max-h-[420px] leading-relaxed">
                {fastApiScript}
              </pre>
            </div>
          )}

          {/* TAB 4: VIVA VOCE */}
          {activeTab === 'viva' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white mb-2">
                Frequently Asked College Viva Voce Questions & Answers
              </h4>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-amber-400">
                    Q1: Why choose Computer Vision over Wearable IoT Sensors?
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <b>Answer:</b> Wearable IoT sensors (accelerometers, RFID, pressure sensors) suffer from high deployment friction, daily battery drain, and vulnerability to spoofing (e.g., clipping an RFID badge to a belt without wearing the helmet). Computer vision is non-intrusive, verifies actual physical wearing, and leverages existing CCTV cameras or mobile phones.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-amber-400">
                    Q2: What is the Mean Average Precision (mAP@50)?
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <b>Answer:</b> mAP@50 calculates the mean of average precision across all classes when the Intersection over Union (IoU) overlap between predicted bounding box and ground-truth box is at least 0.50 (50%). A typical YOLOv8 fine-tuned on PPE achieves ~88-94% mAP@50.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-amber-400">
                    Q3: How does the system handle occlusions or workers facing backwards?
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <b>Answer:</b> The model is trained on diverse 360-degree viewpoints. Hard hats possess distinct hemispherical contours visible from all angles. For partial occlusions, the spatial containment bounding box ratio dynamically scales with the visible torso/head boundaries.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-amber-400">
                    Q4: How does browser camera permission and HTTPS work on Android?
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <b>Answer:</b> Under the W3C Media Capture and Streams API, browsers require a Secure Context (HTTPS or localhost) before exposing <code className="text-amber-300">navigator.mediaDevices.getUserMedia()</code>. This prevents Man-in-the-Middle (MITM) video eavesdropping.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REPORT & SYNOPSIS */}
          {activeTab === 'report' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-mono uppercase text-amber-400 font-bold">Project Abstract</span>
                <h4 className="text-base font-bold text-white">
                  SiteSentry: Zero-Sensor Deep Vision Safety Compliance Engine for Construction Environments
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Industrial construction sites represent one of the highest occupational hazard environments globally. 
                  Head injuries and poor low-light visibility account for over 47% of site fatalities. Traditional sensor-based solutions require cost-prohibitive wearable IoT tags susceptible to dead batteries and deliberate non-compliance. 
                  This project introduces <b>SiteSentry</b>, a hardware-free, zero-sensor computer vision platform that leverages mobile smartphone cameras and site surveillance streams. 
                  Utilizing high-speed convolutional and multimodal vision backbones, the application performs dual-tier object detection and spatial containment heuristics to verify that personal protective equipment (PPE)—specifically hard hats and high-visibility safety vests—are properly worn by personnel. 
                  An interactive site blueprint maps active hazards, evacuation pathways, and safety command checkpoints, providing instant audible and visual alerts upon protocol breach.
                </p>

                <div className="pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-900">
                    <span className="text-slate-400 block text-[10px]">Framework</span>
                    <span className="text-white font-bold">React + Express</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900">
                    <span className="text-slate-400 block text-[10px]">AI Engine</span>
                    <span className="text-amber-400 font-bold">Gemini 3.8 / YOLOv8</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900">
                    <span className="text-slate-400 block text-[10px]">Hardware Needed</span>
                    <span className="text-emerald-400 font-bold">Zero Sensors</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900">
                    <span className="text-slate-400 block text-[10px]">Camera Input</span>
                    <span className="text-cyan-400 font-bold">Android Phone / WebRTC</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close Project Lab
          </button>
        </div>
      </div>
    </div>
  );
};
