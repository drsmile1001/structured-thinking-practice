import { expect, test } from "bun:test";
import {
  calculateTax,
  calculateSum,
  type Item,
  vaildateInvoiceNumbers,
  buildInvoice,
} from "@/InvoiceFP";

test("calculateTotal", () => {
  const items: Item[] = [
    {
      name: "apple",
      quantity: 1,
      unitPrice: 10,
    },
    {
      name: "banana",
      quantity: 2,
      unitPrice: 6,
    },
  ];
  const total = calculateSum(items);
  expect(total).toBe(22);
});

test("calculateTax", () => {
  const price = 50;
  const tax = calculateTax(price);
  expect(tax).toBe(2.5); //比對浮點數...
});

test("vaildateInvoiceNumbers", () => {
  const taxedSum50001 = vaildateInvoiceNumbers(50000, 1);
  expect(taxedSum50001).toBeFalse();
  const taxedSum50000 = vaildateInvoiceNumbers(49999, 1);
  expect(taxedSum50000).toBeTrue();
  const taxedSum49999 = vaildateInvoiceNumbers(49998, 1);
  expect(taxedSum49999).toBeTrue();
});

test("buildInvoice", async () => {
  const getSn = () => Promise.resolve(1);
  const now = new Date("2025-05-01");
  const getNow = () => now;
  const items = [
    {
      name: "n",
      quantity: 1,
      unitPrice: 10,
    },
  ];
  const invoice = await buildInvoice(getSn, getNow, items, 33, 3);
  expect(invoice.id).toBe("00001");
  expect(invoice.issuedAt).toBe(now.valueOf());
  expect(invoice.items).toEqual(items);
  expect(invoice.tax).toBe(3);
  expect(invoice.total).toBe(33);
});
