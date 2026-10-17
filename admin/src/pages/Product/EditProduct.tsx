import { useEffect, useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router";
import api from "../../lib/axios";
import { updateProductSchema } from "../../validators/product.validator";
import toast from "react-hot-toast";

import { languageStore} from "../../stores/language.store";

interface ProductDetail {
  name: string;
  alertQty: number | null;
  purchasePrice: number | null;
  salePrice: number | null;
}

export default function EditProduct() {

  const { language } = languageStore();
  const t = (en: string, bn: string): string => (language === "bn" ? bn : en);
  const { id } = useParams();
  const navigate = useNavigate();
  const [oldData, setOldData] = useState<ProductDetail | null>(null);
  const [name, setName] = useState<string>("");
  const [alertQty, setAlertQty] = useState<number | "">("");
  const [purchasePrice, setPurchasePrice] = useState<number | "">("");
  const [salePrice, setSalePrice] = useState<number | "">("");

  const fetchProduct = useCallback(async () => {
    const res = await api(`/product/productByID/${id}`);
    if (!res.data.success) return;

    const p = res.data.data;
    setName(p.name ?? "");

    setAlertQty(p.alertQty ?? "");
    setSalePrice(p.salePrice ?? "");
    setPurchasePrice(p.purchasePrice ?? "");

    setOldData(p);
  }, [id]);

  useEffect(() => {
    void fetchProduct();
  }, [id, fetchProduct]);



  const updateProduct = async () => {
    if (!oldData) return;


    const productFields: Record<string, unknown> = {};

    if (name !== oldData.name) productFields.name = name;

    if (alertQty !== (oldData.alertQty ?? "")) productFields.alertQty = alertQty === "" ? 0 : alertQty;
    if (salePrice !== (oldData.salePrice ?? "")) productFields.salePrice = salePrice === "" ? 0 : salePrice;
    if (purchasePrice !== (oldData.purchasePrice ?? "")) productFields.purchasePrice = purchasePrice === "" ? 0 : purchasePrice;
    if (Object.keys(productFields).length === 0) {
      toast.error("No changes to update");
      return;
    }

    const result = updateProductSchema.safeParse(productFields);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    const res = await api.put(`/product/update/${id}`, result.data);
    if (res.data.success) {
      navigate("/product/list");
    }
  };

  return (
    <div className="grid lg:grid-cols-3 grid-cols-1 gap-2 space-y-4">
      <h2 className="global_heading">Edit Product</h2>

      {/* Name */}
      <div className="col-span-3">
        <label className="block text-sm font-medium mb-1">
          {t("Product Name", "পণ্যের নাম")} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Product name"
          className="global_input"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 col-span-3">

        {/* Alert Qty */}
        <div className="">
          <label className="block text-sm font-medium mb-1">{t("Alert Quantity", "সতর্কতা পরিমাণ")}</label>
          <input
            type="number"
            value={alertQty}
            onChange={(e) => setAlertQty(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder={t("Alert Quantity", "সতর্কতা পরিমাণ")}
            className="global_input"
          />
        </div>

            {/* Purchase Price */}
        <div className="">
          <label className="block text-sm font-medium mb-1">{t("Purchase Price", "সতর্কতা পরিমাণ")}</label>
          <input
            type="number"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder={t("Purchase Price", "সতর্কতা পরিমাণ")}
            className="global_input"
          />
        </div>
        {/* Sale Price */}
        <div className="">
          <label className="block text-sm font-medium mb-1">{t("Sale Price", "সতর্কতা পরিমাণ")}</label>
          <input
            type="number"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder={t("Sale Price", "সতর্কতা পরিমাণ")}
            className="global_input"
          />
        </div>
      </div>

      <div className="col-span-3 flex gap-3">
        <button onClick={updateProduct} className="global_button">{t("Update Product", "পণ্য আপডেট করুন")}</button>
        <button type="button" onClick={() => navigate("/product/list")} className="global_button_red">{t("Cancel", "বাতিল")}</button>
      </div>
    </div>
  );
}