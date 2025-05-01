export type Item = { name: string; quantity: number; unitPrice: number };

export type InvoiceInput = {
  items: Item[];
};

export type Invoice = {
  id: string;
  issuedAt: number;
  total: number;
  tax: number;
  items: Item[];
};

export type InvoiceResult = Result<Invoice, "OVER_LIMIT">;
export type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

export function calculateSum(items: Item[]) {
  return items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
}

export function calculateTax(total: number) {
  return total * 0.05;
}

export function vaildateInvoiceNumbers(total: number, tax: number) {
  const taxedSum = total + tax;
  return taxedSum <= 50000;
}

type GetNextSerialNumber = () => Promise<number>;
type GetNow = () => Date;

export async function buildInvoice(
  getSn: GetNextSerialNumber,
  getNow: GetNow,
  items: Item[],
  total: number,
  tax: number
): Promise<Invoice> {
  const sn = await getSn();
  const id = sn.toString().padStart(5, "0");
  const issuedAt = getNow().valueOf();
  return {
    id,
    issuedAt,
    items,
    total,
    tax,
  };
}

export async function createInvoice(
  input: InvoiceInput,
  getSn: GetNextSerialNumber,
  getNow: GetNow
): Promise<InvoiceResult> {
  const sum = calculateSum(input.items);
  const tax = calculateTax(sum);
  const vaild = vaildateInvoiceNumbers(sum, tax);
  if (!vaild)
    return {
      error: "OVER_LIMIT",
      success: false,
    };
  const invoice = await buildInvoice(getSn, getNow, input.items, sum, tax);
  return {
    success: true,
    data: invoice,
  };
}
