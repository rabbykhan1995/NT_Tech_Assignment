import { useCallback, useEffect, useState } from "react";
import api from "../lib/axios";
import type { Contact, SearchParams, SelectOption } from "../types/type";

export function useContactOptions(type: "customer" | "supplier" = "customer") {
    const [contacts, setContacts] = useState<SelectOption<Contact>[]>([]);
    const [selectedContact, setSelectedContact] = useState<SelectOption<Contact> | null>(null);
    const [params, setParams] = useState<SearchParams>({
        search: "",
        page: 1,
        limit: 50,
    });

    const fetchContacts = useCallback(async () => {
        const res = await api("/contact/list", {
            params: {
                search: params.search,
                limit: params.limit,
                page: params.page,
                type,
            },
        });
        if (res.data.success)
            setContacts(
                res.data.data.items.map((u: Contact) => ({
                    value: String(u.id),
                    label: u.mobile ? `${u.name} (${u.mobile})` : u.name,
                    ...u,
                }))
            );
    }, [params.search, params.limit, params.page, type]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    useEffect(() => {
        const timer = setTimeout(() => fetchContacts(), 400);
        return () => clearTimeout(timer);
    }, [params.search, fetchContacts]);

    const handleSearchChange = useCallback((val: string) => {
        setParams((prev) => ({ ...prev, search: val }));
    }, []);

    return {
        contacts,
        setContacts,
        selectedContact,
        setSelectedContact,
        search: params.search,
        onSearchChange: handleSearchChange,
    };
}
