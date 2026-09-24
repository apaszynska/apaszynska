import { useId, useRef, useState } from 'react'

interface Props {
  onFile: (file: File) => void
  onLoadSample: () => void
  busy?: boolean
}

export function UploadZone({ onFile, onLoadSample, busy }: Props) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (file) onFile(file)
  }

  return (
    <section className="upload" aria-labelledby={`${inputId}-title`}>
      <div
        className={`upload__drop ${dragging ? 'is-dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
      >
        <h2 id={`${inputId}-title`}>Wgraj wyciąg CSV</h2>
        <p>
          Obsługujemy eksport N26 (Booking Date, Amount) oraz typowe polskie wyciągi
          (średnik, daty DD.MM.YYYY, kwoty 1.234,56). Dane wrażliwe (IBAN, konta) są
          pomijane — analizujemy tylko co, ile i kiedy.
        </p>
        <div className="upload__actions">
          <label className="btn btn--primary" htmlFor={inputId}>
            {busy ? 'Wczytywanie…' : 'Wybierz plik CSV'}
          </label>
          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            disabled={busy}
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button type="button" className="btn btn--ghost" onClick={onLoadSample} disabled={busy}>
            Załaduj dane demo
          </button>
        </div>
      </div>
    </section>
  )
}
