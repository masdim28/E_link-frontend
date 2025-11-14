import * as SQLite from 'expo-sqlite';

// Buka atau buat database
export function openDatabase() {
  const db = SQLite.openDatabaseSync('eling.db');
  ensureBaseTable(db);
  
  return db;
}

// Pastikan tabel dasar ada
async function ensureBaseTable(db: SQLite.SQLiteDatabase) {
  try {
    const columns = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(transaksi);"
    );
    const colNames = columns.map(c => c.name);

    // Jika tabel belum ada, buat baru
    if (columns.length === 0) {
      await db.execAsync(`
        CREATE TABLE transaksi (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tanggal TEXT,
          jam TEXT,
          rekening TEXT,
          jenis TEXT
        );
      `);
      console.log("✅ Tabel transaksi dibuat baru");
      return;
    }

    // Rename kolom 'tipe' lama jadi 'jenis'
    if (colNames.includes('tipe') && !colNames.includes('jenis')) {
      await db.execAsync(`ALTER TABLE transaksi RENAME TO transaksi_old;`);
      await db.execAsync(`
        CREATE TABLE transaksi (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tanggal TEXT,
          jam TEXT,
          rekening TEXT,
          jenis TEXT
        );
      `);
      await db.execAsync(`
        INSERT INTO transaksi (id, tanggal, jam, rekening, jenis)
        SELECT id, tanggal, jam, rekening, tipe FROM transaksi_old;
      `);
      await db.execAsync(`DROP TABLE transaksi_old;`);
      console.log("✅ Kolom 'tipe' diubah ke 'jenis'");
    }

    // Tambahkan kolom dasar jika belum ada
    const baseCols = ['tanggal', 'jam', 'rekening', 'jenis'];
    for (const col of baseCols) {
      if (!colNames.includes(col)) {
        await db.execAsync(`ALTER TABLE transaksi ADD COLUMN ${col} TEXT;`);
        console.log(`✅ Kolom '${col}' ditambahkan`);
      }
    }
  } catch (err) {
    console.error("❌ Gagal memastikan struktur tabel:", err);
  }
}

// Ambil daftar kolom
export async function getExistingColumns(db: SQLite.SQLiteDatabase): Promise<string[]> {
  try {
    const result = await db.getAllAsync<{ name: string }>('PRAGMA table_info(transaksi);');
    return result.map(col => col.name);
  } catch (error) {
    console.error('❌ Gagal ambil kolom:', error);
    return [];
  }
}

// Pastikan kolom kategori ada
export async function ensureCategoryColumn(db: SQLite.SQLiteDatabase, kategori: string): Promise<boolean> {
  const cleanName = kategori.replace(/\s+/g, '_');
  const cols = await getExistingColumns(db);

  if (!cols.includes(cleanName)) {
    const countKategori = cols.length - 5; // kolom dasar
    if (countKategori >= 50) {
      console.warn('⚠️ Maksimal 50 kategori sudah tercapai');
      return false;
    }

    try {
      await db.execAsync(`ALTER TABLE transaksi ADD COLUMN ${cleanName} REAL;`);
      console.log(`✅ Kolom baru '${cleanName}' ditambahkan`);
      return true;
    } catch (error) {
      console.error('❌ Gagal menambah kolom:', error);
      return false;
    }
  }

  return true;
}

// Simpan transaksi umum
export async function insertTransaction(
  db: SQLite.SQLiteDatabase,
  {
    tanggal,
    jam,
    rekening,
    jenis,
    kategori,
    jumlah,
  }: {
    tanggal: string;
    jam: string;
    rekening: string;
    jenis: string;
    kategori: string;
    jumlah: number;
  }
) {
  const ok = await ensureCategoryColumn(db, kategori);
  if (!ok) return;

  const cleanName = kategori.replace(/\s+/g, '_');

  try {
    await db.runAsync(
      `INSERT INTO transaksi (tanggal, jam, rekening, jenis, ${cleanName})
       VALUES (?, ?, ?, ?, ?);`,
      [tanggal, jam, rekening, jenis, jumlah]
    );
    console.log(`💾 Transaksi '${kategori}' (${jenis}) disimpan`);
  } catch (error) {
    console.error('❌ Gagal simpan transaksi:', error);
  }
}

// Pemasukan
export async function insertPemasukan(
  db: SQLite.SQLiteDatabase,
  {
    tanggal,
    jam,
    rekening,
    kategori,
    jumlah,
  }: {
    tanggal: string;
    jam: string;
    rekening: string;
    kategori: string;
    jumlah: number;
  }
) {
  return insertTransaction(db, {
    tanggal,
    jam,
    rekening,
    jenis: 'income',
    kategori,
    jumlah,
  });
}

// Pengeluaran
export async function insertPengeluaran(
  db: SQLite.SQLiteDatabase,
  {
    tanggal,
    jam,
    rekening,
    kategori,
    jumlah,
  }: {
    tanggal: string;
    jam: string;
    rekening: string;
    kategori: string;
    jumlah: number;
  }
) {
  return insertTransaction(db, {
    tanggal,
    jam,
    rekening,
    jenis: 'expense',
    kategori,
    jumlah,
  });
}

// Ambil semua transaksi & normalisasi
export async function getAllTransactions(db: SQLite.SQLiteDatabase): Promise<any[]> {
  try {
    const data = await db.getAllAsync<any>('SELECT * FROM transaksi;');
    const allCols = await getExistingColumns(db);
    const kategoriCols = allCols.filter(
      c => !['id', 'tanggal', 'jam', 'rekening', 'jenis'].includes(c)
    );

    // Pastikan semua baris punya semua kolom kategori
    const normalized = data.map(row => {
      const filled = { ...row };
      for (const col of kategoriCols) {
        if (filled[col] == null) filled[col] = 0;
      }
      return filled;
    });

    return normalized;
  } catch (error) {
    console.error('❌ Gagal ambil data:', error);
    return [];
  }
}
