const { Invoice, InvoiceItem, Payment, Reservation, Guest } = require("../models");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = require("express").Router();
const desk = ["admin", "manager", "receptionist"];

function money(cents) {
  return (cents || 0) / 100;
}

async function presentInvoice(invoice) {
  const items = await InvoiceItem.find({ invoiceId: invoice._id });
  const guest = invoice.guestId ? await Guest.findById(invoice.guestId) : null;
  return {
    id: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    reservationId: invoice.reservationId,
    status: invoice.status,
    subtotal: money(invoice.subtotal),
    taxTotal: money(invoice.taxTotal),
    grandTotal: money(invoice.grandTotal),
    amountPaid: money(invoice.amountPaid),
    balanceDue: money(invoice.balanceDue),
    guestName: guest?.fullName || "",
    guestEmail: guest?.email || "",
    items: items.map((item) => ({
      id: item._id,
      category: item.category,
      description: item.description,
      quantity: item.quantity,
      unitPrice: money(item.unitPrice),
      lineTotal: money(item.lineTotal),
    })),
  };
}

router.get("/invoices/by-reservation/:reservationId", requireAuth, async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ reservationId: req.params.reservationId });
    if (!invoice) {
      const error = new Error("Invoice not found.");
      error.status = 404;
      throw error;
    }
    res.json({ invoice: await presentInvoice(invoice) });
  } catch (error) {
    next(error);
  }
});

router.get("/invoices/:id", requireAuth, async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      const error = new Error("Invoice not found.");
      error.status = 404;
      throw error;
    }
    res.json({ invoice: await presentInvoice(invoice) });
  } catch (error) {
    next(error);
  }
});

router.post("/invoices/:id/items", requireAuth, requireRole(...desk), async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice || invoice.status === "void" || invoice.status === "paid") {
      const error = new Error("This invoice cannot take more charges.");
      error.status = 400;
      throw error;
    }
    const quantity = Number(req.body.quantity || 1);
    const unitPrice = Math.round(Number(req.body.unitPrice) * 100);
    const lineTotal = quantity * unitPrice;
    await InvoiceItem.create({
      invoiceId: invoice._id,
      category: req.body.category || "service",
      description: req.body.description || "Extra charge",
      quantity,
      unitPrice,
      taxRate: 0,
      lineTotal,
    });
    invoice.subtotal += lineTotal;
    invoice.grandTotal += lineTotal;
    invoice.balanceDue += lineTotal;
    await invoice.save();
    await Reservation.updateOne({ _id: invoice.reservationId }, { $inc: { totalAmount: lineTotal } });
    res.status(201).json({ invoice: await presentInvoice(invoice) });
  } catch (error) {
    next(error);
  }
});

router.post("/invoices/:id/issue", requireAuth, requireRole(...desk), async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status: "issued", issuedAt: new Date() },
      { new: true },
    );
    if (!invoice) {
      const error = new Error("Invoice not found.");
      error.status = 404;
      throw error;
    }
    res.json({ invoice: await presentInvoice(invoice) });
  } catch (error) {
    next(error);
  }
});

router.post("/payments", requireAuth, requireRole(...desk), async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.body.invoiceId);
    if (!invoice) {
      const error = new Error("Invoice not found.");
      error.status = 404;
      throw error;
    }
    const amount = Math.round(Number(req.body.amount) * 100);
    if (!amount || amount <= 0) {
      const error = new Error("Enter a payment amount.");
      error.status = 400;
      throw error;
    }
    await Payment.create({
      invoiceId: invoice._id,
      amount,
      method: req.body.method || "card",
      reference: req.body.reference || "",
      paidAt: new Date(),
      recordedBy: req.user._id,
    });
    invoice.amountPaid += amount;
    invoice.balanceDue = Math.max(0, invoice.grandTotal - invoice.amountPaid);
    invoice.status = invoice.balanceDue === 0 ? "paid" : "partially_paid";
    if (invoice.status !== "draft" && !invoice.issuedAt) invoice.issuedAt = new Date();
    if (invoice.status === "paid" || invoice.status === "partially_paid") {
      if (invoice.status !== "draft") invoice.status = invoice.balanceDue === 0 ? "paid" : "partially_paid";
    }
    await invoice.save();
    res.status(201).json({ invoice: await presentInvoice(invoice) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
