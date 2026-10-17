# Product Module Documentation

## Overview

The Product Module is the core inventory management system of the Super Ecommerce platform. It handles products, variants, batches, stock flows, sales items, and return items across the entire inventory lifecycle.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRODUCT MODULE ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │   Product    │───▶│   Variant    │───▶│    Batch     │                   │
│  │   (Parent)   │    │  (SKU Level) │    │  (Lot/Serial)│                   │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                   │
│         │                   │                   │                            │
│         │                   │                   ▼                            │
│         │                   │            ┌──────────────┐                   │
│         │                   │            │ Stock Flow   │◀─── Audit Trail   │
│         │                   │            │   (Audit)    │                   │
│         │                   │            └──────┬───────┘                   │
│         │                   │                   │                            │
│         ▼                   ▼                   ▼                            │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │                    TRANSACTIONAL OPERATIONS                       │      │
│  │  ┌─────────┐  ┌─────────────┐  ┌────────────┐  ┌──────────────┐  │      │
│  │  │ Purchase│  │    Sale     │  │ Sale Return│  │Purchase Return│  │      │
│  │  │         │  │             │  │            │  │              │  │      │
│  │  │ + Stock │  │  - Stock    │  │  + Stock   │  │  - Stock     │  │      │
│  │  └────┬────┘  └──────┬──────┘  └──────┬─────┘  └──────┬───────┘  │      │
│  │       │              │                │               │            │      │
│  │       └──────────────┴────────────────┴───────────────┘            │      │
│  │                              │                                      │      │
│  │                    ┌─────────▼─────────┐                            │      │
│  │                    │    Stock Flow     │                            │      │
│  │                    │   (Audit Trail)   │                            │      │
│  │                    └───────────────────┘                            │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Relationships

### Core Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `products` | Master product catalog | id, name, slug, stock, salePrice, manageStock, manageWarranty |
| `variants` | SKU-level variants (size, color, etc.) | id, productID, salePrice, stock, barcode, attributes (JSONB) |
| `batches` | Lot/serial tracking for FIFO/FEFO | id, productID, variantID, purchaseID, remainingQty, cost, expireDate, serial |
| `stock_flows` | Immutable audit trail of all stock movements | id, batchID, productID, variantID, type (in/out), referenceType, qty, beforeQty, afterQty |

### Related Transaction Tables

| Table | Stock Flow Reference Type | Effect on Stock |
|-------|--------------------------|-----------------|
| `purchases` | `purchase` | **IN** (+) |
| `sales` | `sale` | **OUT** (-) |
| `sale_returns` | `sale_return` | **IN** (+) |
| `purchase_returns` | `purchase_return` | **OUT** (-) |
| `damages` | `damage` | **OUT** (-) |
| `adjustments` | `adjustment` | **IN/OUT** (±) |

---

## Entity Relationships

```
Product (1) ──────< (N) Variant
    │                   │
    │                   └──────< (N) Batch
    │                              │
    │                              └──────< (N) Stock Flow
    │                              │
    └──────────────────────────────┘
                   │
                   └──────< (N) Stock Flow (direct product-level flow)
```

### Detailed Relationships

```typescript
// Product Relations
product.variants          → Variant[] (one-to-many)
product.batches           → Batch[] (one-to-many)  
product.stockFlows        → StockFlow[] (one-to-many)

// Variant Relations
variant.product           → Product (many-to-one)
variant.batches           → Batch[] (one-to-many)
variant.saleItems         → SaleItem[] (one-to-many)

// Batch Relations
batch.product             → Product (many-to-one)
batch.variant             → Variant (many-to-one)
batch.purchase            → Purchase (many-to-one)
batch.stockFlows          → StockFlow[] (one-to-many)
batch.purchaseReturnItems → PurchaseReturnItem[] (one-to-many)

// Stock Flow Relations
stockFlow.batch           → Batch (many-to-one)
stockFlow.product         → Product (many-to-one)
stockFlow.variant         → Variant (many-to-one)
stockFlow.sale            → Sale (many-to-one)
stockFlow.purchase        → Purchase (many-to-one)
stockFlow.saleReturn      → SaleReturn (many-to-one)
stockFlow.purchaseReturn  → PurchaseReturn (many-to-one)
stockFlow.damage          → Damage (many-to-one)
```

---

## Stock Management Architecture

### Three-Level Stock Tracking

The system maintains stock at three hierarchical levels:

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRODUCT LEVEL                              │
│  productTable.stock (numeric, precision: 12, scale: 3)         │
│  • Aggregate of all variants' stock                            │
│  • Updated on every stock movement                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VARIANT LEVEL                              │
│  variantTable.stock (numeric, precision: 12, scale: 2)         │
│  • SKU-level stock (specific size/color/etc.)                  │
│  • Used for POS and variant-specific operations                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BATCH LEVEL                                │
│  batchTable.remainingQty (numeric, precision: 12, scale: 2)    │
│  • Lot/Serial-level tracking (FIFO/FEFO)                       │
│  • Tracks purchasedQty, soldQty, damagedQty, remainingQty      │
│  • Supports serial numbers for warranty products               │
└─────────────────────────────────────────────────────────────────┘
```

### Stock Flow Audit Trail

Every stock movement creates an immutable record in `stock_flows`:

```typescript
stockFlow = {
  type: "in" | "out",                    // Direction
  referenceType: "purchase" | "sale" | "sale_return" | 
                 "purchase_return" | "damage" | "adjustment" | 
                 "opening_stock" | "stock_transfer",
  qty: number,                            // Quantity moved
  beforeQty: number,                      // Stock BEFORE movement
  afterQty: number,                       // Stock AFTER movement
  // Reference links (only ONE is set per record)
  purchaseID: number | null,
  saleID: number | null,
  saleReturnID: number | null,
  purchaseReturnID: number | null,
  damageID: number | null,
}
```

---

## Stock Flow Scenarios

### 1. PURCHASE (Stock IN)

```
┌─────────────────────────────────────────────────────────────────┐
│                        PURCHASE FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Create Purchase Record                                      │
│     purchaseTable: { totalAmount, paid, supplierID, ... }      │
│                                                                 │
│  2. For each product in purchase:                               │
│     ┌─────────────────────────────────────────────────────┐     │
│     │ CREATE BATCH                                        │     │
│     │ batchTable: {                                       │     │
│     │   purchaseID, productID, variantID,                │     │
│     │   purchasedQty, remainingQty (= purchasedQty),     │     │
│     │   cost, expireDate, serial (optional)              │     │
│     │ }                                                   │     │
│     └─────────────────────────────────────────────────────┘     │
│                           │                                      │
│                           ▼                                      │
│     ┌─────────────────────────────────────────────────────┐     │
│     │ CREATE STOCK FLOW (type: "in", referenceType: "purchase")│
│     │ stockFlowTable: {                                    │     │
│     │   batchID, productID, variantID,                     │     │
│     │   type: "in", referenceType: "purchase",             │     │
│     │   purchaseID, qty: purchasedQty,                     │     │
│     │   beforeQty: 0, afterQty: purchasedQty               │     │
│     │ }                                                    │     │
│     └─────────────────────────────────────────────────────┘     │
│                           │                                      │
│                           ▼                                      │
│     ┌─────────────────────────────────────────────────────┐     │
│     │ UPDATE STOCK LEVELS (all three levels)              │     │
│     │ • productTable.stock += purchasedQty                │     │
│     │ • variantTable.stock += purchasedQty                │     │
│     │ • batchTable.remainingQty = purchasedQty            │     │
│     └─────────────────────────────────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Code Reference**: `PurchaseService.create()` → `ProductService.createBatch()` → `ProductService.createStockFlow()` → `ProductService.increaseProductStock()` / `increaseVariantStock()`

---

### 2. SALE (Stock OUT - Batch Specific)

```
┌─────────────────────────────────────────────────────────────────┐
│                        SALE FLOW (Batch Specific)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Create Sale Record                                          │
│     saleTable: { totalAmount, paid, customerID, ... }          │
│                                                                 │
│  2. For each sale item (product + batch + variant):            │
│     ┌─────────────────────────────────────────────────────┐     │
│     │ VALIDATE STOCK                                       │     │
│     │ if (batch.remainingQty < soldQty) throw Error       │     │
│     └─────────────────────────────────────────────────────┘     │
│                           │                                      │
│                           ▼                                      │
│     ┌─────────────────────────────────────────────────────┐     │
│     │ UPDATE STOCK LEVELS (all three levels)              │     │
│     │ • productTable.stock -= soldQty                     │     │
│     │ • variantTable.stock -= soldQty                     │     │
│     │ • batchTable.remainingQty -= soldQty                │     │
│     └─────────────────────────────────────────────────────┘     │
│                           │                                      │
│                           ▼                                      │
│     ┌─────────────────────────────────────────────────────┐     │
│     │ CREATE STOCK FLOW (type: "out", referenceType: "sale")│   │
│     │ stockFlowTable: {                                    │     │
│     │   batchID, productID, variantID,                     │     │
│     │   type: "out", referenceType: "sale",                │     │
│     │   saleID, qty: soldQty,                              │     │
│     │   beforeQty: batch.remainingQty (BEFORE),            │     │
│     │   afterQty: batch.remainingQty - soldQty             │     │
│     │ }                                                    │     │
│     └─────────────────────────────────────────────────────┘     │
│                           │                                      │
│                           ▼                                      │
│     ┌─────────────────────────────────────────────────────┐     │
│     │ CREATE SALE ITEM                                     │     │
│     │ saleItemsTable: {                                    │     │
│     │   saleID, batchID, productID, variantID,            │     │
│     │   soldQty, salePrice, warranty                      │     │
│     │ }                                                    │     │
│     └─────────────────────────────────────────────────────┘     │
│                                                                 │
│     ┌─────────────────────────────────────────────────────┐     │
│     │ WARRANTY CREATION (if product.manageWarranty &&     │     │
│     │  batch.serial exists)                                │     │
│     │ warrantyTable: { saleID, serial, expireDate, ... } │     │
│     └─────────────────────────────────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Code Reference**: `SaleService.create()` → validates `batch.remainingQty` → `ProductService.decreaseBatchStock()` / `decreaseProductStock()` / `decreaseVariantStock()` → `ProductService.createStockFlow()` → `SaleRepository.createSaleItem()` → `WarrantyService.create()` (if applicable)

---

### 3. SALE - FIFO (First In, First Out)

When no specific batch is selected, system auto-allocates from oldest batches:

```
┌─────────────────────────────────────────────────────────────────┐
│                        SALE FLOW (FIFO)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Get FIFO batches for variant:                               │
│     SELECT * FROM batches                                        │
│     WHERE variantID = ? AND remainingQty > 0                    │
│     ORDER BY purchaseDate ASC                                    │
│     FOR UPDATE (row-level lock)                                 │
│                                                                 │
│  2. Allocate quantity across batches:                           │
│     remainingQty = soldQty                                      │
│     FOR each batch IN fifoBatches:                              │
│       IF remainingQty <= 0 BREAK                                │
│       available = batch.remainingQty                            │
│       qty = MIN(available, remainingQty)                        │
│       allocations.push({ batchID: batch.id, qty, ... })        │
│       remainingQty -= qty                                       │
│     IF remainingQty > 0 THROW "Insufficient stock"             │
│                                                                 │
│  3. For each allocation:                                        │
│     • Decrease batch.remainingQty                               │
│     • Decrease product.stock                                    │
│     • Decrease variant.stock                                    │
│     • Create stock_flow (type: "out", referenceType: "sale")   │
│     • Create sale_item                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Code Reference**: `SaleService.fifoSale()` → `ProductService.getFifoBatchesByVariantID()` → allocation loop → `ProductService.decreaseBatchStock()` / `decreaseProductStock()` / `decreaseVariantStock()` → `ProductService.createStockFlow()` → `SaleRepository.createSaleItem()`

---

### 4. SALE RETURN (Stock IN)

```
┌─────────────────────────────────────────────────────────────────┐
│                        SALE RETURN FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Validate original sale exists                               │
│                                                                 │
│  2. For each return item (batch + product + variant):          │
│     ┌─────────────────────────────────────────────────────┐     │
│     │ UPDATE STOCK LEVELS (all three levels)              │     │
│     │ • productTable.stock += returnedQty                 │     │
│     │ • variantTable.stock += returnedQty                 │     │
│     │ • batchTable.remainingQty += returnedQty            │     │
│     └─────────────────────────────────────────────────────┘     │
│                           │                                      │
│                           ▼                                      │
│     ┌─────────────────────────────────────────────────────┐     │
│     │ CREATE STOCK FLOW (type: "in", referenceType:       │     │
│     │   "sale_return")                                    │     │
│     │ stockFlowTable: {                                    │     │
│     │   batchID, productID, variantID,                     │     │
│     │   type: "in", referenceType: "sale_return",          │     │
│     │   saleReturnID, qty: returnedQty,                    │     │
│     │   beforeQty, afterQty: beforeQty + returnedQty       │     │
│     │ }                                                    │     │
│     └─────────────────────────────────────────────────────┘     │
│                           │                                      │
│                           ▼                                      │
│     ┌─────────────────────────────────────────────────────┐     │
│     │ CREATE SALE RETURN ITEM                              │     │
│     │ saleReturnItemsTable: {                              │     │
│     │   saleReturnID, batchID, productID,                 │     │
│     │   saleReturnedQty, salePrice, reason                │     │
│     │ }                                                    │     │
│     └─────────────────────────────────────────────────────┘     │
│                                                                 │
│  3. Handle warranty reversal (if serial product returned)      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Code Reference**: `SaleReturnService.create()` → `ProductService.increaseBatchStock()` / `increaseProductStock()` / `increaseVariantStock()` → `ProductService.createStockFlow()` → `SaleReturnRepository` creates return items

---

### 5. PURCHASE RETURN (Stock OUT)

```
┌─────────────────────────────────────────────────────────────────┐
│                      PURCHASE RETURN FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Validate original purchase exists                           │
│                                                                 │
│  2. For each return item (batch + product + variant):          │
│     ┌─────────────────────────────────────────────────────┐     │
│     │ UPDATE STOCK LEVELS (all three levels)              │     │
│     │ • productTable.stock -= returnedQty                 │     │
│     │ • variantTable.stock -= returnedQty                 │     │
│     │ • batchTable.remainingQty -= returnedQty            │     │
│     └─────────────────────────────────────────────────────┘     │
│                           │                                      │
│                           ▼                                      │
│     ┌─────────────────────────────────────────────────────┐     │
│     │ CREATE STOCK FLOW (type: "out", referenceType:      │     │
│     │   "purchase_return")                                │     │
│     │ stockFlowTable: {                                    │     │
│     │   batchID, productID, variantID,                     │     │
│     │   type: "out", referenceType: "purchase_return",     │     │
│     │   purchaseReturnID, qty: returnedQty,                │     │
│     │   beforeQty, afterQty: beforeQty - returnedQty       │     │
│     │ }                                                    │     │
│     └─────────────────────────────────────────────────────┘     │
│                           │                                      │
│                           ▼                                      │
│     ┌─────────────────────────────────────────────────────┐     │
│     │ CREATE PURCHASE RETURN ITEM                          │     │
│     │ purchaseReturnItemsTable: {                          │     │
│     │   purchaseReturnID, batchID, productID, variantID,  │     │
│     │   purchaseReturnedQty, purchasePrice, reason         │     │
│     │ }                                                    │     │
│     └─────────────────────────────────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Code Reference**: `PurchaseReturnService.create()` → `ProductService.decreaseBatchStock()` / `decreaseProductStock()` / `decreaseVariantStock()` → `ProductService.createStockFlow()` → `PurchaseReturnRepository` creates return items

---

### 6. DAMAGE / EXPIRY (Stock OUT)

```
┌─────────────────────────────────────────────────────────────────┐
│                      DAMAGE FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Create Damage Record                                        │
│     damageTable: { batchID, productID, variantID,              │
│       damagedQty, damageLoss, purchasePrice, reason,           │
│       damageDate, deletable }                                   │
│                                                                 │
│  2. Update Stock Levels:                                        │
│     • productTable.stock -= damagedQty                          │
│     • variantTable.stock -= damagedQty                          │
│     • batchTable.remainingQty -= damagedQty                     │
│                                                                 │
│  3. Create Stock Flow (type: "out", referenceType: "damage")   │
│     stockFlowTable: {                                           │
│       batchID, productID, variantID,                            │
│       type: "out", referenceType: "damage",                     │
│       damageID, qty: damagedQty,                                │
│       beforeQty, afterQty: beforeQty - damagedQty               │
│     }                                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 7. STOCK ADJUSTMENT (Stock IN/OUT)

```
┌─────────────────────────────────────────────────────────────────┐
│                    STOCK ADJUSTMENT FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Used for:                                                      │
│  • Cycle count corrections                                      │
│  • Opening stock entry                                          │
│  • Write-offs                                                   │
│  • Inter-location transfers                                     │
│                                                                 │
│  Flow:                                                          │
│  1. Create Stock Flow (type: "in" OR "out",                    │
│     referenceType: "adjustment" OR "opening_stock"             │
│     OR "stock_transfer")                                        │
│  2. Update all three stock levels (± qty)                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## State Transitions

### Product Status Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌──────────┐
│  DRAFT  │────▶│ ACTIVE  │────▶│INACTIVE │────▶│ ARCHIVED │
└─────────┘     └─────────┘     └─────────┘     └──────────┘
     │             │             │              │
     ▼             ▼             ▼              ▼
  Not visible  Live product  Hidden from    Read-only
  in POS/catalog   for sale    customers      history
```

### Batch Status Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  ACTIVE  │────▶│  ACTIVE  │────▶│ INACTIVE │
│ (stock>0)│     │ (stock=0)│     │ (manual) │
└──────────┘     └──────────┘     └──────────┘
```

### Stock Flow Immutability

**Stock Flow records are IMMUTABLE** once created:
- Never updated, never deleted (except via transaction rollback)
- Provide complete audit trail
- Enable stock reconciliation at any point in time
- Reference back to source transaction (sale, purchase, return, damage)

---

## Transactional Integrity

All stock operations run within **database transactions** (`withTransaction` utility):

```typescript
await withTransaction(async (tx) => {
  // All operations share same transaction
  await ProductService.decreaseBatchStock(batchID, qty, tx);
  await ProductService.decreaseProductStock(productID, qty, tx);
  await ProductService.decreaseVariantStock(variantID, qty, tx);
  await ProductService.createStockFlow(stockFlowPayload, tx);
  await SaleRepository.createSaleItem(saleItemPayload, tx);
});
```

**Benefits**:
- Atomic: All succeed or all rollback
- Consistent: Stock levels never drift
- Isolated: Row-level locks (`FOR UPDATE`) prevent race conditions on FIFO
- Durable: Committed transactions survive crashes

---

## FIFO/FEFO Implementation

### Batch Selection Logic

```typescript
// For FIFO (First In, First Out)
SELECT * FROM batches 
WHERE variantID = ? 
  AND remainingQty > 0 
  AND serial IS NULL      // Non-serialized products
ORDER BY purchaseDate ASC
FOR UPDATE                // Lock rows

// For FEFO (First Expired, First Out) - serialized
SELECT * FROM batches 
WHERE productID = ? 
  AND isActive = true 
  AND serial IS NOT NULL  // Serialized products
  AND remainingQty > 0
ORDER BY expireDate ASC
```

### Allocation Algorithm

```typescript
function allocateFIFO(batches: Batch[], requiredQty: number): Allocation[] {
  const allocations = [];
  let remaining = requiredQty;
  
  for (const batch of batches) {
    if (remaining <= 0) break;
    
    const available = batch.remainingQty;
    if (available <= 0) continue;
    
    const qty = Math.min(available, remaining);
    allocations.push({
      batchID: batch.id,
      qty,
      costPrice: batch.cost,
      beforeQty: batch.remainingQty,
      afterQty: batch.remainingQty - qty
    });
    remaining -= qty;
  }
  
  if (remaining > 0) throw new Error("Insufficient stock");
  return allocations;
}
```

---

## Service Layer API

### ProductService

```typescript
// Product CRUD
static async create(payload: CreateProductInput): Promise<Product>
static async update(id: number, payload: UpdateInput): Promise<Product>
static async list(query: ListQuery): Promise<PaginatedResult>
static async findById(id: number): Promise<Product | null>
static async structuredProductByID(id: number): Promise<ProductWithRelations>

// Stock Operations (Product Level)
static async increaseProductStock(productID: number, qty: number, tx?: QueryClient)
static async decreaseProductStock(productID: number, qty: number, tx?: QueryClient)

// Stock Operations (Variant Level)
static async increaseVariantStock(variantID: number, qty: number, tx?: QueryClient)
static async decreaseVariantStock(variantID: number, qty: number, tx?: QueryClient)

// Stock Operations (Batch Level)
static async increaseBatchStock(batchID: number, qty: number, tx?: QueryClient)
static async decreaseBatchStock(batchID: number, qty: number, tx?: QueryClient)

// Batch Operations
static async createBatch(payload: BatchPayload, tx?: QueryClient): Promise<Batch>
static async findBatchByID(id: number, tx?: QueryClient): Promise<Batch | null>
static async findBatchByIDForSale(id: number, tx?: QueryClient): Promise<Batch | null>
static async findBatchesByVariantID(variantID: number, tx?: QueryClient): Promise<Batch[]>
static async getFifoBatchesByVariantID(variantID: number): Promise<Batch[]>
static async updateBatchDynamically(batchID: number, options: UpdateOptions, tx?: QueryClient)
static async deleteBatches(batchIDs: number[], tx?: QueryClient)

// Stock Flow
static async createStockFlow(payload: stockFlowPayload, tx?: QueryClient): Promise<StockFlow>
static async findStockFlowByBatchID(batchID: number, tx?: QueryClient): Promise<StockFlow[]>
static async findStockFlowDynamically(batchID: number, column: StockFlowColumn, columnID: number, tx?: QueryClient)

// Variant Operations
static async findVariantByID(variantID: number, tx?: QueryClient): Promise<Variant | null>
static async findVariantByBarcode(barcode: string, tx?: QueryClient): Promise<Variant | null>
static async updateProductFifoBatchAndStock(productID: number, options, tx?: QueryClient)
```

---

## Usage Through Project Modules

### Module Integration Map

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         MODULE INTEGRATION MAP                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  PURCHASE ──────▶ Creates Batches + Stock Flows (IN) + Increases Stock    │
│      │                                                                      │
│      │                                                                      │
│  SALE ──────────▶ Consumes Batches (FIFO or specific) + Stock Flows (OUT)  │
│      │              + Decreases Stock + Creates Sale Items + Warranties    │
│      │                                                                      │
│      │                                                                      │
│  SALE RETURN ──▶ Returns to Batches + Stock Flows (IN) + Increases Stock   │
│      │              + Creates Sale Return Items                            │
│      │                                                                      │
│      │                                                                      │
│  PURCHASE RETURN▶ Removes from Batches + Stock Flows (OUT) + Decreases     │
│      │              Stock + Creates Purchase Return Items                  │
│      │                                                                      │
│      │                                                                      │
│  DAMAGE ───────▶ Removes from Batches + Stock Flows (OUT) + Decreases      │
│                  Stock + Creates Damage Record                             │
│                                                                            │
│  ADJUSTMENT ───▶ Direct Stock Modification + Stock Flow (IN/OUT)           │
│                  (referenceType: adjustment/opening_stock/stock_transfer)  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Module Interactions

#### Purchase Module → Product Module
```typescript
// PurchaseService.create()
1. ProductService.createBatch(batchPayload)        // Creates batch record
2. ProductService.createStockFlow({                // Audit trail
     type: "in", 
     referenceType: "purchase",
     beforeQty: 0,
     afterQty: purchasedQty
   })
3. ProductService.increaseProductStock(productID, qty)
4. ProductService.increaseVariantStock(variantID, qty)
// batch.remainingQty set to purchasedQty on creation
```

#### Sale Module → Product Module
```typescript
// SaleService.create() - Batch Specific
1. ProductService.findBatchByIDForSale(batchID)    // Locks row (FOR UPDATE)
2. Validate: batch.remainingQty >= soldQty
3. ProductService.decreaseBatchStock(batchID, soldQty)
4. ProductService.decreaseProductStock(productID, soldQty)
5. ProductService.decreaseVariantStock(variantID, soldQty)
6. ProductService.createStockFlow({
     type: "out", 
     referenceType: "sale",
     beforeQty: batch.remainingQty,
     afterQty: batch.remainingQty - soldQty
   })
7. SaleRepository.createSaleItem({...})

// SaleService.fifoSale() - FIFO Allocation
1. ProductService.getFifoBatchesByVariantID(variantID)  // Locks rows
2. Allocate across batches
3. For each allocation: steps 3-7 above
```

#### Sale Return Module → Product Module
```typescript
// SaleReturnService.create()
1. ProductService.increaseBatchStock(batchID, returnedQty)
2. ProductService.increaseProductStock(productID, returnedQty)
3. ProductService.increaseVariantStock(variantID, returnedQty)
4. ProductService.createStockFlow({
     type: "in",
     referenceType: "sale_return",
     beforeQty: batch.remainingQty,
     afterQty: batch.remainingQty + returnedQty
   })
5. SaleReturnRepository creates sale_return_items record
```

#### Purchase Return Module → Product Module
```typescript
// PurchaseReturnService.create()
1. ProductService.decreaseBatchStock(batchID, returnedQty)
2. ProductService.decreaseProductStock(productID, returnedQty)
3. ProductService.decreaseVariantStock(variantID, returnedQty)
4. ProductService.createStockFlow({
     type: "out",
     referenceType: "purchase_return",
     beforeQty: batch.remainingQty,
     afterQty: batch.remainingQty - returnedQty
   })
5. PurchaseReturnRepository creates purchase_return_items record
```

#### Damage Module → Product Module
```typescript
// DamageService.create()
1. ProductService.decreaseBatchStock(batchID, damagedQty)
2. ProductService.decreaseProductStock(productID, damagedQty)
3. ProductService.decreaseVariantStock(variantID, damagedQty)
4. ProductService.createStockFlow({
     type: "out",
     referenceType: "damage",
     beforeQty: batch.remainingQty,
     afterQty: batch.remainingQty - damagedQty
   })
5. DamageRepository creates damage record
```

---

## API Endpoints

### Product Routes (`/api/v1/products`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create product with variants |
| GET | `/` | List products (paginated, searchable) |
| GET | `/:id` | Get product with full structure |
| PUT | `/:id` | Update product and variants |
| GET | `/pos` | Get POS-enabled products |
| PUT | `/:id/pos` | Toggle POS visibility |
| GET | `/variants` | List variants (paginated, searchable) |

### Batch Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/batches/variant/:variantId` | Get batches for variant (FIFO) |
| GET | `/batches/serial/:serial` | Find batch by serial number |
| GET | `/batches/purchase/:purchaseId` | Get batches by purchase ID |

### Stock Flow Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stock-flows/batch/:batchId` | Get stock flows for batch |
| GET | `/stock-flows/purchase/:purchaseId` | Get stock flows for purchase |

---

## Data Types

### Product Type

```typescript
interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords: string[];
  brandID?: number;
  unitID: number;
  categoryID?: number;
  manageStock: boolean;
  manageWarranty: boolean;
  thumbnail?: string;
  video?: string;
  stock: number;                    // Aggregate stock (precision: 12, scale: 3)
  totalSold: number;
  alertQty: number;                 // Low stock alert threshold
  decimal: boolean;                 // Allows fractional quantities
  purchasePrice: number;
  salePrice: number;
  isPublished: boolean;
  inPosList: boolean;
  status: "active" | "inactive" | "draft" | "archived";
  featured: boolean;
  showStock: boolean;
  sortOrder: number;
  averageRating: number;
  totalReviews: number;
  sku?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Variant Type

```typescript
interface Variant {
  id: number;
  productID: number;
  salePrice: number;
  stock: number;                    // Variant-level stock (precision: 12, scale: 2)
  barcode: string;                  // Auto-generated: VAR-100001+
  weight: number;                   // In kg
  attributes: Array<{ name: string; value: string }>;  // e.g., [{name: "Color", value: "Red"}, {name: "Size", value: "L"}]
  createdAt: Date;
  updatedAt: Date;
}
```

### Batch Type

```typescript
interface Batch {
  id: number;
  serial?: string;                  // Unique serial for warranty items
  productID: number;
  variantID: number;
  purchaseID?: number;
  cost: number;                     // Purchase cost per unit
  purchasedQty: number;             // Original purchase quantity
  remainingQty: number;             // Current available quantity
  purchaseDate: Date;
  expireDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Stock Flow Type

```typescript
interface StockFlow {
  id: number;
  batchID: number;
  productID: number;
  variantID?: number;
  type: "in" | "out";
  referenceType: "purchase" | "purchase_return" | "sale" | "sale_return" | 
                 "damage" | "adjustment" | "opening_stock" | "stock_transfer";
  // Only ONE of these is set:
  saleID?: number;
  purchaseID?: number;
  saleReturnID?: number;
  purchaseReturnID?: number;
  damageID?: number;
  qty: number;
  beforeQty: number;                // Stock level BEFORE this movement
  afterQty: number;                 // Stock level AFTER this movement
  remarks?: string;
  createdAt: Date;
}
```

### Sale Item Type

```typescript
interface SaleItem {
  id: number;
  saleID: number;
  productID: number;
  variantID: number;
  batchID: number;
  soldQty: number;
  salePrice: number;
  warranty: number;                 // Warranty period in months/days
}
```

### Sale Return Item Type

```typescript
interface SaleReturnItem {
  id: number;
  saleReturnID: number;
  batchID: number;
  productID: number;
  saleReturnedQty: number;
  salePrice: number;
  reason?: string;
}
```

### Purchase Return Item Type

```typescript
interface PurchaseReturnItem {
  id: number;
  purchaseReturnID: number;
  batchID: number;
  productID: number;
  variantID: number;
  purchaseReturnedQty: number;
  purchasePrice: number;
  reason?: string;
}
```

---

## Stock Reconciliation

### Verification Queries

```sql
-- Verify product stock matches sum of variant stocks
SELECT p.id, p.name, p.stock as product_stock, 
       SUM(v.stock) as variant_stock_sum
FROM products p
LEFT JOIN variants v ON v.product_id = p.id
GROUP BY p.id, p.name, p.stock
HAVING p.stock != SUM(v.stock);

-- Verify variant stock matches sum of batch remaining quantities
SELECT v.id, v.barcode, v.stock as variant_stock,
       SUM(b.remaining_qty) as batch_stock_sum
FROM variants v
LEFT JOIN batches b ON b.variant_id = v.id
GROUP BY v.id, v.barcode, v.stock
HAVING v.stock != SUM(b.remaining_qty);

-- Full stock audit trail for a batch
SELECT sf.*, 
       CASE sf.reference_type
         WHEN 'sale' THEN s.invoice_no
         WHEN 'purchase' THEN p.invoice_no
         WHEN 'sale_return' THEN sr.return_no
         WHEN 'purchase_return' THEN pr.return_no
         WHEN 'damage' THEN d.id::text
       END as reference_number
FROM stock_flows sf
LEFT JOIN sales s ON sf.sale_id = s.id
LEFT JOIN purchases p ON sf.purchase_id = p.id
LEFT JOIN sale_returns sr ON sf.sale_return_id = sr.id
LEFT JOIN purchase_returns pr ON sf.purchase_return_id = pr.id
LEFT JOIN damages d ON sf.damage_id = d.id
WHERE sf.batch_id = ?
ORDER BY sf.created_at;
```

---

## Performance Considerations

### Indexes

```sql
-- Product indexes
CREATE INDEX products_category_id_idx ON products(category_id);
CREATE INDEX products_brand_id_idx ON products(brand_id);
CREATE INDEX products_status_idx ON products(status);
CREATE INDEX products_slug_unique ON products(slug);

-- Variant indexes
CREATE INDEX variants_product_id_idx ON variants(product_id);
CREATE INDEX variants_barcode_unique ON variants(barcode);

-- Batch indexes
CREATE INDEX batches_product_id_idx ON batches(product_id);
CREATE INDEX batches_variant_id_idx ON batches(variant_id);
CREATE INDEX batches_purchase_id_idx ON batches(purchase_id);
CREATE INDEX batches_remaining_qty_idx ON batches(remaining_qty) WHERE remaining_qty > 0;

-- Stock Flow indexes
CREATE INDEX stock_flows_batch_idx ON stock_flows(batch_id);
CREATE INDEX stock_flows_product_idx ON stock_flows(product_id);
CREATE INDEX stock_flows_variant_idx ON stock_flows(variant_id);
CREATE INDEX stock_flows_sale_idx ON stock_flows(sale_id);
CREATE INDEX stock_flows_purchase_idx ON stock_flows(purchase_id);
CREATE INDEX stock_flows_sale_return_idx ON stock_flows(sale_return_id);
CREATE INDEX stock_flows_purchase_return_idx ON stock_flows(purchase_return_id);
CREATE INDEX stock_flows_damage_idx ON stock_flows(damage_id);
```

### Query Optimization

1. **FIFO Queries**: Use `FOR UPDATE` with `ORDER BY purchase_date ASC` for row locking
2. **Stock Summaries**: Cache aggregated stock in Redis (via `RedisReportService`)
3. **Batch Lookups**: Index on `(variant_id, remaining_qty)` for FIFO queries
4. **Pagination**: Use cursor-based pagination for large datasets

---

## Error Handling

### Common Stock Errors

| Error Code | Message | Cause | Resolution |
|------------|---------|-------|------------|
| 400 | "Insufficient stock for {product}. Available: {qty}" | Sale qty > batch.remainingQty | Check stock before sale, use FIFO |
| 400 | "Product already exists with this name" | Duplicate product name | Use unique name |
| 400 | "Please try with some different barcode" | Duplicate variant barcode | Generate new barcode |
| 404 | "Batch not found" | Invalid batch ID | Verify batch exists and is active |
| 404 | "Product not found" | Invalid product ID | Verify product exists |
| 400 | "This product can not be added to pos" | Warranty product in POS | Disable manageWarranty or don't add to POS |

---

## Testing Scenarios

### Stock Flow Integrity Tests

1. **Purchase → Sale → Sale Return Cycle**
   - Purchase 100 units → Stock: 100
   - Sell 30 units → Stock: 70
   - Return 10 units → Stock: 80
   - Verify: Stock flows = [IN:100, OUT:30, IN:10], Net = 80

2. **FIFO Allocation**
   - Purchase Batch A: 50 units @ $10 (Jan 1)
   - Purchase Batch B: 50 units @ $12 (Jan 15)
   - Sell 70 units via FIFO
   - Verify: Batch A remaining = 0, Batch B remaining = 30

3. **Concurrent Sales**
   - Two simultaneous sales for same variant
   - Verify: Row locks prevent overselling, total sold ≤ stock

4. **Purchase Return After Partial Sale**
   - Purchase 100 units
   - Sell 40 units
   - Return 30 units to supplier (from remaining 60)
   - Verify: Stock = 30, Batch remaining = 30

5. **Damage Processing**
   - Stock: 100 units
   - Damage 5 units (expired)
   - Verify: Stock = 95, Damage record created, Stock flow type=OUT

---

## Migration & Deployment Notes

### Database Migrations

All schema changes managed via Drizzle Kit:

```bash
# Generate migration
cd backend && bun run drizzle:generate

# Apply migration
cd backend && bun run drizzle:migrate

# Studio for inspection
cd backend && bun run drizzle:studio
```

### Seeding Data

```bash
# Run seeders
cd backend && bun run seed
```

---

## Summary

The Product Module provides a **three-tier inventory system** (Product → Variant → Batch) with **immutable audit trails** (Stock Flows) supporting:

- **FIFO/FEFO** cost allocation
- **Serial tracking** for warranties
- **Multi-channel sales** (POS + E-commerce)
- **Complete return flows** (Sale Return + Purchase Return)
- **Damage/Expiry handling**
- **Stock adjustments** and opening balances
- **Real-time stock levels** at all three tiers
- **Financial integration** (Cost tracking, COGS calculation)
- **Reporting** via Redis-cached aggregates

All operations are **transactional**, **auditable**, and **race-condition safe** through row-level locking.