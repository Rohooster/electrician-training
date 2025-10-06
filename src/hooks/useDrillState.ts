/**
 * Drill State Hook
 *
 * Manages navigation state during NEC lookup drills:
 * - Current position in navigation tree
 * - Path history (breadcrumb trail)
 * - Selected article/table
 * - Navigation tracking for grading
 *
 * Tracks every click for efficiency scoring.
 */

import { useState, useCallback } from 'react';
import type { NECNode } from '@/lib/trainer/nec-tree';

interface UseDrillStateOptions {
  onComplete?: (selectedArticleRef: string, navigationPath: string[]) => void;
}

interface UseDrillStateReturn {
  currentNode: NECNode | null;
  navigationPath: string[]; // IDs of nodes visited
  breadcrumb: NECNode[]; // Full node objects for breadcrumb display
  selectedArticleRef: string | null;
  navigateTo: (node: NECNode) => void;
  goBack: () => void;
  selectArticle: (articleRef: string) => void;
  reset: () => void;
  isAtRoot: boolean;
}

export function useDrillState({
  onComplete,
}: UseDrillStateOptions = {}): UseDrillStateReturn {
  const [currentNode, setCurrentNode] = useState<NECNode | null>(null);
  const [navigationPath, setNavigationPath] = useState<string[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<NECNode[]>([]);
  const [selectedArticleRef, setSelectedArticleRef] = useState<string | null>(null);

  // Navigate to a specific node
  const navigateTo = useCallback(
    (node: NECNode) => {
      console.log('[DrillState] Navigated to:', node.label, `(${node.id})`);

      setCurrentNode(node);
      setNavigationPath((prev) => [...prev, node.id]);
      setBreadcrumb((prev) => [...prev, node]);

      // If this node has an articleRef, auto-select it
      if (node.articleRef) {
        setSelectedArticleRef(node.articleRef);
      }
    },
    []
  );

  // Go back one level in navigation
  const goBack = useCallback(() => {
    if (breadcrumb.length === 0) {
      console.log('[DrillState] Already at root');
      return;
    }

    console.log('[DrillState] Going back');

    const newBreadcrumb = breadcrumb.slice(0, -1);
    const newPath = navigationPath.slice(0, -1);

    setBreadcrumb(newBreadcrumb);
    setNavigationPath(newPath);

    if (newBreadcrumb.length > 0) {
      setCurrentNode(newBreadcrumb[newBreadcrumb.length - 1]);
    } else {
      setCurrentNode(null);
    }
  }, [breadcrumb, navigationPath]);

  // Explicitly select an article (for final submission)
  const selectArticle = useCallback(
    (articleRef: string) => {
      console.log('[DrillState] Selected article:', articleRef);
      setSelectedArticleRef(articleRef);

      if (onComplete) {
        onComplete(articleRef, navigationPath);
      }
    },
    [navigationPath, onComplete]
  );

  // Reset state (for new drill)
  const reset = useCallback(() => {
    console.log('[DrillState] Reset');
    setCurrentNode(null);
    setNavigationPath([]);
    setBreadcrumb([]);
    setSelectedArticleRef(null);
  }, []);

  const isAtRoot = breadcrumb.length === 0;

  return {
    currentNode,
    navigationPath,
    breadcrumb,
    selectedArticleRef,
    navigateTo,
    goBack,
    selectArticle,
    reset,
    isAtRoot,
  };
}
