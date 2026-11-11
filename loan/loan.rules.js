const DAY_MS = 24 * 60 * 60 * 1000;

const LOAN_DAYS = 7;       
const MAX_ACTIVE_LOANS = 3;   
const FINE_PER_DAY = 1.0;     

function calcDueDate(loanDate) {
    return new Date(new Date(loanDate).getTime() + LOAN_DAYS * DAY_MS);
}

function daysLate(dueDate, at = new Date()) {
    const diff = new Date(at).getTime() - new Date(dueDate).getTime();
    return diff > 0 ? Math.ceil(diff / DAY_MS) : 0;
}

function calcFine(dueDate, at = new Date()) {
    return Math.round(daysLate(dueDate, at) * FINE_PER_DAY * 100) / 100;
}

module.exports = { DAY_MS, LOAN_DAYS, MAX_ACTIVE_LOANS, FINE_PER_DAY, calcDueDate, daysLate, calcFine };
