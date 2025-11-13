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

    // Jika ada kolom lama 'tipe', rename menjadi 'jenis'
    if (colNames.includes('tipe') && !colNames.includes('jenis')) {
      await db.execAsync(`
        ALTER TABLE transaksi RENAME TO transaksi_old;
      `);
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
      console.log("✅ Kolom 'tipe' di-rename menjadi 'jenis'");
    }

    // Tambahkan kolom jam kalau belum ada
    if (!colNames.includes('jam')) {
      await db.execAsync(`ALTER TABLE transaksi ADD COLUMN jam TEXT;`);
      console.log("✅ Kolom 'jam' ditambahkan");
    }

    // Tambahkan kolom tanggal kalau belum ada
    if (!colNames.includes('tanggal')) {
      await db.execAsync(`ALTER TABLE transaksi ADD COLUMN tanggal TEXT;`);
      console.log("✅ Kolom 'tanggal' ditambahkan");
    }

    // Tambahkan kolom rekening kalau belum ada
    if (!colNames.includes('rekening')) {
      await db.execAsync(`ALTER TABLE transaksi ADD COLUMN rekening TEXT;`);
      console.log("✅ Kolom 'rekening' ditambahkan");
    }

    // Tambahkan kolom jenis kalau belum ada
    if (!colNames.includes('jenis')) {
      await db.execAsync(`ALTER TABLE transaksi ADD COLUMN jenis TEXT;`);
      console.log("✅ Kolom 'jenis' ditambahkan");
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
    const countKategori = cols.length - 5; // kolom dasar: id, tanggal, jam, rekening, jenis
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

// Insert transaksi umum
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
    jenis: string; // 'income' atau 'expense'
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
    console.log(`💾 Transaksi '${kategori}' (${jenis}) berhasil disimpan`);
  } catch (error) {
    console.error('❌ Gagal simpan transaksi:', error);
  }
}

// Versi khusus pemasukan
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

// Versi khusus pengeluaran
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

// Ambil semua transaksi
export async function getAllTransactions(db: SQLite.SQLiteDatabase): Promise<any[]> {
  try {
    const data = await db.getAllAsync<any>('SELECT * FROM transaksi;');
    return data;
  } catch (error) {
    console.error('❌ Gagal ambil data:', error);
    return [];
  }
}
