import { useState} from "react";
import api from "../../lib/axios";
import { createProductSchema } from "../../validators/product.validator";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { languageStore } from "../../stores/language.store";
export default function NewProduct() {
  const navigate = useNavigate();
  const { language } = languageStore();
  const t = (en: string, bn: string): string => (language === "bn" ? bn : en);
  const [name, setName] = useState<string>("");
  const [alertQty, setAlertQty] = useState<number | "">("");
  const [purchasePrice, setPurchasePrice] = useState<number | "">("");
  const [salePrice, setSalePrice] = useState<number | "">("");

  const createProduct = async () => {
    const payload = {
      name,
      alertQty: alertQty === "" ? 0 : alertQty,
      salePrice,
      purchasePrice,
    };
    const result = createProductSchema.safeParse(payload);
    console.log(result.data)
    if (!result.success) {
      const firstError = result.error.issues[0];
      toast.error(firstError.message);
      return;
    }
    const res = await api.post("/product/create", result.data);
    if (res.data.success === true) {
      return navigate('/product/list')
    }
  };

  return (
    <div className="grid lg:grid-cols-3 grid-cols-1 gap-2 space-y-4">
      <h2 className="global_heading">New Product</h2>

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
          <label className="block text-sm font-medium mb-1">{t("Purchase Price", "ক্রয় মূল্য")}</label>
          <input
            type="number"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder={t("Purchase Price", "ক্রয় মূল্য")}
            className="global_input"
          />
        </div>
        {/* Sale Price */}
        <div className="">
          <label className="block text-sm font-medium mb-1">{t("Sale Price", "বিক্রয় মূল্য")}</label>
          <input
            type="number"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder={t("Sale Price", "বিক্রয় মূল্য")}
            className="global_input"
          />
        </div>

      </div>
      <button onClick={createProduct} className="global_button w-full mb-5">{t("Create Product", "পণ্য তৈরি করুন")}</button>
    </div>
  );
}


