import { Skeleton } from "@/components/ui/skeleton";

const PostSkeleton = () => {
  return (
    <div className="bg-card rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      
      {/* Image */}
      <Skeleton className="w-full aspect-square" />
      
      {/* Actions */}
      <div className="p-4 space-y-3">
        <div className="flex gap-4">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-6" />
          <div className="flex-1" />
          <Skeleton className="h-6 w-6" />
        </div>
        
        {/* Likes */}
        <Skeleton className="h-4 w-20" />
        
        {/* Caption */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
};

export default PostSkeleton;
