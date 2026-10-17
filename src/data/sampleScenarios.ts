import { DetectionResult } from '../types';

export interface SampleScenario {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  zone: string;
  expectedResult: DetectionResult;
}

export const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    id: 'scenario-compliant',
    title: 'Compliant Steel Worker (Full PPE)',
    description: 'Worker positioned near structural beams equipped with yellow safety hard hat and neon safety vest.',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    zone: 'Zone B: Elevated Scaffolding & Tower',
    expectedResult: {
      isRealAi: false,
      modelName: 'Benchmark Pre-evaluated Ground Truth',
      latencyMs: 142,
      timestamp: new Date().toISOString(),
      overallHazardLevel: 'LOW',
      safetySummary: '1 worker detected. 100% PPE compliance verified. Hard hat and high-vis safety vest properly worn.',
      actionableAdvice: 'Maintain standard perimeter monitoring. No immediate HSE action required.',
      persons: [
        {
          id: 'worker-bench-1',
          box2d: [120, 280, 880, 720], // [ymin, xmin, ymax, xmax]
          hasHelmet: true,
          hasVest: true,
          helmetBox: [120, 420, 260, 580],
          vestBox: [310, 340, 680, 660],
          confidence: 0.94,
          status: 'COMPLIANT',
          violations: [],
          roleOrActivity: 'Structural Ironworker',
        },
      ],
    },
  },
  {
    id: 'scenario-violation-missing-both',
    title: 'Severe Violation (No Hard Hat, No Vest)',
    description: 'Worker in high-risk zone without safety helmet and wearing standard streetwear.',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80',
    zone: 'Zone A: Foundation & Deep Excavation',
    expectedResult: {
      isRealAi: false,
      modelName: 'Benchmark Pre-evaluated Ground Truth',
      latencyMs: 130,
      timestamp: new Date().toISOString(),
      overallHazardLevel: 'HIGH',
      safetySummary: 'CRITICAL SAFETY BREACH: Worker detected in excavation perimeter with zero PPE protection.',
      actionableAdvice: 'Immediately halt active machinery. Dispatch site supervisor to provide hard hat and high-vis vest.',
      persons: [
        {
          id: 'worker-bench-2',
          box2d: [150, 250, 910, 750],
          hasHelmet: false,
          hasVest: false,
          helmetBox: null,
          vestBox: null,
          confidence: 0.91,
          status: 'VIOLATION',
          violations: ['Missing Hard Hat', 'Missing Hi-Vis Vest'],
          roleOrActivity: 'Ground Crew Personnel',
        },
      ],
    },
  },
  {
    id: 'scenario-mixed-crew',
    title: 'Mixed Crew (1 Compliant, 1 Partial Violation)',
    description: 'Two site personnel inspecting blueprints. One worker is missing their hard hat.',
    imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80',
    zone: 'Zone C: Crane Lifting & Machinery Yard',
    expectedResult: {
      isRealAi: false,
      modelName: 'Benchmark Pre-evaluated Ground Truth',
      latencyMs: 165,
      timestamp: new Date().toISOString(),
      overallHazardLevel: 'MEDIUM',
      safetySummary: '2 workers detected. 1 Compliant, 1 Partial Violation (missing safety helmet in crane corridor).',
      actionableAdvice: 'Alert worker on right to don hard hat before entering lifting radius.',
      persons: [
        {
          id: 'worker-bench-3A',
          box2d: [180, 80, 890, 480],
          hasHelmet: true,
          hasVest: true,
          helmetBox: [180, 210, 320, 360],
          vestBox: [340, 140, 690, 430],
          confidence: 0.93,
          status: 'COMPLIANT',
          violations: [],
          roleOrActivity: 'Site Engineer',
        },
        {
          id: 'worker-bench-3B',
          box2d: [190, 510, 900, 880],
          hasHelmet: false,
          hasVest: true,
          helmetBox: null,
          vestBox: [350, 560, 710, 840],
          confidence: 0.88,
          status: 'WARNING',
          violations: ['Missing Hard Hat'],
          roleOrActivity: 'Survey Assistant',
        },
      ],
    },
  },
];
