import { useState } from "react";
import api from "../../lib/axios";
import type { Product, SaleProduct, SelectOption } from "../../types/type";
import LazySelect from "../../components/Ui/LazySelect";
import { getReactSelectStyles } from "../../utils/reactSelectStyles";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import { createPortal } from "react-dom";
import "react-datepicker/dist/react-datepicker.css";
import LazyTable from "../../components/tables/LazyTable";
import { useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { createSaleSchema } from "../../validators/sale.validator";

import Helper from "../../utils/helper";
import IncrDecrButton from "../../components/buttons/IncrDecrButton";
import { useProducts, useSaleSummary } from "../../hooks";
import { languageStore } from "../../stores/language.store";


export default function NewSale() {
      const { language } = languageStore();
      const t = (en: string, bn: string): string => (language === "bn" ? bn : en);

    useSignals();
    const navigate = useNavigate();
    const [saleDate, setSaleDate] = useState<Date>(new Date());
    const [note, setNote] = useState<string | null>("");
    const selectedProducts = useSignal<SaleProduct[]>([]);
    const { products, onSearchChange: onProductSearchChange } = useProducts({ searchLabel: "sale" });
    const [paid, setPaid] = useState<number>(0);
    const {
        discount, discountPercent,
        otherCost, setOtherCost, costName, setCostName,
        totalProductPrice, basePayable,
        handleDiscountPercentChange, handleDiscountAmountChange,
    } = useSaleSummary({ selectedProducts });



    const handleAddProduct = async (product: SelectOption<Product>) => {

            const productID = Number(product.id);
            const existing = selectedProducts.value.find(
                (p) => p.productID === productID
            );

            if (existing) {
                selectedProducts.value = selectedProducts.value.map(p =>
                    p.productID === productID
                        ? { ...p, soldQty: p.soldQty + 1, total: p.salePrice * (p.soldQty + 1) }
                        : p
                );
            } else {
                selectedProducts.value = [...selectedProducts.value, {
                    ...product,
                    productID,
                    name: product.label,
                    soldQty: 1,
                    salePrice: product.salePrice,

                    total: product.salePrice
                }];
            }

            return;
    };

    const handleProductChange = (idx: number, field: string, value: number) => {
    selectedProducts.value = selectedProducts.value.map((p, i) => {
        if (i !== idx) return p;

        if (field === 'salePrice') {
            return {
                ...p,
                salePrice: value,
                total: Number(value) * (p.soldQty || 0)
            };
        }else if(field === 'soldQty'){
             return {
                ...p,
                
                soldQty: Number(value), // কাস্টম ইনক্রিমেন্ট লজিক
                total:Number(value)* p.salePrice
            };
        }

        // অন্যান্য ডায়নামিক ফিল্ডের জন্য সাধারণ আপডেট
        return { ...p, [field]: value };
    });
};

    const handleRemoveProduct = (idx: number) => {
        selectedProducts.value = selectedProducts.value.filter((_, i) => i !== idx);
    };

    const createSale = async () => {

        if (selectedProducts.value.length === 0) {
            return toast.error("Please add at least one product");
        }

        // ✅ Products structure - backend অনুযায়ী
        const products = selectedProducts.value.flatMap(p => {
            const productID = p.productID;
            if (!productID) {
                toast.error("Some products are missing product ID. Please re-add them.");
                return [];
            }

            // Normal batch product
            return [{
                productID,
                soldQty: p.soldQty,
                salePrice: p.salePrice,
            }];
        });

        if (products.length === 0) return;




        // ✅ Sale object - backend অনুযায়ী
        // paid = amount received from the customer; exchangeAmount = change returned to the
        // customer; actual paid = paid - exchangeAmount.
        const sale = {
            paid,
            costName: costName || null,
            otherCost: costName ? otherCost : 0,
            totalProductPrice,
            discount,
            totalAmount: basePayable,
            note: note || null,
            saleDate, // ✅ Date object
        };

        // ✅ Validate
        const saleResult = createSaleSchema.safeParse({
            products,
            sale,
        });

        if (!saleResult.success) {
            const firstError = saleResult.error.issues[0];
            const field = firstError.path.join(".");
            const msg = firstError.message;
            toast.error(msg.includes("received undefined") || msg.includes("Invalid input")
                ? `Invalid data in "${field}". Please check and re-add the item.`
                : msg);
            console.error("Validation errors:", saleResult.error.issues);
            return;
        }

        try {
            const res = await api.post('/sale/create', saleResult.data);

            if (res.data.success === true) {
                navigate(`/sale/invoice/${res.data.data.id}`);
            }
        } catch (error) {
            console.error("Sale creation error:", error);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Products */}
                <div className="flex flex-col">
                    <label className="block text-sm font-medium mb-1">{t("Products", "পণ্যসমূহ")}<span className="text-red-500">*</span></label>
                    <LazySelect
                        options={products}
                        value={null}
                        onChange={(val) => handleAddProduct(val as SelectOption<Product>)}
                        onInputChange={onProductSearchChange}
                        placeholder={t("Select Product", "পণ্য নির্বাচন করুন")}
                        isClearable
                        styles={getReactSelectStyles<SelectOption<Product>>()}
                    />
                </div>
                {/* Date */}
                <div className="relative w-full">
                    <label className="block text-sm font-medium mt-1 mb-1">
                        {t("Select Date", "তারিখ নির্বাচন করুন")}
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Calendar className="w-4 h-4 text-gray-400" />
                        </div>
                        <DatePicker
                            selected={saleDate}
                            onChange={(date: Date | null) => setSaleDate(date as Date)}
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
                keyExtractor={(row, i) => `${row.productID}-${i}`}
                columns={[
                    // #
                    {
                        header: "#",
                        accessor: (_, i) => (i ?? 0) + 1,
                        className: "w-10 text-center",
                        headerClassName: "text-center"
                    },
                    // Name
                    {
                        header: t("Name", "নাম"),
                        accessor: "name",
                        headerClassName: "min-w-[200px] text-left"
                    },
                    // Purchase Price
                    {
                        header: t("Purchase Price", "ক্রয় মূল্য"),
                        className: "text-center",
                        headerClassName: "text-center",
                        accessor: (row, i) => (
                            <input
                                type="number"
                                value={row.purchasePrice === 0 ? "" : row.purchasePrice}
                                onChange={(e) => handleProductChange(i as number, "purchasePrice", e.target.value === "" ? 0 : Number(e.target.value))}
                                className="global_input text-center w-24"
                            />
                        ),
                    },
                    // Sale Price
                    {
                        header: t("Sale Price", "বিক্রয় মূল্য"),
                        className: "text-center",
                        headerClassName: "text-center",
                        accessor: (row, i) => (
                            <input
                                type="number"
                                value={row.salePrice === 0 ? "" : row.salePrice}
                                onChange={(e) => handleProductChange(i as number, "salePrice", e.target.value === "" ? 0 : Number(e.target.value))}
                                className="global_input text-center w-24"
                            />
                        ),
                    },
                    // Qty
                    {
                        header: t("Qty", "পরিমাণ"),
                        className: "text-center",
                        headerClassName: "text-center",
                        accessor: (row, i) => (


                                <div className="flex justify-center">
                                    <IncrDecrButton
                                        currentQty={row.soldQty}
                                        min={1}
                                        max={row.stock}
                                        onChange={(value) =>
                                            handleProductChange(i as number, "soldQty", value)
                                        }

                                    />
                                </div>
                        ),
                    },
                    // Total
                    {
                        header: t("Total", "মোট"),
                        className: "text-center",
                        headerClassName: "text-center",
                        accessor: (row) => (
                            <span>{Helper.formatLongNumber(row.total)}</span>
                        ),
                    },
                    // Action
                    {
                        header: t("Action", "অ্যাকশন"),
                        headerClassName: "text-right",
                        className: "text-right",
                        accessor: (_, i) => (
                            <button
                                onClick={() => handleRemoveProduct(i as number)}
                                className="global_button_red"
                            >
                                Remove
                            </button>
                        ),
                    },
                ]}
            />

            {/* Summary + Note */}

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Note */}
                <div className="flex-1">
                    <label className="block mb-2 font-medium">{t("Note", "নোট")}</label>
                    <textarea
                        value={note ?? ""}
                        onChange={(e) => setNote(e.target.value)}
                        className="global_input min-h-37.5 w-full"
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
                                handleDiscountPercentChange(e.target.value === "" ? 0 : Number(e.target.value));
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
                                handleDiscountAmountChange(e.target.value === "" ? 0 : Number(e.target.value));
                            }}
                            className="global_input w-40 rounded-sm text-right" min="0"
                        />
                    </div>
                    {/* Total Amount */}
                    <div className="flex justify-between font-medium pt-2">
                        <label>{t("Total Amount", "মোট পরিমাণ")}:</label>
                        <input type="number" value={basePayable.toFixed(2)} disabled
                            className="global_input w-40 rounded-sm cursor-not-allowed text-right" />
                    </div>
     
                    {/* Payable */}
                    <div className="flex justify-between font-medium">
                        <label>{t("Payable", "পরিশোধযোগ্য")}:</label>
                        {basePayable > 0 ?
                            <input type="number" value={(basePayable).toFixed(2)} disabled
                                className="global_input w-40 rounded-sm cursor-not-allowed text-right" />
                            :
                            <input type="number" value={0} disabled
                                className="global_input w-40 rounded-sm cursor-not-allowed text-right" />}
                    </div>

    

                    {/* Paid */}
                    <div className="flex justify-between">
                        <label>{t("Total Paid", "মোট পরিশোধ")}:</label>
                        <input
                            type="number"
                            value={paid}
                            onChange={(e) => setPaid(e.target.value === "" ? 0 : Number(e.target.value))}
                            className="global_input w-40 rounded-sm text-right text-green-500"
                            min="0"
                        />
                    </div>
                    <button type="button" className="global_button w-full mb-5" onClick={createSale}>{t("Sale", "বিক্রয়")}</button>
                </div>

            </div>

        </div>
    );
}
