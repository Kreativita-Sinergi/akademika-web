import { Empty } from 'antd';

// Atom EmptyState — Ant Design Empty dengan pesan kustom.
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8">
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={message} />
    </div>
  );
}
