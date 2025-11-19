import * as SQLite from 'expo-sqlite';

// --- DATABASE CORE ---

// Buka atau buat database
export function openDatabase() {
  const db = SQLite.openDatabaseSync('eling.db');
  ensureBaseTable(db);
  ensureRekeningTable(db);
  return db;
}

// --- TRANSAKSI SETUP ---

// Pastikan tabel dasar ada
async function ensureBaseTable(db: SQLite.SQLiteDatabase) {
  try {
    const columns = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(transaksi);"
    );
    // ... (Logika pembuatan tabel transaksi dan migrasi kolom)
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
    // ... (Logika batasan kategori)
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

// --- REKENING SETUP & UPDATE ---

// Pastikan tabel rekening ada
export async function ensureRekeningTable(db: SQLite.SQLiteDatabase) {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS rekening (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bank TEXT NOT NULL UNIQUE,
        saldo REAL NOT NULL DEFAULT 0.0
      );
    `);
    console.log("✅ Tabel rekening dipastikan ada");
  } catch (err) {
    console.error("❌ Gagal memastikan tabel rekening:", err);
  }
}

// Tambahkan rekening baru (dipanggil dari tambah-rekening.tsx)
export async function insertRekening(
  db: SQLite.SQLiteDatabase,
  { bank, saldo }: { bank: string; saldo: number }
) {
  try {
    await db.runAsync(
      `INSERT INTO rekening (bank, saldo) VALUES (?, ?);`,
      [bank, saldo]
    );
    console.log(`💾 Rekening baru '${bank}' disimpan`);
  } catch (error) {
    console.error('❌ Gagal simpan rekening:', error);
  }
}

// Ambil semua rekening (dipanggil dari rekening.tsx)
interface Rekening { id: number; bank: string; saldo: number; }
export async function getAllRekening(db: SQLite.SQLiteDatabase): Promise<Rekening[]> {
  try {
    const data = await db.getAllAsync<Rekening>('SELECT * FROM rekening;');
    return data;
  } catch (error) {
    console.error('❌ Gagal ambil data rekening:', error);
    return [];
  }
}

// FUNGSI BARU: Perbarui saldo rekening
export async function updateRekeningSaldo(
  db: SQLite.SQLiteDatabase,
  bankName: string,
  jumlah: number
) {
  try {
    await db.runAsync(
      `UPDATE rekening SET saldo = saldo + ? WHERE bank = ?;`,
      [jumlah, bankName] // Jika jumlah positif, saldo bertambah. Jika negatif, saldo berkurang.
    );
    console.log(`⬆️ Saldo rekening '${bankName}' diperbarui sebesar ${jumlah}`);
  } catch (error) {
    console.error('❌ Gagal update saldo rekening:', error);
  }
}

// --- FUNGSI TRANSAKSI UTAMA (Logika Update Saldo Ditambahkan di SINI) ---

// Simpan transaksi umum
export async function insertTransaction(
  db: SQLite.SQLiteDatabase,
  { tanggal, jam, rekening, jenis, kategori, jumlah }: { tanggal: string; jam: string; rekening: string; jenis: string; kategori: string; jumlah: number }
) {
  const ok = await ensureCategoryColumn(db, kategori);
  if (!ok) return;

  const cleanName = kategori.replace(/\s+/g, '_');

  try {
    // 1. Catat Transaksi
    await db.runAsync(
      `INSERT INTO transaksi (tanggal, jam, rekening, jenis, ${cleanName})
        VALUES (?, ?, ?, ?, ?);`,
      [tanggal, jam, rekening, jenis, jumlah]
    );
    console.log(`💾 Transaksi '${kategori}' (${jenis}) disimpan`);

    // 2. Perbarui Saldo Rekening
    const adjustment = jenis === 'income' ? jumlah : -jumlah; // Tentukan penyesuaian saldo (+ atau -)
    await updateRekeningSaldo(db, rekening, adjustment);

  } catch (error) {
    console.error('❌ Gagal simpan transaksi:', error);
  }
}

// Pemasukan
export async function insertPemasukan(
  db: SQLite.SQLiteDatabase,
  { tanggal, jam, rekening, kategori, jumlah }: { tanggal: string; jam: string; rekening: string; kategori: string; jumlah: number }
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
  { tanggal, jam, rekening, kategori, jumlah }: { tanggal: string; jam: string; rekening: string; kategori: string; jumlah: number }
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

// Ambil semua transaksi & normalisasi (Disertakan untuk Kelengkapan)
export async function getAllTransactions(db: SQLite.SQLiteDatabase): Promise<any[]> {
  try {
    const data = await db.getAllAsync<any>('SELECT * FROM transaksi;');
    const allCols = await getExistingColumns(db);
    const kategoriCols = allCols.filter(
      c => !['id', 'tanggal', 'jam', 'rekening', 'jenis'].includes(c)
    );
    
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