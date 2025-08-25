// Quick test of the date conversion fixes
const exceptionDate = "2025-10-17";

console.log("Original problematic approach:");
console.log("new Date(exception.date + 'T00:00'):", new Date(exceptionDate + 'T00:00'));

console.log("\nFixed approach:");
const [year, month, day] = exceptionDate.split('-').map(Number);
const fixedDate = new Date(year, month - 1, day, 0, 0, 0);
console.log("new Date(year, month-1, day, 0, 0, 0):", fixedDate);

console.log("\nComparison:");
console.log("Original shows date as:", new Date(exceptionDate + 'T00:00').toLocaleDateString());
console.log("Fixed shows date as:", fixedDate.toLocaleDateString());

console.log("\nTimezone info:");
console.log("Browser timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log("Browser timezone offset:", new Date().getTimezoneOffset());
