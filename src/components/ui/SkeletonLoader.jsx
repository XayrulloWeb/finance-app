import React from 'react';

export default function SkeletonLoader({ type = 'card', count = 1 }) {
    const skeletons = {
        card: (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-6 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                    <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
        ),

        list: (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-800 rounded"></div>
                            </div>
                            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        ),

        chart: (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
                <div className="h-64 bg-gray-100 dark:bg-gray-900 rounded-xl"></div>
            </div>
        ),

        text: (
            <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
            </div>
        ),

        stat: (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                <div className="h-8 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
        ),
    };

    return (
        <>
            {[...Array(count)].map((_, index) => (
                <React.Fragment key={index}>
                    {skeletons[type] || skeletons.card}
                </React.Fragment>
            ))}
        </>
    );
}
