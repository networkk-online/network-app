import PostSkeleton from "./PostSkeleton";
import { StoriesRowSkeleton } from "./StorySkeleton";

const FeedSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Stories */}
      <div className="border-b border-border pb-4">
        <StoriesRowSkeleton count={6} />
      </div>
      
      {/* Posts */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};

export default FeedSkeleton;
