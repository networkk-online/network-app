import { Skeleton } from "@/components/ui/skeleton";

const StorySkeleton = () => {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[70px]">
      <Skeleton className="h-16 w-16 rounded-full" />
      <Skeleton className="h-3 w-12" />
    </div>
  );
};

const StoriesRowSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="flex gap-4 overflow-hidden pb-2">
      {Array.from({ length: count }).map((_, i) => (
        <StorySkeleton key={i} />
      ))}
    </div>
  );
};

export { StorySkeleton, StoriesRowSkeleton };
