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
export type Result<T, E> = OkResult<T> | FailResult<E>;
export type OkResult<T> = {
  success: true;
  data: T;
};
export type FailResult<E> = {
  success: false;
  error: E;
};

export function Ok<T>(data: T): OkResult<T> {
  return {
    success: true,
    data,
  };
}

export function Fail<E>(error: E): FailResult<E> {
  return {
    success: false,
    error,
  };
}

export function calculateSum(items: Item[]) {
  return items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
}

export function calculateTax(total: number) {
  return total * 0.05;
}

export function vaildateInvoiceNumbers(total: number, tax: number): boolean {
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
type AsyncFunc<I, O> = (input: I) => Promise<O> | O;
type AsyncProcessor<T> = AsyncFunc<T, T>;

async function pipeAsync<TState>(
  input: TState,
  ...processors: AsyncProcessor<TState>[]
): Promise<TState> {
  let result = input;
  for (const processor of processors) {
    result = await processor(result);
  }
  return result;
}

async function conditionalProcessor<TState>(
  input: TState,
  predictor: AsyncFunc<TState, boolean>,
  trulyFunc: AsyncProcessor<TState>,
  falslyFunc: AsyncProcessor<TState>
) {
  const condition = await predictor(input);
  if (condition) return await trulyFunc(input);
  else return await falslyFunc(input);
}

export async function createInvoice(
  input: InvoiceInput,
  getSn: GetNextSerialNumber,
  getNow: GetNow
): Promise<InvoiceResult> {
  const result = await pipeAsync(
    {
      items: input.items,
      getSn,
      getNow,
      sum: 0,
      tax: 0,
      invoice: null as Invoice | null,
      error: null as "OVER_LIMIT" | null,
    },
    (s) => {
      const sum = calculateSum(s.items);
      return { ...s, sum };
    },
    (s) => {
      const tax = calculateTax(s.sum);
      return { ...s, tax };
    },
    (s) =>
      conditionalProcessor(
        s,
        () => vaildateInvoiceNumbers(s.sum, s.tax),
        async (s) => {
          const invoice = await buildInvoice(
            s.getSn,
            s.getNow,
            s.items,
            s.sum,
            s.tax
          );
          return {
            ...s,
            invoice,
          };
        },
        (s) => ({
          ...s,
          error: "OVER_LIMIT" as const,
        })
      )
  );

  return result.invoice ? Ok(result.invoice) : Fail(result.error!);
}
