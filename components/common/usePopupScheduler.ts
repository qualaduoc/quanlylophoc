import { useState, useEffect, useRef, useCallback } from 'react';

const DELAYS = [30000, 40000, 60000]; // 30s, 40s, 60s
const MAX_CLOSES = 3;

const usePopupScheduler = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [closeCount, setCloseCount] = useState(0);
    const timerRef = useRef<number | null>(null);

    const schedulePopup = useCallback((count: number) => {
        // Clear any existing timer
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        // Schedule a new timer if we haven't reached the max close count
        if (count < MAX_CLOSES) {
            timerRef.current = window.setTimeout(() => {
                setIsVisible(true);
            }, DELAYS[count]);
        }
    }, []);

    // Effect to schedule the very first popup on component mount
    useEffect(() => {
        schedulePopup(0);
        
        // Cleanup function to clear the timer if the component unmounts
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [schedulePopup]); // The dependency array is correct because schedulePopup is memoized with useCallback

    const handleClose = useCallback(() => {
        setIsVisible(false);
        const newCloseCount = closeCount + 1;
        setCloseCount(newCloseCount);
        schedulePopup(newCloseCount);
    }, [closeCount, schedulePopup]);

    return { isPopupVisible: isVisible, handleClosePopup: handleClose };
};

export default usePopupScheduler;
