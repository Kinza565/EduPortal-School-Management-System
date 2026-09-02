import { CardSkeleton } from "@/components/ui/Skeleton";

export default function AdminLoading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <CardSkeleton />
    </div>
  );
}
