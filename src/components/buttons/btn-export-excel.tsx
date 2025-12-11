import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";

interface ExportExcelButtonProps {
    data: any[];
    filename?: string;
    sheetName?: string;
    columnMapping?: Record<string, string>; // Maps object keys to display names
}

export default function ExportExcelButton({
    data,
    filename = "exportacao.xlsx",
    sheetName = "Dados",
    columnMapping
}: ExportExcelButtonProps) {

    const handleExport = () => {
        if (!data || data.length === 0) {
            alert('Nenhum dado para exportar');
            return;
        }

        // Transform data to use display names if mapping provided
        const transformedData = data.map(item => {
            if (!columnMapping) return item;

            const transformed: Record<string, any> = {};
            Object.keys(item).forEach(key => {
                const displayKey = columnMapping[key] || key;
                transformed[displayKey] = item[key];
            });
            return transformed;
        });

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(transformedData);

        // Auto-adjust column widths
        const columnWidths = Object.keys(transformedData[0] || {}).map(key => ({
            wch: Math.min(Math.max(key.length, 15), 50)
        }));
        worksheet['!cols'] = columnWidths;

        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        // Trigger download
        XLSX.writeFile(workbook, filename);
    };

    return (
        <Button 
            onClick={handleExport} 
            disabled={!data || data.length === 0}
            variant="outline"
            size="sm"
        >
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
        </Button>
    );
}
