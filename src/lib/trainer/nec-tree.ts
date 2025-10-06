/**
 * NEC Navigation Tree Structure
 *
 * Simulates the structure of the National Electrical Code for
 * navigation training. Organized hierarchically to match actual
 * NEC layout: Index → Chapters → Articles → Sections → Tables
 *
 * IMPORTANT: Contains only article numbers and organizational structure.
 * No copyrighted NEC text is included.
 *
 * Based on NEC 2020 with CA amendments (CEC 2022).
 */

export interface NECNode {
  id: string; // Unique identifier (e.g., "310.16", "table-310.16")
  label: string; // Display name
  type: 'index' | 'chapter' | 'article' | 'section' | 'table' | 'category';
  children?: Record<string, NECNode>;
  articleRef?: string; // For quick lookup (e.g., "310.16")
}

/**
 * Full NEC navigation tree
 * Covers major articles tested on CA General Electrician exam
 */
export const NEC_TREE: Record<string, NECNode> = {
  // ============================================================================
  // INDEX - Primary entry point for code lookups
  // ============================================================================
  index: {
    id: 'index',
    label: 'Index',
    type: 'index',
    children: {
      conductors: {
        id: 'index-conductors',
        label: 'Conductors',
        type: 'category',
        children: {
          ampacity: {
            id: 'index-conductors-ampacity',
            label: 'Ampacity',
            type: 'category',
            children: {
              'article-310': {
                id: 'article-310',
                label: 'Article 310 - Conductors for General Wiring',
                type: 'article',
                articleRef: '310',
              },
            },
          },
          sizing: {
            id: 'index-conductors-sizing',
            label: 'Sizing',
            type: 'category',
            children: {
              'article-310': {
                id: 'article-310',
                label: 'Article 310 - Conductors for General Wiring',
                type: 'article',
                articleRef: '310',
              },
            },
          },
          identification: {
            id: 'index-conductors-identification',
            label: 'Identification',
            type: 'category',
            children: {
              '310.12': {
                id: 'section-310.12',
                label: '310.12 - Conductor Identification',
                type: 'section',
                articleRef: '310.12',
              },
            },
          },
        },
      },
      grounding: {
        id: 'index-grounding',
        label: 'Grounding and Bonding',
        type: 'category',
        children: {
          'grounding-electrode-conductor': {
            id: 'index-grounding-electrode',
            label: 'Grounding Electrode Conductor',
            type: 'category',
            children: {
              'article-250': {
                id: 'article-250',
                label: 'Article 250 - Grounding and Bonding',
                type: 'article',
                articleRef: '250',
              },
            },
          },
          'equipment-grounding': {
            id: 'index-equipment-grounding',
            label: 'Equipment Grounding Conductor',
            type: 'category',
            children: {
              '250.122': {
                id: 'section-250.122',
                label: '250.122 - Size of Equipment Grounding Conductors',
                type: 'section',
                articleRef: '250.122',
              },
            },
          },
        },
      },
      overcurrent: {
        id: 'index-overcurrent',
        label: 'Overcurrent Protection',
        type: 'category',
        children: {
          devices: {
            id: 'index-overcurrent-devices',
            label: 'Devices',
            type: 'category',
            children: {
              'article-240': {
                id: 'article-240',
                label: 'Article 240 - Overcurrent Protection',
                type: 'article',
                articleRef: '240',
              },
            },
          },
        },
      },
      boxes: {
        id: 'index-boxes',
        label: 'Boxes, Outlet and Junction',
        type: 'category',
        children: {
          fill: {
            id: 'index-boxes-fill',
            label: 'Box Fill',
            type: 'category',
            children: {
              '314.16': {
                id: 'section-314.16',
                label: '314.16 - Number of Conductors in Outlet Boxes',
                type: 'section',
                articleRef: '314.16',
              },
            },
          },
        },
      },
      motors: {
        id: 'index-motors',
        label: 'Motors',
        type: 'category',
        children: {
          'branch-circuit-protection': {
            id: 'index-motors-protection',
            label: 'Branch-Circuit Protection',
            type: 'category',
            children: {
              'article-430': {
                id: 'article-430',
                label: 'Article 430 - Motors, Motor Circuits, and Controllers',
                type: 'article',
                articleRef: '430',
              },
            },
          },
        },
      },
      services: {
        id: 'index-services',
        label: 'Services',
        type: 'category',
        children: {
          calculations: {
            id: 'index-services-calculations',
            label: 'Load Calculations',
            type: 'category',
            children: {
              'article-220': {
                id: 'article-220',
                label: 'Article 220 - Branch-Circuit, Feeder, and Service Calculations',
                type: 'article',
                articleRef: '220',
              },
            },
          },
        },
      },
    },
  },

  // ============================================================================
  // CHAPTER 1 - General
  // ============================================================================
  'chapter-1': {
    id: 'chapter-1',
    label: 'Chapter 1 - General',
    type: 'chapter',
    children: {
      'article-90': {
        id: 'article-90',
        label: 'Article 90 - Introduction',
        type: 'article',
        articleRef: '90',
        children: {
          '90.1': {
            id: 'section-90.1',
            label: '90.1 - Purpose',
            type: 'section',
            articleRef: '90.1',
          },
          '90.2': {
            id: 'section-90.2',
            label: '90.2 - Scope',
            type: 'section',
            articleRef: '90.2',
          },
        },
      },
      'article-100': {
        id: 'article-100',
        label: 'Article 100 - Definitions',
        type: 'article',
        articleRef: '100',
        children: {
          accessible: {
            id: 'section-100-accessible',
            label: '100 - Accessible (as applied to equipment)',
            type: 'section',
            articleRef: '100',
          },
          receptacle: {
            id: 'section-100-receptacle',
            label: '100 - Receptacle',
            type: 'section',
            articleRef: '100',
          },
        },
      },
      'article-110': {
        id: 'article-110',
        label: 'Article 110 - Requirements for Electrical Installations',
        type: 'article',
        articleRef: '110',
        children: {
          '110.14': {
            id: 'section-110.14',
            label: '110.14 - Electrical Connections',
            type: 'section',
            articleRef: '110.14',
            children: {
              '110.14(C)': {
                id: 'section-110.14(C)',
                label: '110.14(C) - Temperature Limitations',
                type: 'section',
                articleRef: '110.14(C)',
              },
            },
          },
        },
      },
    },
  },

  // ============================================================================
  // CHAPTER 2 - Wiring and Protection
  // ============================================================================
  'chapter-2': {
    id: 'chapter-2',
    label: 'Chapter 2 - Wiring and Protection',
    type: 'chapter',
    children: {
      'article-210': {
        id: 'article-210',
        label: 'Article 210 - Branch Circuits',
        type: 'article',
        articleRef: '210',
        children: {
          '210.8': {
            id: 'section-210.8',
            label: '210.8 - GFCI Protection',
            type: 'section',
            articleRef: '210.8',
            children: {
              '210.8(A)': {
                id: 'section-210.8(A)',
                label: '210.8(A) - Dwelling Units',
                type: 'section',
                articleRef: '210.8(A)',
              },
            },
          },
          '210.12': {
            id: 'section-210.12',
            label: '210.12 - Arc-Fault Circuit-Interrupter Protection',
            type: 'section',
            articleRef: '210.12',
          },
          '210.19': {
            id: 'section-210.19',
            label: '210.19 - Conductors - Minimum Ampacity and Size',
            type: 'section',
            articleRef: '210.19',
          },
        },
      },
      'article-220': {
        id: 'article-220',
        label: 'Article 220 - Branch-Circuit, Feeder, and Service Load Calculations',
        type: 'article',
        articleRef: '220',
        children: {
          '220.12': {
            id: 'section-220.12',
            label: '220.12 - General Lighting',
            type: 'section',
            articleRef: '220.12',
          },
          '220.52': {
            id: 'section-220.52',
            label: '220.52 - Small-Appliance and Laundry Loads',
            type: 'section',
            articleRef: '220.52',
          },
          '220.82': {
            id: 'section-220.82',
            label: '220.82 - Dwelling Unit (Standard Method)',
            type: 'section',
            articleRef: '220.82',
          },
          '220.83': {
            id: 'section-220.83',
            label: '220.83 - Dwelling Unit (Optional Method)',
            type: 'section',
            articleRef: '220.83',
          },
        },
      },
      'article-240': {
        id: 'article-240',
        label: 'Article 240 - Overcurrent Protection',
        type: 'article',
        articleRef: '240',
        children: {
          '240.4': {
            id: 'section-240.4',
            label: '240.4 - Protection of Conductors',
            type: 'section',
            articleRef: '240.4',
            children: {
              '240.4(D)': {
                id: 'section-240.4(D)',
                label: '240.4(D) - Small Conductors',
                type: 'section',
                articleRef: '240.4(D)',
              },
            },
          },
          '240.6': {
            id: 'section-240.6',
            label: '240.6 - Standard Ampere Ratings',
            type: 'section',
            articleRef: '240.6',
            children: {
              '240.6(A)': {
                id: 'section-240.6(A)',
                label: '240.6(A) - Fuses and Fixed-Trip Circuit Breakers',
                type: 'section',
                articleRef: '240.6(A)',
              },
            },
          },
        },
      },
      'article-250': {
        id: 'article-250',
        label: 'Article 250 - Grounding and Bonding',
        type: 'article',
        articleRef: '250',
        children: {
          '250.66': {
            id: 'section-250.66',
            label: '250.66 - Size of Alternating-Current Grounding Electrode Conductor',
            type: 'section',
            articleRef: '250.66',
            children: {
              'table-250.66': {
                id: 'table-250.66',
                label: 'Table 250.66 - Grounding Electrode Conductor for AC Systems',
                type: 'table',
                articleRef: 'Table 250.66',
              },
            },
          },
          '250.122': {
            id: 'section-250.122',
            label: '250.122 - Size of Equipment Grounding Conductors',
            type: 'section',
            articleRef: '250.122',
            children: {
              'table-250.122': {
                id: 'table-250.122',
                label: 'Table 250.122 - Minimum Size Equipment Grounding Conductors',
                type: 'table',
                articleRef: 'Table 250.122',
              },
            },
          },
        },
      },
    },
  },

  // ============================================================================
  // CHAPTER 3 - Wiring Methods and Materials
  // ============================================================================
  'chapter-3': {
    id: 'chapter-3',
    label: 'Chapter 3 - Wiring Methods and Materials',
    type: 'chapter',
    children: {
      'article-310': {
        id: 'article-310',
        label: 'Article 310 - Conductors for General Wiring',
        type: 'article',
        articleRef: '310',
        children: {
          '310.12': {
            id: 'section-310.12',
            label: '310.12 - Conductor Identification',
            type: 'section',
            articleRef: '310.12',
          },
          '310.16': {
            id: 'section-310.16',
            label: '310.16 - Ampacity Tables',
            type: 'section',
            articleRef: '310.16',
            children: {
              'table-310.16': {
                id: 'table-310.16',
                label: 'Table 310.16 - Allowable Ampacities (formerly 310.15(B)(16))',
                type: 'table',
                articleRef: 'Table 310.16',
              },
            },
          },
          '310.15(C)': {
            id: 'section-310.15(C)',
            label: '310.15(C) - Adjustment Factors',
            type: 'section',
            articleRef: '310.15(C)',
            children: {
              'table-310.15(C)(1)': {
                id: 'table-310.15(C)(1)',
                label: 'Table 310.15(C)(1) - Adjustment and Correction Factors',
                type: 'table',
                articleRef: 'Table 310.15(C)(1)',
              },
            },
          },
        },
      },
      'article-314': {
        id: 'article-314',
        label: 'Article 314 - Outlet, Device, Pull, and Junction Boxes',
        type: 'article',
        articleRef: '314',
        children: {
          '314.16': {
            id: 'section-314.16',
            label: '314.16 - Number of Conductors in Outlet Boxes',
            type: 'section',
            articleRef: '314.16',
            children: {
              'table-314.16(A)': {
                id: 'table-314.16(A)',
                label: 'Table 314.16(A) - Metal Boxes',
                type: 'table',
                articleRef: 'Table 314.16(A)',
              },
              '314.16(B)': {
                id: 'section-314.16(B)',
                label: '314.16(B) - Box Fill Calculations',
                type: 'section',
                articleRef: '314.16(B)',
              },
            },
          },
        },
      },
    },
  },

  // ============================================================================
  // CHAPTER 4 - Equipment for General Use
  // ============================================================================
  'chapter-4': {
    id: 'chapter-4',
    label: 'Chapter 4 - Equipment for General Use',
    type: 'chapter',
    children: {
      'article-430': {
        id: 'article-430',
        label: 'Article 430 - Motors, Motor Circuits, and Controllers',
        type: 'article',
        articleRef: '430',
        children: {
          '430.52': {
            id: 'section-430.52',
            label: '430.52 - Rating or Setting for Individual Motor Circuit',
            type: 'section',
            articleRef: '430.52',
            children: {
              'table-430.52': {
                id: 'table-430.52',
                label: 'Table 430.52 - Maximum Rating or Setting of Motor Branch-Circuit Protective Devices',
                type: 'table',
                articleRef: 'Table 430.52',
              },
            },
          },
          '430.250': {
            id: 'section-430.250',
            label: '430.250 - Full-Load Current Tables',
            type: 'section',
            articleRef: '430.250',
            children: {
              'table-430.250': {
                id: 'table-430.250',
                label: 'Table 430.250 - Full-Load Current, Three-Phase AC Motors',
                type: 'table',
                articleRef: 'Table 430.250',
              },
            },
          },
        },
      },
      'article-450': {
        id: 'article-450',
        label: 'Article 450 - Transformers',
        type: 'article',
        articleRef: '450',
        children: {
          '450.3': {
            id: 'section-450.3',
            label: '450.3 - Overcurrent Protection',
            type: 'section',
            articleRef: '450.3',
          },
        },
      },
    },
  },

  // ============================================================================
  // CHAPTER 9 - Tables
  // ============================================================================
  'chapter-9': {
    id: 'chapter-9',
    label: 'Chapter 9 - Tables',
    type: 'chapter',
    children: {
      'table-1': {
        id: 'chapter-9-table-1',
        label: 'Table 1 - Percent of Cross Section of Conduit and Tubing for Conductors',
        type: 'table',
        articleRef: 'Chapter 9, Table 1',
      },
      'table-4': {
        id: 'chapter-9-table-4',
        label: 'Table 4 - Dimensions and Percent Area of Conduit and Tubing',
        type: 'table',
        articleRef: 'Chapter 9, Table 4',
      },
      'table-5': {
        id: 'chapter-9-table-5',
        label: 'Table 5 - Dimensions of Insulated Conductors and Fixture Wires',
        type: 'table',
        articleRef: 'Chapter 9, Table 5',
      },
    },
  },
};

/**
 * Helper function to find a node by article reference
 * Useful for validation and drill grading
 */
export function findNodeByArticleRef(
  articleRef: string,
  tree: Record<string, NECNode> = NEC_TREE
): NECNode | null {
  for (const key in tree) {
    const node = tree[key];

    if (node.articleRef === articleRef) {
      return node;
    }

    if (node.children) {
      const found = findNodeByArticleRef(articleRef, node.children);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Get all article references in the tree (for validation)
 */
export function getAllArticleRefs(): string[] {
  const refs: string[] = [];

  function traverse(node: NECNode) {
    if (node.articleRef) {
      refs.push(node.articleRef);
    }
    if (node.children) {
      Object.values(node.children).forEach(traverse);
    }
  }

  Object.values(NEC_TREE).forEach(traverse);

  return [...new Set(refs)]; // Deduplicate
}

/**
 * Calculate optimal path length from index to target
 * Used for efficiency scoring
 */
export function getOptimalPathLength(targetArticleRef: string): number {
  // Typical path: Index → Category → Article → Section → Table
  // Optimal is usually 3-4 clicks depending on target depth

  const node = findNodeByArticleRef(targetArticleRef);
  if (!node) return 3; // Default fallback

  // Tables are typically 1 level deeper
  if (node.type === 'table') return 4;

  // Sections are typically 3 clicks
  if (node.type === 'section') return 3;

  // Articles are typically 2 clicks from index
  return 2;
}
