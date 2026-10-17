import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import api from '../../lib/axios';
import LazyTable from '../../components/tables/LazyTable';
import Helper from '../../utils/helper';
import { printInvoice } from '../../utils/globalPrinter';

interface SaleProduct {
  id: number;
  soldQty: number;
  salePrice: number;
  warranty?: number | null;
  product: { id: number; name: string };
}

interface SaleInvoiceData {
  invoiceNo: number;
  saleDate: string;
  totalProductPrice: number;
  otherCost?: number | null;
  costName?: string | null;
  discount?: number | null;
  totalAmount?: number | null;
  paid?: number | null;
  note?: string | null;
  customer?: { name?: string | null; address?: string | null; mobile?: string | null } | null;
}

interface SaleInvoiceResponse {
  sale: SaleInvoiceData;
  products: SaleProduct[];
}

const SaleInvoice = () => {
  const { id } = useParams();
  const [data, setData] = useState<SaleInvoiceResponse | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    api(`/sale/saleByID/${id}`).then((res) => {
      if (active && res.data.success === true) setData(res.data.data);
    });
    return () => {
      active = false;
    };
  }, [id]);

  const sale = data?.sale;
  const products = data?.products ?? [];

  const handlePrint = () => {
    printInvoice(printRef)
  }

  return (
    <div className='px-2' ref={printRef}>
      <div className='flex justify-between my-2'>
        {/* top left side business name and address */}
        <div className='flex gap-1 items-start'>
          <div>
            <h1>Sale Invoice</h1>
          </div>
        </div>
        {/* top right side invoice info */}
        <div className='flex flex-col items-end'>
          <h1>Invoice No: {sale?.invoiceNo}</h1>
          <h1>Customer :{sale?.customer?.name}</h1>
          <address className='max-w-[200px]'>{sale?.customer?.address}</address>
          <h1>Mobile : {sale?.customer?.mobile}</h1>
          <h1>Sold At : {Helper.formatDate(sale?.saleDate)}</h1>
        </div>
      </div>

      <LazyTable
        data={products}
        keyExtractor={(row) => row.id}
        columns={[
          {
            header: "#",
            accessor: (_, i) => (i ?? 0) + 1,
            className: "w-10 text-center",
            headerClassName: "text-center"
          },
          {
            header: "Name",

            accessor: (row) => (
              <div>
                <h1 className='w-full text-[16px]'>{row.product.name}</h1>
              </div>
            ),
            headerClassName: "min-w-[200px] text-left"
          },
          ...(products.some((p) => !!p.warranty)
            ? [
              {
                header: "Warranty",
                className: "text-center",
                headerClassName: "text-center",
                accessor: (row: SaleProduct) => (
                  <>
                    {(row.warranty ?? 0) > 0 && <h1>{row.warranty ?? 0} Days</h1>}
                  </>
                ),
              },
            ]
            : []),

          {
            header: "QTY",
            accessor: (row) => (
              <>  {row.soldQty}</>
            ),
            className: "text-center",
            headerClassName: "text-center"
          },
          {
            header: "Sale Price",
            accessor: (row) => (
              <>  {Helper.formatLongNumber(row.salePrice)}</>
            ),
            className: "text-center",
            headerClassName: "text-center"
          },
          {
            header: "Total",
            accessor: (row) => (
              <>  {Helper.formatLongNumber(row.soldQty * row.salePrice)} </>
            ),
            className: "text-end",
            headerClassName: "text-right"
          },

        ]}
        footer={(colCount) => (
          <tr>
            <td colSpan={colCount - 1} className="text-left font-bold">
              Total
            </td>
            <td className="text-end font-bold">
              {Helper.formatLongNumber(
                sale?.totalProductPrice
              )}
            </td>
          </tr>
        )}
      />
      {/* Other Cost */}
      {!!sale?.otherCost && <div className='flex justify-between'>
        <h1>{sale?.costName}</h1>
        <h1>{sale?.otherCost}</h1>
      </div>}
      {/* Discount */}
      {!!sale?.discount && <div className='flex justify-between'>
        <h1>Discount : </h1>
        <h1>{Helper.formatLongNumber(sale?.discount)}</h1>
      </div>}

      {!!sale?.totalAmount && <div className='flex justify-between'>
        <h1>Total Amount : </h1>
        <h1>{Helper.formatLongNumber(sale?.totalAmount)}</h1>
      </div>}
      {!!sale?.paid && <div className='flex justify-between'>
        <h1>Total Paid : </h1>
        <h1>{Helper?.formatLongNumber(sale?.paid)}</h1>
      </div>}

      {/* Note */}
      {!!sale?.note && <h1>Note : {sale?.note}</h1>}

      <button onClick={handlePrint} className='global_button my-5 sm:w-fit w-full' id='no-print'>Print Invoice</button>
    </div>
  )
}

export default SaleInvoice
