/* Tektact quotation arithmetic. No UI dependencies; integer paise and thousandths of a unit. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TektactCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_QTY = 1000000;
  const MAX_RATE = 1000000;
  const MAX_MONEY_PAISE = 9000000000000000n;

  function decimalToInt(value, places, label, max, allowBlank) {
    const text = String(value ?? '').trim();
    if (!text && allowBlank) return 0n;
    if (!text || !/^(?:\d+)(?:\.\d+)?$/.test(text)) throw Error(`${label} must be a non-negative number.`);
    const [whole, part = ''] = text.split('.');
    if (part.length > places) throw Error(`${label} allows up to ${places} decimal places.`);
    const n = BigInt(whole) * 10n ** BigInt(places) + BigInt(part.padEnd(places, '0') || '0');
    if (n > BigInt(max) * 10n ** BigInt(places)) throw Error(`${label} exceeds the allowed maximum (${max}).`);
    return n;
  }
  function quantityMilli(value) { return decimalToInt(value, 3, 'Quantity', MAX_QTY, false); }
  function ratePaise(value) { return decimalToInt(value, 2, 'Rate', MAX_RATE, false); }
  function moneyPaise(value, label = 'Amount') { return decimalToInt(value, 2, label, 90000000000000, false); }
  function percentBasisPoints(value, label) { return decimalToInt(value, 2, label, 100, true); }
  function roundDivide(num, divisor) { return (num + divisor / 2n) / divisor; }
  function validTotal(num) { if (num > MAX_MONEY_PAISE) throw Error('Total is too large.'); return num; }

  function calculateLine(item) {
    const qty = quantityMilli(item.qty);
    const rate = ratePaise(item.rate);
    return validTotal(roundDivide(qty * rate, 1000n));
  }
  function calculateQuote(items, discount = { mode: 'amount', value: '0' }, taxPercent = '0') {
    const lineAmounts = [];
    const errors = [];
    (items || []).forEach((item, i) => {
      try { lineAmounts.push(calculateLine(item)); }
      catch (error) { lineAmounts.push(0n); errors.push(`Item ${i + 1}: ${error.message}`); }
      if (!String(item.title || '').trim()) errors.push(`Item ${i + 1}: service title is required.`);
    });
    const subtotal = validTotal(lineAmounts.reduce((a, b) => a + b, 0n));
    let reduction = 0n;
    let gst = 0n;
    try {
      const value = discount && discount.value != null ? discount.value : '0';
      reduction = discount?.mode === 'percent'
        ? roundDivide(subtotal * percentBasisPoints(value, 'Discount'), 10000n)
        : moneyPaise(value || '0', 'Discount');
      if (reduction > subtotal) throw Error('Discount cannot exceed subtotal.');
    } catch (error) { errors.push(error.message); reduction = 0n; }
    const afterDiscount = subtotal - reduction;
    try { gst = roundDivide(afterDiscount * percentBasisPoints(taxPercent, 'Tax'), 10000n); }
    catch (error) { errors.push(error.message); gst = 0n; }
    return { lineAmounts, subtotal, discount: reduction, taxable: afterDiscount, tax: gst,
      grandTotal: validTotal(afterDiscount + gst), errors };
  }
  function formatRupees(paise, alwaysDecimals = false) {
    const value = BigInt(paise);
    const whole = value / 100n;
    const fraction = value % 100n;
    const integer = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(whole);
    return '₹' + integer + ((fraction !== 0n || alwaysDecimals) ? '.' + fraction.toString().padStart(2, '0') : '');
  }
  function numberWordsUnderThousand(number) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    let n = Number(number), out = [];
    if (n >= 100) { out.push(ones[Math.floor(n / 100)], 'Hundred'); n %= 100; }
    if (n >= 20) { out.push(tens[Math.floor(n / 10)]); n %= 10; }
    if (n > 0) out.push(ones[n]);
    return out.join(' ');
  }
  function amountInWords(paise) {
    const amount = BigInt(paise);
    if (amount < 0n || amount > MAX_MONEY_PAISE) throw Error('Invalid amount for words.');
    let rupees = amount / 100n;
    const bits = [];
    for (const [size, name] of [[100000000000n, 'Kharab'], [1000000000n, 'Arab'], [10000000n, 'Crore'], [100000n, 'Lakh'], [1000n, 'Thousand']]) {
      if (rupees >= size) { bits.push(numberWordsUnderThousand(rupees / size) + ' ' + name); rupees %= size; }
    }
    if (rupees) bits.push(numberWordsUnderThousand(rupees));
    let out = 'Rupees ' + (bits.join(' ') || 'Zero');
    const paisePart = amount % 100n;
    if (paisePart) out += ' and ' + numberWordsUnderThousand(paisePart) + ' Paise';
    return out + ' Only';
  }
  function rectangleArea(row) {
    const values = ['length', 'width', 'count', 'deduction'].map(field => Number(row[field] || 0));
    const [length, width, count, deduction] = values;
    if (values.some(v => !Number.isFinite(v)) || values.some(v => v < 0))
      throw Error('Measurements must be non-negative numbers.');
    if (length > 100000 || width > 100000 || count > 10000 || deduction > 1000000000)
      throw Error('Measurement exceeds allowed limit.');
    if (!length || !width || !count) throw Error('Enter positive length, width and count.');
    const gross = length * width * count;
    if (deduction > gross + 1e-7) throw Error('Deduction cannot exceed the gross area.');
    return Math.round((gross - deduction + Number.EPSILON) * 100) / 100;
  }
  function safeText(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
  return { calculateLine, calculateQuote, quantityMilli, ratePaise, moneyPaise, formatRupees,
    amountInWords, rectangleArea, safeText };
});
