function priceStay(baseRate, nights, rate) {
  const subtotal = baseRate * nights;
  const taxes = Math.round(subtotal * rate);
  return { subtotal, taxes, totalAmount: subtotal + taxes };
}

module.exports = { priceStay };
