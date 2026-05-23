export const STOCK_STATUSES = {
    "IN_STOCK" : "in_stock",
    "LOW_STOCK" : "low_stock",
    "OUT_OF_STOCK" : "out_of_stock"
}

export type StockStatus = (typeof STOCK_STATUSES)[keyof typeof STOCK_STATUSES];