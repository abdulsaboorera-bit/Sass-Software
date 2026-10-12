"use client";

import ResourceManager from "@/components/school/ResourceManager";

export default function LibraryPage() {
  return (
    <ResourceManager
      title="Library"
      subtitle="Catalogue books and monitor available copies."
      endpoint="/api/school/library/books"
      listKey="books"
      columns={[
        { key: "title", label: "Title" },
        { key: "author", label: "Author" },
        { key: "category", label: "Category" },
        { key: "totalCopies", label: "Copies" },
        { key: "availableCopies", label: "Available" },
        { key: "shelf", label: "Shelf" },
      ]}
      fields={[
        { name: "title", label: "Title", required: true },
        { name: "author", label: "Author" },
        { name: "isbn", label: "ISBN" },
        { name: "category", label: "Category" },
        { name: "publisher", label: "Publisher" },
        { name: "totalCopies", label: "Total Copies", type: "number", required: true },
        { name: "availableCopies", label: "Available Copies", type: "number", required: true },
        { name: "price", label: "Price (PKR)", type: "number" },
        { name: "shelf", label: "Shelf" },
      ]}
    />
  );
}
