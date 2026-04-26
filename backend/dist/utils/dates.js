/**
 * Date helpers. We store workout dates as `YYYY-MM-DD` strings (local
 * calendar day) so that "today" comparisons stay timezone-stable for a
 * single user.
 */
function pad(n) {
    return String(n).padStart(2, '0');
}
export function toDateKey(date) {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime()))
        return null;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function todayKey() {
    return toDateKey(new Date());
}
export function isValidDateKey(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
export function isToday(dateKey) {
    return dateKey === todayKey();
}
//# sourceMappingURL=dates.js.map