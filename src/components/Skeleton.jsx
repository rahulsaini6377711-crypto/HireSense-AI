import React from 'react';

/**
 * Single skeleton pulse block
 */
export const SkeletonPulse = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700/60 rounded ${className}`} />
);

/**
 * Card skeleton loader
 */
export const CardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-250 dark:border-gray-700/50 space-y-4 shadow-sm">
    <div className="flex items-center gap-4">
      <SkeletonPulse className="w-12 h-12 rounded-2xl" />
      <div className="space-y-2 flex-1">
        <SkeletonPulse className="h-4 w-1/3" />
        <SkeletonPulse className="h-3 w-1/2" />
      </div>
    </div>
    <div className="space-y-2.5 pt-2">
      <SkeletonPulse className="h-3 w-full" />
      <SkeletonPulse className="h-3 w-5/6" />
      <SkeletonPulse className="h-3 w-2/3" />
    </div>
  </div>
);

/**
 * List item skeleton loader
 */
export const ListSkeleton = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, idx) => (
      <div key={idx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="flex-1 space-y-2.5">
          <SkeletonPulse className="h-4 w-1/4" />
          <SkeletonPulse className="h-3 w-1/2" />
        </div>
        <SkeletonPulse className="w-16 h-8 rounded-lg" />
      </div>
    ))}
  </div>
);

/**
 * Page container skeleton loader
 */
export const PageSkeleton = () => (
  <div className="space-y-8 max-w-4xl">
    <div className="space-y-2">
      <SkeletonPulse className="h-8 w-1/4" />
      <SkeletonPulse className="h-4 w-1/2" />
    </div>
    
    <div className="grid md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, idx) => (
        <CardSkeleton key={idx} />
      ))}
    </div>
    
    <div className="space-y-4 pt-4">
      <SkeletonPulse className="h-6 w-1/5" />
      <ListSkeleton count={2} />
    </div>
  </div>
);

export default {
  Pulse: SkeletonPulse,
  Card: CardSkeleton,
  List: ListSkeleton,
  Page: PageSkeleton
};
