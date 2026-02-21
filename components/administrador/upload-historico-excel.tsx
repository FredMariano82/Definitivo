"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, RefreshCw, CheckCircle2 } from "lucide-react"

export default function UploadHistoricoExcel() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [columns, setColumns] = useState<string[]>([])

  // Refs for scroll synchronization
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const topScrollRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null) // New ref for table content
  const [scrollWidth, setScrollWidth] = useState(0)

  // Column order definition
  const PREDEFINED_ORDER = [
    "Data",
    "Cliente",
    "Nome / Documento (sem ponto)",
    "A Sim/Não",
    "A Empresa",
    "# Q",
    "Depto",
    "Data Inicial do Acesso",
    "Data Final do Acesso",
    "A Assinatura",
    "Validade"
  ];

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/airtable')
      if (!response.ok) {
        throw new Error('Falha ao buscar dados')
      }
      const result = await response.json()

      if (result.records && result.records.length > 0) {
        const allKeys = new Set<string>()
        result.records.forEach((record: any) => {
          Object.keys(record.fields).forEach(key => {
            if (key !== "Created By" && key !== "Created") {
              allKeys.add(key)
            }
          })
        })

        const sortedColumns = Array.from(allKeys).sort((a, b) => {
          const indexA = PREDEFINED_ORDER.indexOf(a);
          const indexB = PREDEFINED_ORDER.indexOf(b);

          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;

          return a.localeCompare(b);
        });

        // Apply row splitting logic for multiple names
        const NOME_COLUMN_NAME = "Nome / Documento (sem ponto)";
        const processedRecords = splitRowsByName(result.records, NOME_COLUMN_NAME);

        setData(processedRecords)
        setColumns(sortedColumns)
      } else {
        setData([])
        setColumns([])
      }
    } catch (err) {
      setError('Erro ao carregar dados do Airtable. Verifique as configurações.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Effect to synchronize scrolling
  useEffect(() => {
    const tableContainer = tableContainerRef.current
    const topScroll = topScrollRef.current
    const tableElement = tableRef.current

    if (!tableContainer || !topScroll) return

    const handleTableScroll = () => {
      if (topScroll && tableContainer) {
        topScroll.scrollLeft = tableContainer.scrollLeft
      }
    }

    const handleTopScroll = () => {
      if (tableContainer && topScroll) {
        tableContainer.scrollLeft = topScroll.scrollLeft
      }
    }

    const updateWidth = () => {
      // We want to sync the top scrollbar's inner width with the table's real scrollable width.
      // If content overflows, tableContainer.scrollWidth gives the total width.
      if (tableContainer) {
        setScrollWidth(tableContainer.scrollWidth)
      }
    }
    updateWidth()

    const observer = new ResizeObserver(updateWidth)

    // Key fix: Observe the TABLE element (content), not just the container.
    // When table grows due to long text, this triggers.
    if (tableElement) {
      observer.observe(tableElement)
    }
    // Also observe container in case it resizes (window resize)
    if (tableContainer) {
      observer.observe(tableContainer)
    }

    tableContainer.addEventListener('scroll', handleTableScroll)
    topScroll.addEventListener('scroll', handleTopScroll)

    return () => {
      tableContainer.removeEventListener('scroll', handleTableScroll)
      topScroll.removeEventListener('scroll', handleTopScroll)
      observer.disconnect()
    }
  }, [data, columns])

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      // Use UTC to prevent timezone shifts
      return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(date)
    } catch {
      return dateString
    }
  }

  // Function to split rows with multiple names
  const splitRowsByName = (records: any[], nomeColumnName: string) => {
    const newRecords: any[] = [];

    // Helper to detect if a string is likely just a document number (formatted or unformatted)
    const isLikelyDocument = (text: string) => {
      const clean = text.trim();
      // Allow RG chars: digits, ., -, spaces, and X/x at end.
      const digits = clean.replace(/[^0-9]/g, '').length;
      const letters = clean.replace(/[^a-zA-Z]/g, '').length;

      // Heuristic: If it has at least 5 digits and very few letters (allowing for 'x' in RG or 'RG' prefix)
      // "30 051 685 X" -> 8 digits, 1 letter.
      // "RG 12.345.678-9" -> 8 digits, 2 letters.
      if (digits >= 5 && letters <= 4) return true;

      return false;
    }

    records.forEach(record => {
      const nomeValue = record.fields[nomeColumnName];

      if (!nomeValue || typeof nomeValue !== 'string') {
        newRecords.push(record);
        return;
      }

      const lines = nomeValue.split(/\r\n|\r|\n/);

      if (lines.length <= 1) {
        newRecords.push(record);
        return;
      }

      // Smart merging logic
      const mergedLines: string[] = [];
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (mergedLines.length > 0) {
          const lastIdx = mergedLines.length - 1;
          // Check if current line is a document that belongs to the previous line (which acts as a Name)
          // Only merge if the previous line DOES NOT look like a document (i.e., it's a name)
          if (isLikelyDocument(trimmed) && !isLikelyDocument(mergedLines[lastIdx])) {
            mergedLines[lastIdx] = mergedLines[lastIdx] + " " + trimmed;
            return;
          }
        }
        mergedLines.push(trimmed);
      });

      if (mergedLines.length === 0) {
        newRecords.push(record);
        return;
      }

      // Create a new record for each merged line
      mergedLines.forEach((namePart, index) => {
        // Clone the record
        const newRecord = JSON.parse(JSON.stringify(record));
        // Append a unique suffix to ID to avoid key duplication in React list
        newRecord.id = `${record.id}-${index}`;
        // Update the name field with the single (or merged) name
        newRecord.fields[nomeColumnName] = namePart.trim();
        newRecords.push(newRecord);
      });
    });

    return newRecords;
  }

  // Helper to format Name/Document
  const formatNomeDocumento = (value: string) => {
    if (!value) return ''
    let text = String(value)

    // Remove "RG" and "CPF" (case insensitive) and specific punctuation
    text = text.replace(/(RG|CPF|CNH)/gi, '').replace(/[.\-:]/g, ' ')

    // Normalize spaces
    text = text.replace(/\s+/g, ' ').trim()

    // Title Case
    text = text.toLowerCase().replace(/(?:^|\s)\S/g, function (a) { return a.toUpperCase(); });

    return text
  }

  const DATE_COLUMNS = ["Data", "Data Inicial do Acesso", "Data Final do Acesso", "Validade"]
  const NOME_COLUMN = "Nome / Documento (sem ponto)"
  const CHECK_COLUMN = "A Sim/Não" // Needs to match exact Airtable column name for boolean check

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-4">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Levantamento Airtable</h2>
          <p className="text-muted-foreground">
            Visualização direta dos dados do Airtable (Formatada)
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {data.length > 0 ? `Atualizar Dados (${data.length})` : 'Carregar Dados do Airtable'}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md shrink-0">
          {error}
        </div>
      )}

      <Card className="flex-1 flex flex-col overflow-hidden border-2 shadow-md">
        <CardHeader className="shrink-0 pb-2 bg-muted/20 border-b">
          <CardTitle>Dados Importados</CardTitle>
          <CardDescription>
            Use as barras de rolagem (superior ou inferior) para navegar.
          </CardDescription>
        </CardHeader>

        {data.length > 0 && (
          <div
            ref={topScrollRef}
            className="overflow-x-auto w-full border-b bg-muted/10 shrink-0"
            style={{ height: '16px' }}
          >
            <div style={{ width: `${scrollWidth}px`, height: '1px' }} />
          </div>
        )}

        <div
          ref={tableContainerRef}
          className="flex-1 overflow-auto relative w-full border rounded-b-md"
        >
          <CardContent className="p-0 h-full w-full absolute inset-0">
            {data.length === 0 && !loading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Nenhum dado carregado. Clique no botão acima para buscar.
              </div>
            ) : (
              <div className="w-full h-full">
                <table ref={tableRef} className="w-full caption-bottom text-sm text-left">
                  <thead className="sticky top-0 z-50 bg-background shadow-md [&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted hover:bg-transparent">
                      {columns.map((col) => (
                        <th key={col} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap bg-secondary/90 text-secondary-foreground font-bold border-b border-r shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {loading ? (
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <td colSpan={columns.length || 1} className="p-4 align-middle h-24 text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                          <span className="sr-only">Carregando...</span>
                        </td>
                      </tr>
                    ) : (
                      data.map((record, index) => (
                        <tr key={record.id} className={`border-b transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'} hover:bg-muted/80`}>
                          {columns.map((col) => {
                            let content: React.ReactNode = record.fields[col];
                            const isDate = DATE_COLUMNS.includes(col);
                            const isName = col === NOME_COLUMN;
                            const isCheck = col === CHECK_COLUMN;

                            if (isCheck) {
                              // Handle boolean or "true"/"Sim" check
                              if (content === true || content === "true" || content === "Sim" || content === "Checked") {
                                content = <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />;
                              } else {
                                content = "";
                              }
                            } else if (content) {
                              if (typeof content === 'object') {
                                content = JSON.stringify(content);
                              } else {
                                let strContent = String(content);
                                if (isDate) {
                                  content = formatDate(strContent);
                                } else if (isName) {
                                  content = formatNomeDocumento(strContent);
                                }
                              }
                            } else {
                              content = '';
                            }

                            return (
                              <td
                                key={`${record.id}-${col}`}
                                className={`p-4 align-middle border-r ${isName || isCheck
                                  ? "whitespace-nowrap"
                                  : "whitespace-nowrap max-w-[300px] truncate"
                                  }`}
                                title={typeof content === 'string' ? content : ''}
                              >
                                {content}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  )
}
