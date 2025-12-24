import { Skeleton } from "@/components/ui/skeleton";

const ExploreGridSkeleton = () => {
  // Create a pattern similar to Instagram explore grid
  const items = [
    { cols: 1, rows: 1 },
    { cols: 1, rows: 1 },
    { cols: 1, rows: 2 },
    { cols: 1, rows: 1 },
    { cols: 1, rows: 1 },
    { cols: 1, rows: 1 },
    { cols: 1, rows: 1 },
    { cols: 1, rows: 2 },
    { cols: 1, rows: 1 },
    { cols: 1, rows: 1 },
    { cols: 1, rows: 1 },
    { cols: 1, rows: 1 },
  ];

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {items.map((item, i) => (
        <Skeleton 
          key={i} 
          className={`aspect-square ${item.rows === 2 ? 'row-span-2' : ''}`}
        />
      ))}
    </div>
  );
};

const SearchSkeleton = () => {
  return (
    <div className="space-y-4 p-4">
      {/* Search bar */}
      <Skeleton className="h-10 w-full rounded-lg" />
      
      {/* Categories */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
        ))}
      </div>
      
      {/* Grid */}
      <ExploreGridSkeleton />
    </div>
  );
};

export { ExploreGridSkeleton, SearchSkeleton };
