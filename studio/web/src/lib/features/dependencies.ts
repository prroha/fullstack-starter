/**
 * Dependency Resolver - Handles feature dependencies and conflicts.
 * Resolves which features must be selected/deselected based on dependencies.
 */

import type { Feature } from "@studio/shared";
import type { ResolvedSelection, FeatureConflict } from "./types";

/**
 * Dependency Resolver class
 */
export class DependencyResolver {
  private features: Map<string, Feature> = new Map();
  private dependencyGraph: Map<string, Set<string>> = new Map();
  private dependentGraph: Map<string, Set<string>> = new Map();
  private conflictMap: Map<string, Set<string>> = new Map();

  constructor(features: Feature[] = []) {
    this.buildGraphs(features);
  }

  /**
   * Build dependency and conflict graphs from features
   */
  private buildGraphs(features: Feature[]): void {
    this.features.clear();
    this.dependencyGraph.clear();
    this.dependentGraph.clear();
    this.conflictMap.clear();

    // Index features and build graphs
    for (const feature of features) {
      this.features.set(feature.slug, feature);

      // Build dependency graph (feature -> its dependencies)
      if (feature.requires.length > 0) {
        this.dependencyGraph.set(feature.slug, new Set(feature.requires));

        // Build reverse graph (dependency -> features that depend on it)
        for (const dep of feature.requires) {
          if (!this.dependentGraph.has(dep)) {
            this.dependentGraph.set(dep, new Set());
          }
          this.dependentGraph.get(dep)!.add(feature.slug);
        }
      }

      // Build conflict map (bidirectional)
      if (feature.conflicts.length > 0) {
        this.conflictMap.set(feature.slug, new Set(feature.conflicts));

        // Make conflicts bidirectional
        for (const conflict of feature.conflicts) {
          if (!this.conflictMap.has(conflict)) {
            this.conflictMap.set(conflict, new Set());
          }
          this.conflictMap.get(conflict)!.add(feature.slug);
        }
      }
    }
  }

  /**
   * Update features and rebuild graphs
   */
  updateFeatures(features: Feature[]): void {
    this.buildGraphs(features);
  }

  /**
   * Get all dependencies for a feature (recursive)
   */
  getDependencies(slug: string): string[] {
    const deps = new Set<string>();
    const visited = new Set<string>();

    const traverse = (current: string) => {
      if (visited.has(current)) return;
      visited.add(current);

      const directDeps = this.dependencyGraph.get(current);
      if (directDeps) {
        for (const dep of directDeps) {
          deps.add(dep);
          traverse(dep);
        }
      }
    };

    traverse(slug);
    return Array.from(deps);
  }

  /**
   * Get direct dependencies only
   */
  getDirectDependencies(slug: string): string[] {
    const deps = this.dependencyGraph.get(slug);
    return deps ? Array.from(deps) : [];
  }

  /**
   * Get all features that depend on this feature (recursive)
   */
  getDependents(slug: string): string[] {
    const dependents = new Set<string>();
    const visited = new Set<string>();

    const traverse = (current: string) => {
      if (visited.has(current)) return;
      visited.add(current);

      const directDependents = this.dependentGraph.get(current);
      if (directDependents) {
        for (const dep of directDependents) {
          dependents.add(dep);
          traverse(dep);
        }
      }
    };

    traverse(slug);
    return Array.from(dependents);
  }

  /**
   * Get direct dependents only
   */
  getDirectDependents(slug: string): string[] {
    const deps = this.dependentGraph.get(slug);
    return deps ? Array.from(deps) : [];
  }

  /**
   * Check for conflicts when selecting a feature
   */
  checkConflicts(slug: string, selected: string[]): string[] {
    const conflicts = this.conflictMap.get(slug);
    if (!conflicts) return [];

    const selectedSet = new Set(selected);
    return Array.from(conflicts).filter((conflict) => selectedSet.has(conflict));
  }

  /**
   * Get all conflicts for a feature
   */
  getConflicts(slug: string): string[] {
    const conflicts = this.conflictMap.get(slug);
    return conflicts ? Array.from(conflicts) : [];
  }

  /**
   * Check if a feature can be selected given current selection
   */
  canSelect(slug: string, selected: string[]): { canSelect: boolean; reason?: string } {
    // Check for conflicts
    const conflicts = this.checkConflicts(slug, selected);
    if (conflicts.length > 0) {
      const feature = this.features.get(slug);
      const conflictFeature = this.features.get(conflicts[0]);
      return {
        canSelect: false,
        reason: `${feature?.name || slug} conflicts with ${conflictFeature?.name || conflicts[0]}`,
      };
    }

    return { canSelect: true };
  }

  /**
   * Check if a feature can be deselected given current selection
   */
  canDeselect(slug: string, selected: string[]): { canDeselect: boolean; reason?: string } {
    const selectedSet = new Set(selected);

    // Check if any selected feature depends on this
    const dependents = this.getDependents(slug);
    const blockingDependents = dependents.filter((d) => selectedSet.has(d));

    if (blockingDependents.length > 0) {
      const feature = this.features.get(slug);
      const dependentFeature = this.features.get(blockingDependents[0]);
      return {
        canDeselect: false,
        reason: `${dependentFeature?.name || blockingDependents[0]} requires ${feature?.name || slug}`,
      };
    }

    return { canDeselect: true };
  }

  /**
   * Resolve a selection, auto-selecting dependencies
   */
  resolveSelection(
    userSelected: string[],
    tierIncluded: string[] = []
  ): ResolvedSelection {
    const errors: string[] = [];
    const conflicts: FeatureConflict[] = [];
    const autoSelected = new Set<string>();
    const allSelected = new Set<string>([...userSelected, ...tierIncluded]);

    // Add all dependencies for selected features
    for (const slug of userSelected) {
      const deps = this.getDependencies(slug);
      for (const dep of deps) {
        if (!allSelected.has(dep)) {
          autoSelected.add(dep);
          allSelected.add(dep);
        }
      }
    }

    // Check for conflicts
    for (const slug of allSelected) {
      const conflicting = this.checkConflicts(slug, Array.from(allSelected));
      for (const conflict of conflicting) {
        // Only add each conflict once (avoid duplicates)
        const exists = conflicts.some(
          (c) =>
            (c.feature === slug && c.conflictsWith === conflict) ||
            (c.feature === conflict && c.conflictsWith === slug)
        );

        if (!exists) {
          const feature = this.features.get(slug);
          const conflictFeature = this.features.get(conflict);
          conflicts.push({
            feature: slug,
            conflictsWith: conflict,
            message: `${feature?.name || slug} conflicts with ${conflictFeature?.name || conflict}`,
          });
        }
      }
    }

    // Add errors for conflicts
    if (conflicts.length > 0) {
      errors.push(...conflicts.map((c) => c.message));
    }

    return {
      selectedFeatures: Array.from(allSelected),
      userSelected,
      autoSelected: Array.from(autoSelected),
      tierIncluded,
      conflicts,
      isValid: conflicts.length === 0,
      errors,
    };
  }

  /**
   * Get missing dependencies for a feature
   */
  getMissingDependencies(slug: string, selected: string[]): string[] {
    const selectedSet = new Set(selected);
    const deps = this.getDependencies(slug);
    return deps.filter((dep) => !selectedSet.has(dep));
  }

  /**
   * Get features that would be deselected if this feature is deselected
   */
  getCascadeDeselect(slug: string, selected: string[]): string[] {
    const toDeselect = new Set<string>();
    const selectedSet = new Set(selected);

    const cascade = (current: string) => {
      const dependents = this.getDirectDependents(current);
      for (const dep of dependents) {
        if (selectedSet.has(dep) && !toDeselect.has(dep)) {
          // Check if this dependent has all its dependencies met without current
          const depDeps = this.getDirectDependencies(dep);
          const wouldLoseDep = depDeps.some(
            (d) => d === current || toDeselect.has(d)
          );

          if (wouldLoseDep) {
            toDeselect.add(dep);
            cascade(dep);
          }
        }
      }
    };

    cascade(slug);
    return Array.from(toDeselect);
  }
}
