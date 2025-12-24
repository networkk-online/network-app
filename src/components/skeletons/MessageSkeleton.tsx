import { Skeleton } from "@/components/ui/skeleton";

const MessageItemSkeleton = () => {
  return (
    <div className="flex items-center gap-3 p-4">
      <Skeleton className="h-14 w-14 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-3 w-10" />
    </div>
  );
};

const MessagesListSkeleton = ({ count = 8 }: { count?: number }) => {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <MessageItemSkeleton key={i} />
      ))}
    </div>
  );
};

export { MessageItemSkeleton, MessagesListSkeleton };
