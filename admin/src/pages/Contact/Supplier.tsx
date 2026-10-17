import { useEffect, useState } from "react";
import {  useNavigate } from "react-router";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import TableFilterBar from "../../components/filters/TableFilterBar";
import LazyTable from "../../components/tables/LazyTable";
import Pagination from "../../components/filters/Pagination";
import type { Contact, PaginatedResult, SearchParams } from "../../types/type";
import { Dropdown } from "../../components/Ui/Dropdown";

import { languageStore, toBengaliNum } from "../../stores/language.store";

type FormType = {
  name: string;
  mobile: string;

  address: string;

};

const defaultForm: FormType = {
  name: "",
  mobile: "",
  address: "",
};

export default function Supplier() {
  const navigate = useNavigate()
  const [data, setData] = useState<PaginatedResult<Contact>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
  });

  const [params, setParams] = useState<SearchParams>({
    search: "",
    page: 1,
    limit: 20,
  })

  const [form, setForm] = useState<FormType>(defaultForm);
  const [editID, setEditID] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const { language } = languageStore();
  const t = (en: string, bn: string): string => (language === "bn" ? bn : en);
  const loc = (n: string | number): string => (language === "bn" ? toBengaliNum(n) : String(n));


  const fetchContacts = async () => {
    const res = await api("/contact/list", {
      params: { search: params.search, limit: params.limit, page: params.page },
    });
    if (res.data.success) setData(res.data.data);
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchContacts(), 400);
    return () => clearTimeout(timer);
  }, [params.search]);

  useEffect(() => {
    fetchContacts();
  }, [params.limit, params.page]);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleEdit = async (contact: Contact) => {
    setEditID(contact.id);
    setForm({
      name: contact.name,
      mobile: contact.mobile,
      address: contact.address ?? "",

    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditID(null);
    setForm(defaultForm);
   
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error(t("Name is required", "নাম আবশ্যক")); return; }
    if (!form.mobile.trim()) { toast.error(t("Mobile is required", "মোবাইল নম্বর আবশ্যক")); return; }

    const payload = {
      ...form,
    };

    setLoading(true);
    try {
      if (editID) {
        await api.put(`/contact/update/${editID}`, payload);
      } else {
        await api.post("/contact/create", payload);
      }
      setEditID(null);
      setForm(defaultForm);
      fetchContacts();
    } finally {
      setLoading(false);
    }
  };


  const getActions = (): string[] => {

    return ["Edit", "Ledger"];

  };

  const handleActionChange = (val: string, row: Contact) => {
    switch (val) {
      case "Edit":
        handleEdit(row)
        break;

      case "Ledger":
        navigate(`/contact/supplier-ledger/${row.id}`)
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Form */}
      <form onSubmit={onSubmit} className="grid lg:grid-cols-2 grid-cols-1 gap-4">
        <h2 className="global_heading col-span-full">
          {editID ? t("Edit Supplier", "সরবরাহকারী সম্পাদনা") : t("New Supplier", "নতুন সরবরাহকারী")}
        </h2>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t("Name", "নাম")} <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder={t("Supplier name", "সরবরাহকারীর নাম")}
            className="global_input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t("Mobile", "মোবাইল")} <span className="text-red-500">*</span>
          </label>
          <input
            name="mobile"
            value={form.mobile}
            onChange={onChange}
            placeholder={t("Mobile number", "মোবাইল নম্বর")}
            className="global_input"
          />
        </div>


        <div>
          <label className="block text-sm font-medium mb-1">{t("Address", "ঠিকানা")}</label>
          <input
            name="address"
            value={form.address}
            onChange={onChange}
            placeholder={t("Address", "ঠিকানা")}
            className="global_input"
          />
        </div>

        <div className="flex gap-3 pt-2 col-span-full">
          <button type="submit" disabled={loading} className="global_button">
            {loading ? t("Saving...", "সংরক্ষণ হচ্ছে...") : editID ? t("Update Supplier", "সরবরাহকারী আপডেট") : t("Create Supplier", "সরবরাহকারী তৈরি")}
          </button>
          {editID && (
            <button
              type="button"
              onClick={handleCancel}
              className="global_button_red"
            >
              {t("Cancel", "বাতিল")}
            </button>
          )}
        </div>
      </form>

      {/* Table */}

      <TableFilterBar
        title={t("Suppliers", "সরবরাহকারী তালিকা")}
        subtitle={`${t("Total", "মোট")}: ${loc(data.total)}`}
        search={params.search}
        onSearchChange={(val) => { setParams(prev => ({ ...prev, search: val, page: 1 })); }}
        addHref=""
        addLabel={t("New Supplier", "নতুন সরবরাহকারী")}
        limit={params.limit}
        onLimitChange={(val) => { setParams(prev => ({ ...prev, limit: val, page: 1 })); }}
      />

      <LazyTable
        data={data.items}
        printEnable={true}
        keyExtractor={(row) => row.id}
        columns={[
          {
            header: "#",
            accessor: (_, i) => loc((i ?? 0) + 1),
            className: "w-10 text-center",
            headerClassName: "text-center",
          },
          { header: t("Name", "নাম"), accessor: "name" },
          { header: t("Mobile", "মোবাইল"), accessor: "mobile" },
          { header: t("Address", "ঠিকানা"), accessor: (row) => row.address || "—" },
   
          {
            header: t("Action", "অ্যাকশন"),
            headerClassName: "text-right",
            className: "text-right",
            accessor: (row) => (
              <Dropdown
                value=""
                onChange={(status: string) => handleActionChange(status, row)}
                options={getActions()}
                title="Actions"
                usePortal
              />
            ),
          },
        ]}
      />

      <Pagination
        total={data.total}
        page={params.page}
        limit={params.limit}
        onPageChange={(page) => setParams(prev => ({ ...prev, page }))}
      />
    </div>
  );
}