export type MaybeDate = Date | string | number | undefined;

function _date(date?: MaybeDate) {
  return date ? new Date(date) : new Date();
}

/**
 * get the first day of the month of the given date
 * @param maybeDate
 */
export function getFirstDayOfMonth(maybeDate: MaybeDate) {
  const date = _date(maybeDate);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * get the last day of the month of the given date
 * @param maybeDate
 * @example
 * getLastDayOfMonth('2021-01-01') // 2021-01-31
 */
export function getLastDayOfMonth(maybeDate: MaybeDate) {
  const date = _date(maybeDate);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function getMonthMatrix(maybeDate: MaybeDate) {
  const date = _date(maybeDate);
  const firstDayOfMonth = getFirstDayOfMonth(date);
  const lastDayOfMonth = getLastDayOfMonth(date);
  const firstDayOfFirstWeek = new Date(firstDayOfMonth);
  firstDayOfFirstWeek.setDate(
    firstDayOfMonth.getDate() - firstDayOfMonth.getDay()
  );
  const lastDayOfLastWeek = new Date(lastDayOfMonth);
  lastDayOfLastWeek.setDate(
    lastDayOfMonth.getDate() + (6 - lastDayOfMonth.getDay())
  );
  const matrix = [];
  let week = [];
  const day = new Date(firstDayOfFirstWeek);
  while (day <= lastDayOfLastWeek) {
    week.push(new Date(day));
    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }
    day.setDate(day.getDate() + 1);
  }
  return matrix;
}

/**
 * Check if the given date is today
 * @param maybeDate
 * @returns
 */
export function isToday(maybeDate?: MaybeDate) {
  const date = _date(maybeDate);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function isCurrentMonth(maybeDate?: MaybeDate, reference?: MaybeDate) {
  const date = _date(maybeDate);
  const ref = _date(reference);
  return (
    date.getFullYear() === ref.getFullYear() &&
    date.getMonth() === ref.getMonth()
  );
}

/**
 * Check if the given date is the same day
 * @param date1
 * @param date2
 * @returns
 */
export function isSameDay(date1: MaybeDate, date2: MaybeDate) {
  const d1 = _date(date1);
  const d2 = _date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
