import { useState, useCallback, useRef } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { UploadSimple, File, Trash, Table } from '@phosphor-icons/react'
import * as XLSX from 'xlsx'

export interface ParsedSheet {
  headers: string[]
  rows: Record<string, string>[]
  fileName: string
}

interface Props {
  onParsed: (data: ParsedSheet) => void
}

export default function ImportUploadStep({ onParsed }: Props) {
  const { theme } = useTheme()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [parsed, setParsed] = useState<ParsedSheet | null>(null)
  const [error, setError] = useState<string | null>(null)

  const parseFile = useCallback(
    async (file: File) => {
      setError(null)
      try {
        const data = await file.arrayBuffer()
        const wb = XLSX.read(data, { type: 'array' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
          defval: '',
          raw: false,
        })

        if (json.length === 0) {
          setError('Arquivo vazio ou sem dados válidos')
          return
        }

        const headers = Object.keys(json[0])
        const result: ParsedSheet = {
          headers,
          rows: json,
          fileName: file.name,
        }
        setParsed(result)
        onParsed(result)
      } catch {
        setError('Não foi possível ler o arquivo. Verifique se é um XLS, XLSX ou CSV válido.')
      }
    },
    [onParsed],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) parseFile(file)
    },
    [parseFile],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) parseFile(file)
    },
    [parseFile],
  )

  const clear = () => {
    setParsed(null)
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      {!parsed ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
            dragging
              ? 'border-primary bg-primary/10'
              : theme === 'dark'
              ? 'border-dark-600 hover:border-dark-400'
              : 'border-light-300 hover:border-light-400'
          }`}
        >
          <UploadSimple
            size={48}
            className={`mx-auto mb-4 ${
              dragging ? 'text-primary' : theme === 'dark' ? 'text-dark-500' : 'text-dark-400'
            }`}
          />
          <p className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
            Arraste seu arquivo aqui
          </p>
          <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
            ou clique para selecionar (.xlsx, .xls, .csv)
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      ) : (
        <div
          className={`rounded-xl border p-4 ${
            theme === 'dark' ? 'bg-dark-700 border-dark-600' : 'bg-white border-light-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <File size={24} className="text-green-500" />
              </div>
              <div>
                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  {parsed.fileName}
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                  {parsed.rows.length} linhas &middot; {parsed.headers.length} colunas
                </p>
              </div>
            </div>
            <button
              onClick={clear}
              className="p-2 rounded-lg hover:bg-red-100 text-red-500"
              title="Remover arquivo"
            >
              <Trash size={20} />
            </button>
          </div>

          {/* Preview */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {parsed.headers.map((h) => (
                    <th
                      key={h}
                      className={`text-left px-3 py-2 font-medium ${
                        theme === 'dark' ? 'text-dark-300' : 'text-dark-600'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.rows.slice(0, 3).map((row, i) => (
                  <tr
                    key={i}
                    className={theme === 'dark' ? 'border-dark-600' : 'border-light-200'}
                    style={{ borderTopWidth: 1 }}
                  >
                    {parsed.headers.map((h) => (
                      <td
                        key={h}
                        className={`px-3 py-2 ${
                          theme === 'dark' ? 'text-dark-200' : 'text-dark-700'
                        }`}
                      >
                        {String(row[h] ?? '').slice(0, 50)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.rows.length > 3 && (
              <p className={`text-xs text-center mt-2 ${theme === 'dark' ? 'text-dark-500' : 'text-dark-400'}`}>
                ... e mais {parsed.rows.length - 3} linhas
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
