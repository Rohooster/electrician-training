/**
 * Concept Graph Utilities
 *
 * Core algorithms for managing the concept knowledge graph:
 * - Cycle detection (prevent circular dependencies)
 * - Topological sorting (order concepts by prerequisites)
 * - Transitive closure (find all dependencies)
 * - Graph validation
 *
 * This is critical infrastructure for personalized learning paths.
 */

import { createLogger } from './logger';

const logger = createLogger({ component: 'ConceptGraph' });

export interface ConceptNode {
  id: string;
  slug: string;
  name: string;
  prerequisites: string[]; // IDs of prerequisite concepts
}

export interface GraphEdge {
  from: string; // prerequisite concept ID
  to: string;   // dependent concept ID
}

/**
 * Detect if adding a prerequisite would create a cycle
 * Uses BFS to check if prerequisiteId can reach conceptId
 *
 * @param conceptId - The concept that would gain a prerequisite
 * @param prerequisiteId - The proposed prerequisite
 * @param allConcepts - All concepts in the graph
 * @returns true if cycle detected, false if safe to add
 */
export function wouldCreateCycle(
  conceptId: string,
  prerequisiteId: string,
  allConcepts: ConceptNode[]
): boolean {
  logger.debug('Checking for cycle', { conceptId, prerequisiteId });

  // Self-prerequisite is always a cycle
  if (conceptId === prerequisiteId) {
    logger.warn('Self-prerequisite detected', { conceptId });
    return true;
  }

  // Build adjacency list for efficient traversal
  const graph = buildAdjacencyList(allConcepts);

  // BFS from prerequisiteId to see if we can reach conceptId
  const visited = new Set<string>();
  const queue: string[] = [prerequisiteId];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current === conceptId) {
      logger.warn('Cycle detected', {
        conceptId,
        prerequisiteId,
        path: reconstructPath(visited, prerequisiteId, conceptId)
      });
      return true;
    }

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    // Add all concepts that depend on current (traverse forward)
    const dependents = graph.forward.get(current) || [];
    for (const dependent of dependents) {
      if (!visited.has(dependent)) {
        queue.push(dependent);
      }
    }
  }

  logger.debug('No cycle detected - safe to add', { conceptId, prerequisiteId });
  return false;
}

/**
 * Build adjacency lists for forward and backward traversal
 */
function buildAdjacencyList(concepts: ConceptNode[]): {
  forward: Map<string, string[]>;  // prerequisite → dependents
  backward: Map<string, string[]>; // concept → prerequisites
} {
  const forward = new Map<string, string[]>();
  const backward = new Map<string, string[]>();

  for (const concept of concepts) {
    // Initialize
    if (!forward.has(concept.id)) {
      forward.set(concept.id, []);
    }
    if (!backward.has(concept.id)) {
      backward.set(concept.id, concept.prerequisites);
    }

    // Add forward edges
    for (const prereqId of concept.prerequisites) {
      if (!forward.has(prereqId)) {
        forward.set(prereqId, []);
      }
      forward.get(prereqId)!.push(concept.id);
    }
  }

  return { forward, backward };
}

/**
 * Reconstruct path for debugging (best effort)
 */
function reconstructPath(visited: Set<string>, start: string, end: string): string[] {
  // Simple approach: return visited nodes
  return Array.from(visited);
}

/**
 * Get all prerequisites for a concept (transitive closure)
 * Returns concepts in topological order (prerequisites first)
 *
 * This is used to generate learning paths - you must master
 * all prerequisites before the target concept.
 */
export function getPrerequisiteChain(
  conceptId: string,
  allConcepts: ConceptNode[]
): ConceptNode[] {
  logger.debug('Computing prerequisite chain', { conceptId });

  const conceptMap = new Map(allConcepts.map(c => [c.id, c]));
  const visited = new Set<string>();
  const chain: ConceptNode[] = [];

  function dfs(id: string) {
    if (visited.has(id)) {
      return;
    }

    visited.add(id);
    const concept = conceptMap.get(id);

    if (!concept) {
      logger.warn('Concept not found in map', { id });
      return;
    }

    // Visit prerequisites first (DFS post-order)
    for (const prereqId of concept.prerequisites) {
      dfs(prereqId);
    }

    // Add current concept after its prerequisites
    chain.push(concept);
  }

  dfs(conceptId);

  logger.debug('Prerequisite chain computed', {
    conceptId,
    chainLength: chain.length,
    concepts: chain.map(c => c.slug),
  });

  return chain;
}

/**
 * Topological sort of all concepts
 * Returns concepts in valid study order (prerequisites before dependents)
 *
 * Uses Kahn's algorithm (BFS-based)
 */
export function topologicalSort(concepts: ConceptNode[]): ConceptNode[] {
  logger.debug('Starting topological sort', { conceptCount: concepts.length });

  const conceptMap = new Map(concepts.map(c => [c.id, c]));
  const inDegree = new Map<string, number>();
  const graph = buildAdjacencyList(concepts);

  // Calculate in-degrees (number of prerequisites)
  for (const concept of concepts) {
    inDegree.set(concept.id, concept.prerequisites.length);
  }

  // Start with concepts that have no prerequisites
  const queue: string[] = [];
  for (const concept of concepts) {
    if (inDegree.get(concept.id) === 0) {
      queue.push(concept.id);
    }
  }

  const sorted: ConceptNode[] = [];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const current = conceptMap.get(currentId);

    if (!current) {
      continue;
    }

    sorted.push(current);

    // Reduce in-degree for all dependents
    const dependents = graph.forward.get(currentId) || [];
    for (const dependentId of dependents) {
      const newInDegree = (inDegree.get(dependentId) || 0) - 1;
      inDegree.set(dependentId, newInDegree);

      if (newInDegree === 0) {
        queue.push(dependentId);
      }
    }
  }

  // If sorted.length < concepts.length, there's a cycle
  if (sorted.length < concepts.length) {
    logger.error('Cycle detected in graph - cannot sort', {
      totalConcepts: concepts.length,
      sortedConcepts: sorted.length,
    });
    throw new Error('Cycle detected in concept graph - prerequisites form a loop');
  }

  logger.info('Topological sort completed', {
    conceptCount: sorted.length,
  });

  return sorted;
}

/**
 * Validate the entire concept graph
 * Checks for cycles, orphans, and inconsistencies
 */
export function validateGraph(concepts: ConceptNode[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalConcepts: number;
    totalEdges: number;
    conceptsWithNoPrerequisites: number;
    conceptsWithNoDependents: number;
    maxDepth: number;
  };
} {
  logger.info('Validating concept graph', { conceptCount: concepts.length });

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for cycles
  try {
    topologicalSort(concepts);
  } catch (error) {
    errors.push('Graph contains cycles (circular dependencies)');
  }

  // Check for invalid prerequisite references
  const conceptIds = new Set(concepts.map(c => c.id));
  for (const concept of concepts) {
    for (const prereqId of concept.prerequisites) {
      if (!conceptIds.has(prereqId)) {
        errors.push(`Concept "${concept.slug}" references non-existent prerequisite: ${prereqId}`);
      }
    }
  }

  // Calculate stats
  const graph = buildAdjacencyList(concepts);
  let totalEdges = 0;
  let conceptsWithNoPrerequisites = 0;
  let conceptsWithNoDependents = 0;

  for (const concept of concepts) {
    totalEdges += concept.prerequisites.length;

    if (concept.prerequisites.length === 0) {
      conceptsWithNoPrerequisites++;
    }

    const dependents = graph.forward.get(concept.id) || [];
    if (dependents.length === 0) {
      conceptsWithNoDependents++;
      warnings.push(`Concept "${concept.slug}" has no dependents (leaf node)`);
    }
  }

  // Calculate max depth
  let maxDepth = 0;
  for (const concept of concepts) {
    const chain = getPrerequisiteChain(concept.id, concepts);
    maxDepth = Math.max(maxDepth, chain.length);
  }

  const result = {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalConcepts: concepts.length,
      totalEdges,
      conceptsWithNoPrerequisites,
      conceptsWithNoDependents,
      maxDepth,
    },
  };

  logger.info('Graph validation complete', result);

  return result;
}

/**
 * Convert graph to format suitable for visualization
 */
export function toVisualizationFormat(concepts: ConceptNode[]): {
  nodes: Array<{ id: string; label: string; level: number }>;
  edges: Array<{ from: string; to: string }>;
} {
  // Topologically sort to assign levels
  let sorted: ConceptNode[];
  try {
    sorted = topologicalSort(concepts);
  } catch {
    // If cycle exists, just use original order
    sorted = concepts;
  }

  // Assign level based on topological order
  const levelMap = new Map<string, number>();
  for (let i = 0; i < sorted.length; i++) {
    levelMap.set(sorted[i].id, i);
  }

  // Build nodes
  const nodes = concepts.map(c => ({
    id: c.id,
    label: c.name,
    level: levelMap.get(c.id) || 0,
  }));

  // Build edges
  const edges: GraphEdge[] = [];
  for (const concept of concepts) {
    for (const prereqId of concept.prerequisites) {
      edges.push({
        from: prereqId,
        to: concept.id,
      });
    }
  }

  return { nodes, edges };
}
