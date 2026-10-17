import type { Signal } from "@preact/signals-react";
import { useState } from "react";

interface SaleProductLike {
    salePrice?: number;
    soldQty?: number;
    purchasePrice?: number;
    purchaseQty?: number;
}

interface UseSaleSummaryOptions {
    selectedProducts: Signal<SaleProductLike[]>;
    selectedContact?: { balance?: number } | null;
    priceField?: "salePrice" | "purchasePrice";
    qtyField?: "soldQty" | "purchaseQty";
}

export function useSaleSummary({
    selectedProducts,
    selectedContact,
    priceField = "salePrice",
    qtyField = "soldQty",
}: UseSaleSummaryOptions) {
    const [discount, setDiscount] = useState<number>(0);
    const [discountPercent, setDiscountPercent] = useState<number>(0);
    const [otherCost, setOtherCost] = useState<number>(0);
    const [costName, setCostName] = useState<string | null>("");

    const totalProductPrice = selectedProducts.value.reduce(
        (acc, p) => acc + ((p as Record<string, unknown>)[priceField] as number || 0) * ((p as Record<string, unknown>)[qtyField] as number || 0),
        0
    );

    // Unified convention: customer balance > 0 = payable (we owe), < 0 = receivable (customer owes us)
    const prevBalance = selectedContact?.balance ?? 0;
    const prevDue = prevBalance < 0 ? -prevBalance : 0;
    const usableBalance = prevBalance > 0 ? prevBalance : 0;

    const basePayable = totalProductPrice - discount + otherCost;
    const totalPayableAmount = basePayable + prevDue - usableBalance;

    const handleDiscountPercentChange = (percent: number) => {
        setDiscountPercent(percent);
        setDiscount(parseFloat(((percent / 100) * totalProductPrice).toFixed(2)));
    };

    const handleDiscountAmountChange = (val: number) => {
        setDiscount(val);
        setDiscountPercent(
            totalProductPrice > 0
                ? parseFloat(((val / totalProductPrice) * 100).toFixed(2))
                : 0
        );
    };

    const reset = () => {
        setDiscount(0);
        setDiscountPercent(0);
        setOtherCost(0);
        setCostName("");
    };

    return {
        discount,
        setDiscount,
        discountPercent,
        setDiscountPercent,
        otherCost,
        setOtherCost,
        costName,
        setCostName,
        totalProductPrice,
        prevBalance,
        prevDue,
        usableBalance,
        basePayable,
        totalPayableAmount,
        handleDiscountPercentChange,
        handleDiscountAmountChange,
        reset,
    };
}
