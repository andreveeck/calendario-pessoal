import { useCallback, useEffect, useState } from 'react'
import initSqlJs, { type Database, type QueryExecResult, type SqlJsStatic, type SqlValue } from 'sql.js'

const DB_NAME = 'webcal-db'
const STORE_NAME = 'database'
const STORAGE_KEY = 'webcal-database'

const MIGRATION_SQL = `
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    all_day INTEGER DEFAULT 0,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    color TEXT,
    label TEXT,
    reminder_minutes INTEGER,
    recurrence_rule TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
  CREATE INDEX IF NOT EXISTS idx_events_label ON events(label);
`

const openIndexedDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'))
  })

const getPersistedDatabase = async (): Promise<ArrayBuffer | Uint8Array | null> => {
  try {
    const database = await openIndexedDb()

    return await new Promise<ArrayBuffer | Uint8Array | null>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(STORAGE_KEY)

      request.onsuccess = () => {
        const value = request.result

        if (value instanceof ArrayBuffer) {
          resolve(value)
          return
        }

        if (value instanceof Uint8Array) {
          resolve(value)
          return
        }

        resolve(null)
      }

      request.onerror = () => reject(request.error ?? new Error('Failed to load database from IndexedDB'))
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      return null
    }

    throw error
  }
}

const saveDatabaseToIndexedDb = async (database: Database): Promise<void> => {
  const databaseBlob = database.export()
  const arrayBuffer = databaseBlob.buffer.slice(
    databaseBlob.byteOffset,
    databaseBlob.byteOffset + databaseBlob.byteLength,
  ) as ArrayBuffer

  const indexedDb = await openIndexedDb()

  await new Promise<void>((resolve, reject) => {
    const transaction = indexedDb.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(arrayBuffer, STORAGE_KEY)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Failed to save database to IndexedDB'))
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Failed to save database to IndexedDB'))
  })
}

export default function useSQLite() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [db, setDb] = useState<Database | null>(null)
  const [sqlJs, setSqlJs] = useState<SqlJsStatic | null>(null)

  const saveDatabase = useCallback(async (database: Database) => {
    try {
      await saveDatabaseToIndexedDb(database)
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Failed to persist database'
      setError(message)
    }
  }, [])

  const executeQuery = useCallback(
    async (sql: string, params: SqlValue[] = []): Promise<QueryExecResult[]> => {
      if (!db) {
        throw new Error('Database is not initialized yet.')
      }

      const isMutation = /\b(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|REPLACE|BEGIN|COMMIT|ROLLBACK)\b/i.test(
        sql.trim(),
      )

      try {
        if (isMutation) {
          db.run(sql, params)

          await saveDatabase(db)

          return []
        }

        return db.exec(sql, params)
      } catch (queryError) {
        const message = queryError instanceof Error ? queryError.message : 'Error executing SQL query.'
        setError(message)
        throw queryError
      }
    },
    [db, saveDatabase],
  )

  const exportDatabase = useCallback(() => db?.export() ?? null, [db])

  const importDatabase = useCallback(
    async (databaseData: ArrayBuffer) => {
      if (!sqlJs) {
        throw new Error('SQLite ainda não foi inicializado.')
      }

      const importedDatabase = new sqlJs.Database(new Uint8Array(databaseData))

      importedDatabase.exec(MIGRATION_SQL)
      await saveDatabase(importedDatabase)
      setError(null)
      setDb(importedDatabase)
    },
    [saveDatabase, sqlJs],
  )

  useEffect(() => {
    let isMounted = true

    const initializeDatabase = async () => {
      try {
        setLoading(true)
        setError(null)

        const SQL = await initSqlJs({
          locateFile: () => '/sql-wasm.wasm',
        })

        const persistedData = await getPersistedDatabase()

        const nextDb = persistedData
          ? new SQL.Database(new Uint8Array(persistedData))
          : new SQL.Database()

        nextDb.exec(MIGRATION_SQL)

        await saveDatabase(nextDb)

        if (!isMounted) {
          return
        }

        setSqlJs(SQL)
        setDb(nextDb)
      } catch (databaseError) {
        if (!isMounted) {
          return
        }

        const message = databaseError instanceof Error ? databaseError.message : 'Failed to initialize SQLite database.'
        setError(message)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void initializeDatabase()

    return () => {
      isMounted = false
    }
  }, [saveDatabase])

  return {
    loading,
    error,
    db,
    executeQuery,
    exportDatabase,
    importDatabase,
  }
}
