import { useMemo, useState } from 'react';
import { addMonths, buildMonthMatrix, toDateKey, todayKey } from '../utils/dates';
import type { Workout } from '../types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarProps {
    workoutsByDate: Record<string, Workout>;
    onSelectDate?: (key: string) => void;
    joinedDateKey?: string | null;
}

export default function Calendar({ workoutsByDate, onSelectDate, joinedDateKey }: CalendarProps) {
    const [viewDate, setViewDate] = useState<Date>(() => new Date());

    const matrix = useMemo(() => buildMonthMatrix(viewDate), [viewDate]);
    const monthLabel = useMemo(
        () =>
            viewDate.toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
            }),
        [viewDate]
    );
    const today = todayKey();

    return (
        <div className="calendar">
            <div className="calendar-header">
                <button
                    type="button"
                    className="icon-btn"
                    aria-label="Previous month"
                    onClick={() => setViewDate((d) => addMonths(d, -1))}
                >
                    ‹
                </button>
                <h2>{monthLabel}</h2>
                <button
                    type="button"
                    className="icon-btn"
                    aria-label="Next month"
                    onClick={() => setViewDate((d) => addMonths(d, 1))}
                >
                    ›
                </button>
            </div>

            <div className="calendar-weekdays">
                {WEEKDAYS.map((w) => (
                    <div key={w} className="calendar-weekday">
                        {w}
                    </div>
                ))}
            </div>

            <div className="calendar-grid">
                {matrix.flat().map((day) => {
                    const key = toDateKey(day);
                    const inMonth = day.getMonth() === viewDate.getMonth();
                    const isToday = key === today;
                    const isFuture = key > today;
                    const hasWorkout = Boolean(workoutsByDate[key]);
                    const isBeforeJoin = joinedDateKey ? key < joinedDateKey : false;
                    const isMissed =
                        inMonth && !hasWorkout && !isToday && !isFuture && !isBeforeJoin;

                    const classes = [
                        'calendar-cell',
                        inMonth ? '' : 'is-other-month',
                        isToday ? 'is-today' : '',
                        isFuture ? 'is-future' : '',
                        hasWorkout ? 'has-workout' : '',
                        isMissed ? 'is-missed' : '',
                    ]
                        .filter(Boolean)
                        .join(' ');

                    return (
                        <button
                            key={key}
                            type="button"
                            className={classes}
                            disabled={isFuture}
                            onClick={() => onSelectDate?.(key)}
                        >
                            <span className="calendar-day-num">{day.getDate()}</span>
                            {hasWorkout && <span className="calendar-dot" aria-hidden="true" />}
                            {isMissed && (
                                <span className="calendar-dot calendar-dot-missed" aria-hidden="true" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
