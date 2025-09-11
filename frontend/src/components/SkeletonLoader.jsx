export const SkeletonLoader = () => {
    return (
        <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-32"></div>
                                <div className="h-3 bg-gray-200 rounded w-24"></div>
                            </div>
                        </div>
                        <div className="text-right space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
