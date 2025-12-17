"use client";

/**
 * Skeleton loading component for the Templates page.
 * Displays placeholder rows that match the structure of the template list.
 * Used as a Suspense fallback while templates are loading.
 */
export function TemplatesSkeleton() {
    // Show 3 placeholder rows as a reasonable default
    const skeletonRows = [1, 2, 3];

    return (
        <div className="bg-card rounded-lg shadow border border-border overflow-hidden">
            {/* Header - matches the real header structure */}
            <div className="flex items-center px-5 py-1 bg-muted/50 border-b border-border font-medium text-xs text-muted-foreground leading-none">
                <div className="flex-1 min-w-0">Name</div>
                <div className="w-32 flex-shrink-0">Type</div>
                <div className="w-24 flex-shrink-0 text-center">Variables</div>
                <div className="w-48 flex-shrink-0 text-right">Actions</div>
            </div>

            {/* Skeleton rows */}
            <div className="divide-y divide-border">
                {skeletonRows.map((row) => (
                    <div key={row} className="flex items-center px-5 py-3 animate-pulse">
                        {/* Name column */}
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                            <div className="h-4 bg-muted rounded w-32" />
                            <div className="h-3 bg-muted/60 rounded w-24" />
                        </div>

                        {/* Type column */}
                        <div className="w-32 flex-shrink-0">
                            <div className="h-5 bg-muted rounded w-16" />
                        </div>

                        {/* Variables column */}
                        <div className="w-24 flex-shrink-0 flex justify-center">
                            <div className="h-4 bg-muted rounded w-6" />
                        </div>

                        {/* Actions column */}
                        <div className="w-48 flex-shrink-0 flex justify-end gap-2">
                            <div className="h-6 bg-muted rounded w-12" />
                            <div className="h-6 bg-muted rounded w-16" />
                            <div className="h-6 bg-muted rounded w-14" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
