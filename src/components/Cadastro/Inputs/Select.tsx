"use client";
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

interface SelectOption {
  chave: any;
  valor: string;
  selecionado?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value: any;
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  message?: string;
  // controle extra
  maxMenuHeight?: number; // px
  className?: string;
}

export default function Select({
  options = [],
  value,
  onChange,
  name,
  label,
  required = false,
  disabled = false,
  message = "Selecione...",
  maxMenuHeight = 220,
  className = "",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLUListElement | null>(null);

  // normalize value to string for comparisons
  const normalizedValue = value === undefined || value === null ? "" : String(value);
  const selectedOption = options.find((opt) => {
    if (opt?.selecionado) return true;
    return String(opt?.chave) === normalizedValue;
  });

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const btn = triggerRef.current;
      const menu = menuRef.current;
      if (!btn || !menu) return;

      const rect = btn.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const preferredTop = rect.bottom + window.scrollY;
      const preferredLeft = rect.left + window.scrollX;
      const menuMaxHeight = Math.min(maxMenuHeight, spaceBelow - 12); 

      if (spaceBelow < 120 && rect.top > rect.height + 12) {
        const topAbove = rect.top + window.scrollY - Math.min(maxMenuHeight, rect.top - 12);
        setMenuStyle({
          position: "absolute",
          top: `${topAbove}px`,
          left: `${preferredLeft}px`,
          minWidth: `${Math.max(rect.width, 160)}px`,
          maxHeight: `${Math.min(maxMenuHeight, rect.top - 12)}px`,
          overflowY: "auto",
          zIndex: 9999,
        });
      } else {
        setMenuStyle({
          position: "absolute",
          top: `${preferredTop}px`,
          left: `${preferredLeft}px`,
          minWidth: `${Math.max(rect.width, 160)}px`,
          maxHeight: `${maxMenuHeight}px`,
          overflowY: "auto",
          zIndex: 9999,
        });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, maxMenuHeight]);

  useEffect(() => {
    if (!open) return;
    const onClick = (ev: MouseEvent) => {
      const target = ev.target as Node;
      if (
        !triggerRef.current?.contains(target as Node) &&
        !menuRef.current?.contains(target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleToggle = () => {
    if (disabled) return;
    setOpen((v) => !v);
  };

  const handleSelect = (opt: SelectOption) => {
    if (disabled) return;
    const val = opt?.chave !== undefined && opt?.chave !== null ? String(opt.chave) : "";
    onChange({ target: { name, value: val } });
    setOpen(false);
  };

  const menu = open ? (
    <ul
      ref={menuRef}
      role="listbox"
      aria-labelledby={name}
      style={menuStyle}
      className={`bg-white border rounded shadow-md py-1 ${className}`}
    >
      
      <li
        key="__placeholder__"
        onClick={() => {
          onChange({ target: { name, value: "" } });
          setOpen(false);
        }}
        className="px-3 py-2 cursor-pointer text-sm text-gray-600 hover:bg-gray-100"
        role="option"
        aria-selected={normalizedValue === ""}
      >
        {message}
      </li>

      {options.map((opt, idx) => {
        const isSelected = String(opt.chave) === normalizedValue || !!opt.selecionado;
        return (
          <li
            key={idx}
            onClick={() => handleSelect(opt)}
            className={`px-3 py-2 cursor-pointer text-sm ${
              isSelected ? "bg-primary-100 font-medium" : "hover:bg-gray-100"
            }`}
            role="option"
            aria-selected={isSelected}
          >
            {opt.valor}
          </li>
        );
      })}
    </ul>
  ) : null;

  return (
    <>
      <div className="space-y-2">
        <label htmlFor={name} className="block text-gray-700 uppercase">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        <div className="relative">
          <button
            type="button"
            id={name}
            name={name}
            ref={triggerRef}
            className={`w-full text-left px-3 py-2 border rounded-md bg-white flex items-center justify-between ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            onClick={handleToggle}
            aria-haspopup="listbox"
            aria-expanded={open}
            disabled={!!disabled}
          >
            <span className={`${selectedOption ? "" : "text-gray-500"}`}>
              {selectedOption ? selectedOption.valor : message}
            </span>
            <svg className="w-4 h-4 ml-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d={open ? "M6 18L18 6M6 6l12 12" : "M19 9l-7 7-7-7"} />
            </svg>
          </button>
        </div>
      </div>

      {open && typeof document !== "undefined"
        ? ReactDOM.createPortal(menu, document.body)
        : null}
    </>
  );
}
