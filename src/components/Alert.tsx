"use client";
import { AlertItem, useAlert } from "@/hooks/use-alert";
import { cva } from "class-variance-authority";
import { Terminal } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

// Keep visual style of single alert, but remove absolute from the variant
const alertVariants = cva("w-fit max-w-full p-4 rounded-lg shadow-lg", {
  variants: {
    type: {
      success: "bg-green-200 border border-green-500 text-green-800",
      error: "bg-red-200 border border-red-500 text-red-800",
      info: "bg-blue-200 border border-blue-500 text-blue-800",
      warning: "bg-yellow-200 border border-yellow-500 text-yellow-800",
    },
  },
  defaultVariants: {
    type: "info",
  },
});

export function GlobalAlert() {
  const { alerts, removeAlert } = useAlert();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !alerts || alerts.length === 0) return null;

  // Renderiza num portal no <body> com z-index acima de qualquer modal/overlay,
  // garantindo que os alertas fiquem sempre na primeira camada da tela.
  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] flex flex-col items-end gap-3 pointer-events-none">
      {alerts.map((a: AlertItem) => (
        <Alert key={a.id} className={`${alertVariants({ type: a.type })} pointer-events-auto`}>
          <Terminal className="h-4 w-4" />
          <AlertTitle className="font-bold text-neutral-800">Atenção !!</AlertTitle>
          <AlertDescription className="font-bold text-neutral-800">{a.message}</AlertDescription>
          <button
            onClick={() => removeAlert(a.id)}
            className="absolute top-0 right-0 p-2 text-xl text-gray-700 hover:text-gray-900"
            aria-label="Fechar alerta"
          >
            X
          </button>
        </Alert>
      ))}
    </div>,
    document.body
  );
}
