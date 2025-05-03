import { useEffect } from "react";
import { format, addDays, startOfWeek } from "date-fns";

function useFullWeekdayNames() {
    useEffect(() => {
        const headerCells = document.querySelectorAll(
            ".react-datepicker__day-name"
        );

        const baseDate = startOfWeek(new Date(), { weekStartsOn: 0 });

        headerCells.forEach((el, i) => {
            const day = addDays(baseDate, i % 7); // % 7 handles multiple months displayed
            el.textContent = format(day, "EEEE"); // e.g., 'Monday'
        });
    }, []);
}

export default useFullWeekdayNames;
