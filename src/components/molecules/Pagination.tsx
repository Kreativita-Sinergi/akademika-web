import { Pagination as AntPagination } from 'antd';

// Molecule Pagination — wrapper Ant Design dengan API lama (page/totalPage/onChange).
// totalPage dikonversi ke total item (pageSize=20) agar kompatibel.
export function Pagination({
  page,
  totalPage,
  onChange,
}: {
  page: number;
  totalPage: number;
  onChange: (page: number) => void;
}) {
  if (totalPage <= 1) return null;
  return (
    <div className="mt-4 flex justify-end">
      <AntPagination
        current={page}
        total={totalPage * 20}
        pageSize={20}
        showSizeChanger={false}
        onChange={(p) => onChange(p)}
      />
    </div>
  );
}
