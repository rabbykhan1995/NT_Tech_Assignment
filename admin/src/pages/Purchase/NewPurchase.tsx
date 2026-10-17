import { useEffect, useState } from "react";
import api from "../../lib/axios";
import type {  Contact, PurchaseProduct, SelectOption, Product} from "../../types/type";
import CreateOptionSelect from "../../components/Ui/CreateOptionSelect";
import { getReactSelectStyles } from "../../utils/reactSelectStyles";

import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import type { SearchParams } from "../../types/type";
import { Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import { createPortal } from "react-dom";
import "react-datepicker/dist/react-datepicker.css";
import LazyTable from "../../components/tables/LazyTable";
import { useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { createPurchaseSchema } from "../../validators/purchase.validator";
import { languageStore, toBengaliNum } from "../../stores/language.store";

export default function NewPurchase() {
    const { language } = languageStore();
    const t = (en: string, bn: string): string => (language === "bn" ? bn : en);
    const loc = (n: string | number): string => (language === "bn" ? toBengaliNum(n) : String(n));
    useSignals();
    const navigate = useNavigate();
    const [contactParams, setContactParams] = useState<SearchParams>({
        search: "",
        page: 1,
        limit: 50,
    });
    const [productParams, setProductParams] = useState<SearchParams>({
        search: "",
        page: 1,
        limit: 50,
    });

    const [products, setProducts] = useState<SelectOption<Product>[]>([]);
    const [suppliers, setSuppliers] = useState<SelectOption<Contact>[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<SelectOption<Contact> | null>(null);
    const [purchaseDate, setPurchaseDate] = useState<Date>(new Date());
    const selectedProducts = useSignal<PurchaseProduct[]>([]);
    const [costName, setCostName] = useState<string | null>("");
    const [otherCost, setOtherCost] = useState<number>(0);
    const [discount, setDiscount] = useState<number>(0);
    const [discountPercent, setDiscountPercent] = useState<number>(0);
    const [note, setNote] = useState<string | null>("");

    const fetchProducts = async () => {
        const res = await api("/product/list", {
            params: { search: productParams.search, limit: productParams.limit, page: productParams.page },
        });

        if (res.data.success)
            setProducts(
                res.data.data.items.map((u: Product) => ({ value: u.id, label: `${u.name}`, ...u }))
            );
    };
    const fetchContacts = async () => {
        const res = await api("/contact/list", {
            params: { search: contactParams.search, limit: contactParams.limit, page: contactParams.page, type: "supplier" },
        });
        if (res.data.success) setSuppliers(
            res.data.data.items.map((u: Contact) => ({ value: u.id, label: `${u.name} ${t("balance", "ব্যালেন্স")}`, ...u }))
        );;
    };

    const createSupplier = async (name: string, fields: Record<string, string>) => {
        const res = await api.post("/contact/create", {
            name,
            mobile: fields.mobile ?? "",
            address: fields.address ?? "",
        });
        if (!res.data?.success) {
            toast.error(res.data?.msg ?? t("Failed to create supplier", "সরবরাহকারী তৈরি ব্যর্থ হয়েছে"));
            throw new Error("Creation failed");
        }
        const created = res.data.data;
        const option: SelectOption<Contact> = {
            value: String(created.id),
            label: `${created.name}`,
            ...created,
        };
        setSuppliers((prev) => [option, ...prev]);
        return option;
    };

    const createNewProduct = async (name: string, fields: Record<string, string>) => {
        const res = await api.post("/product/create", {
            name,
            alertQty: Number(fields.alertQty || 0),
        });
        if (!res.data?.success) {
            toast.error(res.data?.msg ?? t("Failed to create product", "পণ্য তৈরি ব্যর্থ হয়েছে"));
            throw new Error("Creation failed");
        }
        const listRes = await api("/product/list", {
            params: { search: name, limit: 10, page: 1 },
        });
        const found = (listRes.data?.data?.items ?? []).find(
            (p: Product) => p.name.toLowerCase() === name.toLowerCase()
        );
        if (!found) {
            toast.error(t("Failed to load created product", "তৈরি পণ্য লোড করা ব্যর্থ হয়েছে"));
            throw new Error("Failed to load created product");
        }
        const option: SelectOption<Product> = {
            value: String(found.id),
            label: found.name,
            ...found,
        };
        setProducts((prev) => [option, ...prev]);
        return option;
    };
    const handleAddProduct = (p: SelectOption<Product>) => {

        const already = selectedProducts.value.find((item) => item.id === p.id);
        if (already) {
            selectedProducts.value = selectedProducts.value.map((item) =>
                item.id === p.id ? { ...item, purchaseQty: item.purchaseQty + 1 } : item
            );
            return;
        }

        selectedProducts.value = [...selectedProducts.value, {
            id: p.id,
            name: p.label, // or p.label
            stock: p.stock,
            createdAt: p.createdAt,
            purchasePrice: p.purchasePrice, // or p.salePrice depending on your logic
            salePrice: p.salePrice,
            purchaseQty: 1,

        }];
    };


    useEffect(() => {
        Promise.all([fetchProducts(), fetchContacts(),]);
    }, []);


    useEffect(() => {
        const timer = setTimeout(() => fetchContacts(), 400);
        return () => clearTimeout(timer);
    }, [contactParams.search]);

    useEffect(() => {
        const timer = setTimeout(() => fetchProducts(), 400);
        return () => clearTimeout(timer);
    }, [productParams.search]);

    const handleProductChange = (id: number, field: string, value: number | Date | null) => {
        selectedProducts.value = selectedProducts.value.map((p) =>
            p.id === id ? { ...p, [field]: value } : p
        );
    };

    const handleRemoveProduct = (idx: number) => {
        selectedProducts.value = selectedProducts.value.filter((_, i) => i !== idx);
    };
    const totalProductPrice = selectedProducts.value.reduce(
        (acc, p) => acc + (p.purchasePrice || 0) * (p.purchaseQty || 0), 0
    );
    const basePayable = totalProductPrice - discount + otherCost;
    const totalPayableAmount = basePayable

    const createPurchase = async () => {
        if (!selectedSupplier) return toast.error(t("Please select a supplier", "অনুগ্রহ করে একটি সরবরাহকারী নির্বাচন করুন"));

      

        if (selectedProducts.value.length === 0) return toast.error(t("Please add at least one product", "অনুগ্রহ করে কমপক্ষে একটি পণ্য যোগ করুন"));

        const purchase = {
            supplierID: Number(selectedSupplier.value),
            ...(costName ? { costName, otherCost } : {}),
            totalProductPrice,
            discount,

            totalAmount: basePayable,
            note,
            purchaseDate,
        };


        const products = selectedProducts.value.flatMap(p => {
            return [{
                id: p.id,
                purchasedQty: p.purchaseQty,
                purchasePrice: p.purchasePrice,
                salePrice: p.salePrice,
            }];
        });

        const purchaseResult = createPurchaseSchema.safeParse({ purchase, products });

        if (!purchaseResult.success) {
            const firstError = purchaseResult.error.issues[0];
            console.log(firstError);
            toast.error(firstError.message);
            return;
        }

        const res = await api.post('/purchase/create', purchaseResult.data);
        if (res.data.success === true) {
            navigate(`/purchase/invoice/${res.data.data.id}`);
            return;
        }


    };


    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      
                {/* Supplier */}
                <div className="flex flex-col">
                    <label className="block text-sm font-medium mb-1">{t("Suppliers", "সরবরাহকারী")} <span className="text-red-500">*</span></label>
                    <CreateOptionSelect<Contact>
                        options={suppliers}
                        value={selectedSupplier}
                        onChange={(val) => setSelectedSupplier(val as SelectOption<Contact> | null)}
                        onSearchChange={(search) => setContactParams(prev => ({ ...prev, search }))}
                        onCreate={createSupplier}
                        fields={[
                            { key: "mobile", label: t("Mobile", "মোবাইল"), required: true, placeholder: t("Mobile number", "মোবাইল নম্বর") },
                            { key: "address", label: t("Address", "ঠিকানা"), placeholder: t("Address", "ঠিকানা") },
            
                        ]}
                        placeholder={t("Select Supplier", "সরবরাহকারী নির্বাচন")}
                        isClearable
                        permission="contact:create"
                        modalTitle={t("Create New Supplier", "নতুন সরবরাহকারী তৈরি")}
                        inputLabel={t("Supplier name", "সরবরাহকারীর নাম")}
                        createButtonLabel=""
                        styles={getReactSelectStyles<SelectOption<Contact>>()}
                    />
                </div>
                {/* Products */}
                <div className="flex flex-col">
                    <label className="block text-sm font-medium mb-1">{t("Products", "পণ্যসমূহ")}<span className="text-red-500">*</span></label>
                    <CreateOptionSelect<Product>
                        options={products}
                        value={null}
                        onChange={(val) => handleAddProduct(val as SelectOption<Product>)}
                        onSearchChange={(search) => setProductParams(prev => ({ ...prev, search }))}
                        onCreate={createNewProduct}
                        fields={[
                            { key: "alertQty", label: t("Alert Quantity", "সতর্কতা পরিমাণ"), type: "number", placeholder: "0", defaultValue: "0" },
      
                        ]}
                        placeholder={t("Select Product", "পণ্য নির্বাচন")}
                        isClearable
                        permission="product:create"
                        modalTitle={t("Create New Product", "নতুন পণ্য তৈরি")}
                        inputLabel={t("Product name", "পণ্যের নাম")}
                        createButtonLabel=""
                        styles={getReactSelectStyles<SelectOption<Product>>()}
                    />
                </div>

                {/* Date */}
                <div className="relative w-full">
                    <label className="block text-sm font-medium mt-1 mb-1">
                        {t("Select Date", "তারিখ নির্বাচন")}
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Calendar className="w-4 h-4 text-gray-400" />
                        </div>
                        <DatePicker
                            selected={purchaseDate}
                            onChange={(date: Date | null) => setPurchaseDate(date as Date)}
                            dateFormat="dd-MM-yyyy"
                            className="global_input pl-10 w-full"
                            popperPlacement="bottom"
                            popperClassName="z-[9999]"
                            calendarClassName="react-datepicker-custom"
                            popperContainer={(props) =>
                                createPortal(<div {...props} />, document.body)
                            }
                        />
                    </div>
                </div>
            </div>
            {/* Table */}
            <LazyTable
                data={selectedProducts.value}
                keyExtractor={(row) => row.id}
                columns={[
                    {
                        header: "#",
                        accessor: (_, i) => loc((i ?? 0) + 1),
                        className: "w-10 text-center",
                        headerClassName: "text-center"
                    },
                    {
                        header: t("Name", "নাম"),
                        accessor: (row) => (
                            <>  {row.name}</>

                        ),
                        headerClassName: "min-w-[200px]"
                    }
             ,

                    {
                        header: t("Purchase Price", "ক্রয় মূল্য"),
                        className: "text-center",
                        headerClassName: "text-center",
                        accessor: (row) => (
                            <input
                                type="number"
                                value={row.purchasePrice === 0 ? "" : row.purchasePrice}
                                onChange={(e) => handleProductChange(row.id, "purchasePrice", e.target.value === "" ? 0 : Number(e.target.value))}
                                className="global_input text-center w-24"
                            />
                        ),
                    },
                    {
                        header: t("Sale Price", "বিক্রয় মূল্য"),
                        className: "text-center",
                        headerClassName: "text-center",
                        accessor: (row) => (
                            <input
                                type="number"
                                value={row.salePrice === 0 ? "" : row.salePrice}
                                onChange={(e) => handleProductChange(row.id, "salePrice", e.target.value === "" ? 0 : Number(e.target.value))}
                                className="global_input text-center w-24"
                            />
                        ),
                    },
                    {
                        header: t("Qty", "পরিমাণ"),
                        className: "text-center",
                        headerClassName: "text-center",
                        accessor: (row) => (
                            <input
                                type="number"
                                value={row.purchaseQty === 0 ? "" : row.purchaseQty}
                                onChange={(e) => handleProductChange(row.id, "purchaseQty", e.target.value === "" ? 0 : Number(e.target.value))}
                                className="global_input text-center w-20"
                            />
                        ),
                    },
                    {
                        header: t("Total", "মোট"),
                        className: "text-center",
                        headerClassName: "text-center",
                        accessor: (row) => (
                            <span>{loc((row.purchasePrice * row.purchaseQty).toFixed(2))}</span>
                        ),
                    },
                    {
                        header: t("Action", "অ্যাকশন"),
                        headerClassName: "text-right",
                        className: "text-right",
                        accessor: (_, i) => (
                            <button
                                onClick={() => handleRemoveProduct(i as number)}
                                className="global_button_red"
                            >
                                {t("Cancel", "বাতিল")}
                            </button>
                        ),
                    }
                ]}
            />

            {/* Purchase Summary + Note */}

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Note */}
                <div className="flex-1">
                    <label className="block mb-2 font-medium">{t("Note", "নোট")}</label>
                    <textarea
                        value={note ?? ""}
                        onChange={(e) => setNote(e.target.value)}
                        className="global_input min-h-[150px] w-full"
                    />
                    {/* Other Cost */}
                    <div className="mt-3 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <label>{t("Cost Name", "খরচের নাম")}:</label>
                            <input
                                type="text"
                                value={costName ?? ""}
                                onChange={(e) => setCostName(e.target.value)}
                                className="global_input w-40 text-right"
                                placeholder="e.g. Transport"
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <label>{t("Other Cost", "অন্যান্য খরচ")}:</label>
                            <input
                                type="number"
                                value={otherCost === 0 ? "" : otherCost}
                                onChange={(e) => setOtherCost(e.target.value === "" ? 0 : Number(e.target.value))}
                                className="global_input w-40 text-right"
                            />
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="flex-1 space-y-3">
                    {/* Total Product Price */}
                    <div className="flex justify-between">
                        <label>{t("Total Product Price", "মোট পণ্যের মূল্য")}:</label>
                        <input type="number" value={totalProductPrice.toFixed(2)} disabled
                            className="global_input w-40 rounded-sm cursor-not-allowed text-right" />
                    </div>
                    {/* Discount % */}
                    <div className="flex justify-between">
                        <label>{t("Discount", "ছাড়")} %:</label>
                        <input
                            type="number"
                            value={discountPercent === 0 ? "" : discountPercent}
                            onChange={(e) => {
                                const percent = e.target.value === "" ? 0 : Number(e.target.value);
                                setDiscountPercent(percent);
                                setDiscount(parseFloat(((percent / 100) * totalProductPrice).toFixed(2)));
                            }}
                            className="global_input w-40 rounded-sm text-right" min="0" max="100"
                        />
                    </div>
                    {/* Discount Amount */}
                    <div className="flex justify-between">
                        <label>{t("Discount Amount", "ছাড়ের পরিমাণ")}:</label>
                        <input
                            type="number"
                            value={discount === 0 ? "" : discount}
                            onChange={(e) => {
                                const val = e.target.value === "" ? 0 : Number(e.target.value);
                                setDiscount(val);
                                setDiscountPercent(totalProductPrice > 0 ? parseFloat(((val / totalProductPrice) * 100).toFixed(2)) : 0);
                            }}
                            className="global_input w-40 rounded-sm text-right" min="0"
                        />
                    </div>
                    {/* Total Amount */}
                    <div className="flex justify-between font-medium  pt-2">
                        <label>{t("Total Amount", "মোট পরিমাণ")}:</label>
                        <input type="number" value={basePayable.toFixed(2)} disabled
                            className="global_input w-40 rounded-sm cursor-not-allowed text-right" />
                    </div>
     
                    {/* Payable */}
                    <div className="flex justify-between font-medium">
                        <label>{t("Payable", "পরিশোধযোগ্য")}:</label>
                        <input type="number" value={(totalPayableAmount).toFixed(2)} disabled
                            className="global_input w-40 rounded-sm cursor-not-allowed text-right" />
                    </div>

        

                    {/* Paid */}
                    <div className="flex justify-between">
                        <label>{t("Paid", "পরিশোধিত")}:</label>
                        {/* <input type="number" value={paid.toFixed(2)} disabled
                            className="global_input w-40 rounded-sm cursor-not-allowed text-right text-green-500" /> */}
                    </div>

                    {!!selectedSupplier && <button type="button" className="global_button w-full mb-5" onClick={createPurchase}>{t("Purchase", "ক্রয়")}</button>}
                </div>
            </div>
        </div>
    );
}