import * as SQLite from "expo-sqlite";

// =============================
//  OPEN DB + BASE TABLE SETUP
// =============================
export function openDatabase() {
  const db = SQLite.openDatabaseSync("eling.db");
  ensureTransaksiTable(db);
  ensureRekeningTable(db);

  // Tambah rekening default Uang Tunai
  ensureDefaultCashWallet(db);

  return db;
}


// Tabel transaksi
async function ensureTransaksiTable(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transaksi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tanggal TEXT,
      jam TEXT,
      rekening TEXT,
      jenis TEXT
    );
  `);
}

// Ambil semua kolom tabel
export async function getExistingColumns(db: SQLite.SQLiteDatabase) {
  const result = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(transaksi);"
  );
  return result.map((c) => c.name);
}

// Tambah kolom kategori baru jika belum ada
export async function ensureCategoryColumn(db: SQLite.SQLiteDatabase, kategori: string) {
  const cleanName = kategori.replace(/\s+/g, "_");
  const cols = await getExistingColumns(db);

  if (!cols.includes(cleanName)) {
    await db.execAsync(`ALTER TABLE transaksi ADD COLUMN ${cleanName} REAL;`);
  }
}

// =============================
//   REKENING MANAGEMENT
// =============================
export async function ensureRekeningTable(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS rekening (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank TEXT UNIQUE,
      saldo REAL DEFAULT 0
    );
  `);
}
// =============================
//   DEFAULT WALLET (UANG TUNAI)
// =============================
async function ensureDefaultCashWallet(db: SQLite.SQLiteDatabase) {
  await db.runAsync(
    `INSERT OR IGNORE INTO rekening (id, bank, saldo)
     VALUES (1, 'Uang Tunai', 0);`
  );
}


// =============================
//   CEK NAMA REKENING SUDAH ADA
// =============================
export async function isRekeningExists(
  db: SQLite.SQLiteDatabase,
  bank: string
) {
  const result = await db.getFirstAsync<{ jml: number }>(
    `SELECT COUNT(*) AS jml FROM rekening WHERE bank = ?;`,
    [bank]
  );

  return (result?.jml ?? 0) > 0;
}


// Ambil semua rekening
export async function getAllRekening(db: SQLite.SQLiteDatabase) {
  return await db.getAllAsync("SELECT * FROM rekening;");
}

// Tambah rekening baru
export async function insertRekening(db: SQLite.SQLiteDatabase, bank: string, saldo: number) {
  await db.runAsync(
    `INSERT OR IGNORE INTO rekening (bank, saldo) VALUES (?, ?);`,
    [bank, saldo]
  );
}

// Update saldo rekening
export async function updateRekeningSaldo(
  db: SQLite.SQLiteDatabase,
  bank: string,
  jumlah: number
) {
  await db.runAsync(
    `UPDATE rekening SET saldo = saldo + ? WHERE bank = ?;`,
    [jumlah, bank]
  );
}

// ===========================================
//  *AUTO CREATE REKENING IF DOESN’T EXIST*
// ===========================================
export async function ensureRekeningExists(
  db: SQLite.SQLiteDatabase,
  bank: string
) {
  const result = await db.getFirstAsync(
    `SELECT * FROM rekening WHERE bank = ?;`,
    [bank]
  );

  if (!result) {
    await insertRekening(db, bank, 0); // saldo awal 0
  }
}

// =============================
//       INSERT TRANSACTION
// =============================
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
    jenis: "income" | "expense";
    kategori: string;
    jumlah: number;
  }
) {
  // Pastikan rekening ada
  await ensureRekeningExists(db, rekening);

  // Pastikan kolom kategori ada
  await ensureCategoryColumn(db, kategori);
  const cleanName = kategori.replace(/\s+/g, "_");

  // Simpan transaksi
  await db.runAsync(
    `INSERT INTO transaksi (tanggal, jam, rekening, jenis, ${cleanName})
     VALUES (?, ?, ?, ?, ?);`,
    [tanggal, jam, rekening, jenis, jumlah]
  );

  // ======== UPDATE SALDO REKENING ========
  if (kategori !== "Saldo Awal") {
    const adj = jenis === "income" ? jumlah : -jumlah;
    await updateRekeningSaldo(db, rekening, adj);
  }
}

// Wrapper Pemasukan
export async function insertPemasukan(db: SQLite.SQLiteDatabase, data: any) {
  return insertTransaction(db, { jenis: "income", ...data });
}

// Wrapper Pengeluaran
export async function insertPengeluaran(db: SQLite.SQLiteDatabase, data: any) {
  return insertTransaction(db, { jenis: "expense", ...data });
}

// Ambil semua transaksi
export async function getAllTransactions(db: SQLite.SQLiteDatabase) {
  const data = await db.getAllAsync("SELECT * FROM transaksi;");
  return data;
}

// =============================
//   GET TRANSAKSI BY ID
// =============================
export async function getTransaksiById(db: SQLite.SQLiteDatabase, id: number) {
  return await db.getFirstAsync(
    `SELECT * FROM transaksi WHERE id = ?;`,
    [id]
  );
}

// =============================
//   UPDATE TRANSAKSI
// =============================
export async function updateTransaksi(
  db: SQLite.SQLiteDatabase,
  id: number,
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
    jenis: "income" | "expense";
    kategori: string;
    jumlah: number;
  }
) {
  await ensureCategoryColumn(db, kategori);
  const cleanName = kategori.replace(/\s+/g, "_");

  await db.runAsync(
    `
      UPDATE transaksi
      SET tanggal = ?, jam = ?, rekening = ?, jenis = ?, ${cleanName} = ?
      WHERE id = ?;
    `,
    [tanggal, jam, rekening, jenis, jumlah, id]
  );
}

// =============================
//   GET REKENING BY ID
// =============================
export async function getRekeningById(db: SQLite.SQLiteDatabase, id: number) {
  return await db.getFirstAsync(
    `SELECT * FROM rekening WHERE id = ?;`,
    [id]
  );
}

// =============================
//   UPDATE REKENING (EDIT)
// =============================
export async function updateRekening(
  db: SQLite.SQLiteDatabase,
  id: number,
  bank: string,
  saldo: number
) {
  await db.runAsync(
    `UPDATE rekening SET bank = ?, saldo = ? WHERE id = ?;`,
    [bank, saldo, id]
  );
}

// =============================
//   DELETE REKENING
// =============================
export async function deleteRekening(
  db: SQLite.SQLiteDatabase,
  id: number
) {
  await db.runAsync(
    `DELETE FROM rekening WHERE id = ?;`,
    [id]
  );
}
