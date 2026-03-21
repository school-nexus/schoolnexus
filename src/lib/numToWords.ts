/**
 * Utility to convert numbers to words (English)
 * Specifically tailored for currency representations like UGX
 */

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

function convertGroup(n: number): string {
    let s = '';
    if (n >= 100) {
        s += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
        if (n > 0) s += 'and ';
    }
    if (n >= 20) {
        s += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
        if (n > 0) s += ones[n] + ' ';
    } else if (n >= 10) {
        s += teens[n - 10] + ' ';
    } else if (n > 0) {
        s += ones[n] + ' ';
    }
    return s;
}

export function numberToWords(n: number): string {
    if (n === 0) return 'Zero';
    
    let words = '';
    
    if (n >= 1000000000) {
        words += convertGroup(Math.floor(n / 1000000000)) + 'Billion ';
        n %= 1000000000;
    }
    
    if (n >= 1000000) {
        words += convertGroup(Math.floor(n / 1000000)) + 'Million ';
        n %= 1000000;
    }
    
    if (n >= 1000) {
        words += convertGroup(Math.floor(n / 1000)) + 'Thousand ';
        n %= 1000;
    }
    
    words += convertGroup(n);
    
    return words.trim();
}

/**
 * Specifically for UGX format: "X Shillings Only"
 */
export function amountToWordsUGX(amount: number): string {
    const words = numberToWords(Math.floor(amount));
    return `${words} Shillings Only`;
}
