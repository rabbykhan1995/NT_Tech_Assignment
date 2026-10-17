import { useCallback, useEffect, useState } from "react";
import api from "../lib/axios";
import type { PaginatedResult } from "../types/type";

interface UsePaginatedListOptions {
    initialLimit?: number;
    initialPage?: number;
    debounceMs?: number;
}

export function usePaginatedList<T>(
    url: string,
    options: UsePaginatedListOptions = {}
) {
    const { initialLimit = 10, initialPage = 1, debounceMs = 400 } = options;

    const [data, setData] = useState<PaginatedResult<T>>({
        items: [],
        total: 0,
        page: initialPage,
        limit: initialLimit,
    });
    const [search, setSearch] = useState("");
    const [limit, setLimit] = useState(initialLimit);
    const [page, setPage] = useState(initialPage);

    const fetch = useCallback(async () => {
        const res = await api(url, { params: { search, limit, page } });
        if (res.data.success) setData(res.data.data);
    }, [url, search, limit, page]);

    useEffect(() => {
        fetch();
    }, [limit, page, fetch]);

    useEffect(() => {
        const timer = setTimeout(() => fetch(), debounceMs);
        return () => clearTimeout(timer);
    }, [search, debounceMs, fetch]);

    const refresh = useCallback(() => fetch(), [fetch]);

    const handleSearchChange = useCallback((val: string) => {
        setSearch(val);
        setPage(1);
    }, []);

    const handleLimitChange = useCallback((val: number) => {
        setLimit(val);
        setPage(1);
    }, []);

    return {
        data,
        search,
        limit,
        page,
        setSearch: handleSearchChange,
        setLimit: handleLimitChange,
        setPage,
        refresh,
    };
}
