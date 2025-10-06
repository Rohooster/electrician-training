/**
 * Calculation Engine
 *
 * Generates parametric electrical calculations with step-by-step solutions.
 * All calculations cite NEC articles.
 */

import seedrandom from 'seedrandom';
import { CalcTemplate } from '@prisma/client';

export interface CalcResult {
  problem: string;
  parameters: Record<string, number | string>;
  steps: Array<{
    description: string;
    formula?: string;
    calculation?: string;
    result: number | string;
    reference: string; // NEC article citation
  }>;
  finalAnswer: number;
  unit: string;
  references: string[]; // All NEC articles cited
}

/**
 * Generate calculation from template with optional seed for reproducibility
 */
export function generateCalculation(
  template: CalcTemplate,
  seed?: number
): CalcResult {
  const rng = seedrandom(
    seed?.toString() || Date.now().toString() + Math.random().toString()
  );

  const paramSchema = template.parameterSchema as Record<string, any>;
  const algorithm = template.solutionAlgorithm as any;

  // Generate random parameters within schema constraints
  const parameters: Record<string, number | string> = {};
  for (const [key, spec] of Object.entries(paramSchema)) {
    if (spec.type === 'number') {
      const min = spec.min || 0;
      const max = spec.max || 100;
      const step = spec.step || 1;
      const range = (max - min) / step;
      const value = min + Math.floor(rng() * range) * step;
      parameters[key] = value;
    } else if (spec.type === 'enum') {
      const options = spec.options || [];
      parameters[key] = options[Math.floor(rng() * options.length)];
    }
  }

  // Execute calculation based on template category
  switch (template.category) {
    case 'dwelling_service_standard':
      return calculateDwellingServiceStandard(parameters);
    case 'dwelling_service_optional':
      return calculateDwellingServiceOptional(parameters);
    case 'conductor_ampacity':
      return calculateConductorAmpacity(parameters);
    case 'ocpd_sizing':
      return calculateOCPDSizing(parameters);
    case 'motor_feeder':
      return calculateMotorFeeder(parameters);
    case 'box_fill':
      return calculateBoxFill(parameters);
    case 'conduit_fill':
      return calculateConduitFill(parameters);
    case 'transformer_primary_ocpd':
      return calculateTransformerPrimaryOCPD(parameters);
    case 'grounding_electrode_conductor':
      return calculateGroundingElectrodeConductor(parameters);
    default:
      throw new Error(`Unknown template category: ${template.category}`);
  }
}

/**
 * Dwelling Service Calculation - Standard Method (NEC 220.82)
 */
function calculateDwellingServiceStandard(params: Record<string, any>): CalcResult {
  const area = params.dwelling_area_sqft as number;
  const hasACHP = params.has_ac_hp as boolean;
  const acHpLoad = params.ac_hp_kva as number || 0;

  const steps = [];

  // General lighting load (220.12)
  const lightingVA = area * 3; // 3 VA/sq ft
  steps.push({
    description: 'Calculate general lighting and receptacle load',
    formula: 'Area × 3 VA/sq ft',
    calculation: `${area} × 3 = ${lightingVA} VA`,
    result: lightingVA,
    reference: 'NEC 220.12',
  });

  // Small appliance circuits (220.52(A))
  const smallApplianceVA = 2 * 1500; // 2 circuits minimum
  steps.push({
    description: 'Add small appliance branch circuits',
    calculation: '2 circuits × 1500 VA = 3000 VA',
    result: smallApplianceVA,
    reference: 'NEC 220.52(A)',
  });

  // Laundry circuit (220.52(B))
  const laundryVA = 1500;
  steps.push({
    description: 'Add laundry circuit',
    result: laundryVA,
    reference: 'NEC 220.52(B)',
  });

  // Subtotal
  const subtotal = lightingVA + smallApplianceVA + laundryVA;
  steps.push({
    description: 'Subtotal',
    calculation: `${lightingVA} + ${smallApplianceVA} + ${laundryVA} = ${subtotal} VA`,
    result: subtotal,
    reference: '',
  });

  // Apply demand factors (220.42)
  let demandLoad = 0;
  if (subtotal <= 3000) {
    demandLoad = subtotal;
  } else if (subtotal <= 120000) {
    demandLoad = 3000 + (subtotal - 3000) * 0.35;
  } else {
    demandLoad = 3000 + 117000 * 0.35 + (subtotal - 120000) * 0.25;
  }

  steps.push({
    description: 'Apply demand factor (first 3000 VA @ 100%, remainder @ 35%)',
    calculation: `3000 + (${subtotal - 3000}) × 0.35 = ${demandLoad.toFixed(0)} VA`,
    result: demandLoad,
    reference: 'NEC 220.42',
  });

  // Add A/C or heat pump load if present
  if (hasACHP) {
    demandLoad += acHpLoad * 1000; // Convert kVA to VA
    steps.push({
      description: 'Add air conditioning/heat pump load',
      calculation: `${acHpLoad} kVA = ${acHpLoad * 1000} VA`,
      result: acHpLoad * 1000,
      reference: 'NEC 220.82(C)',
    });
  }

  // Calculate service size (240V)
  const amps = demandLoad / 240;
  steps.push({
    description: 'Calculate minimum service size',
    formula: 'Total VA / 240V',
    calculation: `${demandLoad} / 240 = ${amps.toFixed(1)} A`,
    result: amps,
    reference: '',
  });

  // Round up to standard OCPD size (240.6(A))
  const standardSizes = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300];
  const serviceSize = standardSizes.find((s) => s >= amps) || 400;

  steps.push({
    description: 'Round up to standard service size',
    result: serviceSize,
    reference: 'NEC 240.6(A)',
  });

  return {
    problem: `Calculate the minimum service size for a single-family dwelling with ${area} sq ft of living area${hasACHP ? ` and a ${acHpLoad} kVA air conditioner` : ''}.`,
    parameters: params,
    steps,
    finalAnswer: serviceSize,
    unit: 'A',
    references: ['220.12', '220.52(A)', '220.52(B)', '220.42', '220.82', '240.6(A)'],
  };
}

/**
 * Dwelling Service Optional Calculation (NEC 220.83)
 */
function calculateDwellingServiceOptional(params: Record<string, any>): CalcResult {
  // Simplified implementation
  return {
    problem: 'Optional dwelling service calculation',
    parameters: params,
    steps: [],
    finalAnswer: 100,
    unit: 'A',
    references: ['220.83'],
  };
}

/**
 * Conductor Ampacity with Derating (NEC 310.16, 310.15(C))
 */
function calculateConductorAmpacity(params: Record<string, any>): CalcResult {
  const baseAmpacity = params.base_ampacity as number;
  const ambientTemp = params.ambient_temp_c as number;
  const conductorsInRaceway = params.conductors_in_raceway as number;

  const steps = [];

  steps.push({
    description: 'Base conductor ampacity from Table 310.16',
    result: baseAmpacity,
    reference: 'NEC Table 310.16',
  });

  // Temperature correction (Table 310.15(C)(1))
  let tempFactor = 1.0;
  if (ambientTemp <= 30) tempFactor = 1.0;
  else if (ambientTemp <= 40) tempFactor = 0.91;
  else if (ambientTemp <= 45) tempFactor = 0.82;
  else tempFactor = 0.71;

  const afterTemp = baseAmpacity * tempFactor;
  steps.push({
    description: `Apply temperature correction factor for ${ambientTemp}°C ambient`,
    calculation: `${baseAmpacity} × ${tempFactor} = ${afterTemp.toFixed(1)} A`,
    result: afterTemp,
    reference: 'NEC Table 310.15(C)(1)',
  });

  // Conductor fill adjustment (Table 310.15(C)(1))
  let fillFactor = 1.0;
  if (conductorsInRaceway <= 3) fillFactor = 1.0;
  else if (conductorsInRaceway <= 6) fillFactor = 0.8;
  else if (conductorsInRaceway <= 9) fillFactor = 0.7;
  else fillFactor = 0.5;

  const finalAmpacity = afterTemp * fillFactor;
  steps.push({
    description: `Apply adjustment factor for ${conductorsInRaceway} conductors in raceway`,
    calculation: `${afterTemp.toFixed(1)} × ${fillFactor} = ${finalAmpacity.toFixed(1)} A`,
    result: finalAmpacity,
    reference: 'NEC Table 310.15(C)(1)',
  });

  return {
    problem: `Calculate the derated ampacity of a conductor with base ampacity ${baseAmpacity}A at ${ambientTemp}°C ambient temperature with ${conductorsInRaceway} current-carrying conductors in the raceway.`,
    parameters: params,
    steps,
    finalAnswer: Math.floor(finalAmpacity),
    unit: 'A',
    references: ['Table 310.16', 'Table 310.15(C)(1)'],
  };
}

/**
 * Placeholder implementations for other calc types
 */
function calculateOCPDSizing(params: Record<string, any>): CalcResult {
  return {
    problem: 'OCPD sizing calculation',
    parameters: params,
    steps: [],
    finalAnswer: 20,
    unit: 'A',
    references: ['240.4', '240.6'],
  };
}

function calculateMotorFeeder(params: Record<string, any>): CalcResult {
  return {
    problem: 'Motor feeder calculation',
    parameters: params,
    steps: [],
    finalAnswer: 50,
    unit: 'A',
    references: ['430.24', '430.52'],
  };
}

function calculateBoxFill(params: Record<string, any>): CalcResult {
  return {
    problem: 'Box fill calculation',
    parameters: params,
    steps: [],
    finalAnswer: 8,
    unit: 'conductors',
    references: ['314.16'],
  };
}

function calculateConduitFill(params: Record<string, any>): CalcResult {
  return {
    problem: 'Conduit fill calculation',
    parameters: params,
    steps: [],
    finalAnswer: 1,
    unit: 'inch',
    references: ['Chapter 9, Table 1', 'Chapter 9, Table 4'],
  };
}

function calculateTransformerPrimaryOCPD(params: Record<string, any>): CalcResult {
  return {
    problem: 'Transformer primary OCPD sizing',
    parameters: params,
    steps: [],
    finalAnswer: 30,
    unit: 'A',
    references: ['450.3'],
  };
}

function calculateGroundingElectrodeConductor(params: Record<string, any>): CalcResult {
  return {
    problem: 'Grounding electrode conductor sizing',
    parameters: params,
    steps: [],
    finalAnswer: 6,
    unit: 'AWG',
    references: ['250.66', 'Table 250.66'],
  };
}
