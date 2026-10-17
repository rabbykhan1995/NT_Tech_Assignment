import { useCallback, useEffect, useState } from "react";
import api from "../lib/axios";
import type { Product, SearchParams, SelectOption } from "../types/type";

interface UseProductsOptions {
    searchLabel?: "sale" | "purchase";
}

export function useProducts(options: UseProductsOptions = {}) {
    const { searchLabel = "sale" } = options;
    const [products, setProducts] = useState<SelectOption<Product>[]>([]);
    const [params, setParams] = useState<SearchParams>({
        search: "",
        page: 1,
        limit: 50,
    });

    const fetchProducts = useCallback(async () => {
        const res = await api("/product/list", {
            params: { search: params.search, limit: params.limit, page: params.page },
        });
        if (res.data.success)
            setProducts(
                res.data.data.items.map((u: Product) => ({
                    value: String(u.id),
                    label:
                        searchLabel === "sale"
                            ? `${u.name} (stock-${u.stock ?? 0})`
                            : `${u.name}`,
                    ...u,
                }))
            );
    }, [params.search, params.limit, params.page, searchLabel]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        const timer = setTimeout(() => fetchProducts(), 400);
        return () => clearTimeout(timer);
    }, [params.search, fetchProducts]);

    const handleSearchChange = useCallback((val: string) => {
        setParams((prev) => ({ ...prev, search: val }));
    }, []);

    const fetchSaleProduct = useCallback(async (productID: number) => {
        const res = await api(`/product/productByID/${productID}`);
        if (res.data.success) {
            return res.data.data;
        }
        return null;
    }, []);

    return {
        products,
        search: params.search,
        onSearchChange: handleSearchChange,
        fetchSaleProduct,
        refresh: fetchProducts,
    };
}
