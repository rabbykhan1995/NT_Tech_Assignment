import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import api from '../../lib/axios';
import LazyTable from '../../components/tables/LazyTable';
import Helper from '../../utils/helper';
import { printInvoice } from '../../utils/globalPrinter';

interface PurchaseItem {
  id: number;
  purchasedQty: number;
  purchasePrice: number;
  product: { id: number; name: string };
}

interface PurchaseInvoiceData {
  invoiceNo: number;
  purchaseDate: string;
  totalProductPrice: number;
  otherCost?: number | null;
  costName?: string | null;
  discount?: number | null;
  totalAmount?: number | null;
  paid?: number | null;
  balanceAfter?: number | null;
  note?: string | null;
  supplier?: { name?: string | null; address?: string | null; mobile?: string | null } | null;
  items: PurchaseItem[];
}

const PurchaseInvoice = () => {
  const { id } = useParams();
  const [data, setData] = useState<PurchaseInvoiceData | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    api(`/purchase/purchaseInvoiceByID/${id}`).then((res) => {
      if (active && res.data.success === true) setData(res.data.data);
    });
    return () => {
      active = false;
    };
  }, [id]);

  const items = data?.items ?? [];

  const handlePrint = () => {
    printInvoice(printRef)
  }
  return (
    <div className='px-2' ref={printRef}>
      <div className='flex justify-between my-2'>
        {/* top left side business name and address */}
        <div className='flex gap-1 items-start'>
          <div>
            <h1>Purchase Invoice</h1>
          </div>
        </div>
        {/* top right side invoice info */}
        <div className='flex flex-col items-end'>
          <h1>Invoice No: {data?.invoiceNo}</h1>
          <h1>Supplier :{data?.supplier?.name}</h1>
          <address className='max-w-[200px]'>{data?.supplier?.address}</address>
          <h1>Mobile : {data?.supplier?.mobile}</h1>
          <h1>Purchased At : {Helper.formatDate(data?.purchaseDate)}</h1>
        </div>
      </div>

      <LazyTable
        data={items}
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
          {
            header: "QTY",
            accessor: (row) => (
              <>  {row.purchasedQty}</>
            ),
            className: "text-center",
            headerClassName: "text-center"
          },
          {
            header: "Purchase Price",
            accessor: (row) => (
              <>  {Helper.formatLongNumber(row.purchasePrice)}</>
            ),
            className: "text-center",
            headerClassName: "text-center"
          },
          {
            header: "Total",
            accessor: (row) => (
              <>  {Helper.formatLongNumber(row.purchasedQty * row.purchasePrice)} </>
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
                data?.totalProductPrice
              )}
            </td>
          </tr>
        )}
      />
      {/* Other Cost */}
      {!!data?.otherCost && <div className='flex justify-between'>
        <h1>{data?.costName}</h1>
        <h1>{data?.otherCost}</h1>
      </div>}
      {/* Discount */}
      {!!data?.discount && <div className='flex justify-between'>
        <h1>Discount : </h1>
        <h1>{Helper.formatLongNumber(data?.discount)}</h1>
      </div>}

      {!!data?.totalAmount && <div className='flex justify-between'>
        <h1>Total Payable : </h1>
        <h1>{Helper.formatLongNumber(data?.totalAmount)}</h1>
      </div>}
      {!!data?.paid && <div className='flex justify-between'>
        <h1>Total Paid : </h1>
        <h1>{Helper.formatLongNumber(data?.paid)}</h1>
      </div>}
      {!!data?.balanceAfter && <div className='flex justify-between'>
        <h1>My Due : </h1>
        <h1>{Helper.formatLongNumber(Number(Math.abs(data?.balanceAfter ?? 0)))}</h1>
      </div>}

      {/* Note */}
      {!!data?.note && <h1>Note : {data?.note}</h1>}

      <button onClick={handlePrint} className='global_button my-5 sm:w-fit w-full' id='no-print'>Print Invoice</button>
    </div>
  )
}

export default PurchaseInvoice
