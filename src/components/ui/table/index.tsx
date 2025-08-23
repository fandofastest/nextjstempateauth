import React, { ReactNode } from "react";

// Props for Table
interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

// Props for TableHeader
interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

// Props for TableBody
interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

// Props for TableRow
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

// Props for TableCell
type TableCellBaseProps = {
  children: ReactNode;
  isHeader?: boolean;
  className?: string;
};

type TableCellProps =
  TableCellBaseProps &
  React.ThHTMLAttributes<HTMLTableHeaderCellElement> &
  React.TdHTMLAttributes<HTMLTableDataCellElement>;

// Table Component
const Table: React.FC<TableProps> = ({ children, className, ...rest }) => {
  return (
    <table className={`min-w-full  ${className || ""}`} {...rest}>
      {children}
    </table>
  );
};

// TableHeader Component
const TableHeader: React.FC<TableHeaderProps> = ({ children, className, ...rest }) => {
  return (
    <thead className={className} {...rest}>
      {children}
    </thead>
  );
};

// TableBody Component
const TableBody: React.FC<TableBodyProps> = ({ children, className, ...rest }) => {
  return (
    <tbody className={className} {...rest}>
      {children}
    </tbody>
  );
};

// TableRow Component
const TableRow: React.FC<TableRowProps> = ({ children, className, ...rest }) => {
  return (
    <tr className={className} {...rest}>
      {children}
    </tr>
  );
};

// TableCell Component
const TableCell: React.FC<TableCellProps> = ({ children, isHeader = false, className, ...rest }) => {
  const tag = isHeader ? "th" : "td";
  return React.createElement(tag, { className: ` ${className || ""}`, ...rest }, children);
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
