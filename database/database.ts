import * as SQLite from "expo-sqlite";

// === DEFINISI TIPE BARU UNTUK HASIL KUERI TRANSAKSI ===
type TransaksiQueryResult = {
    id: number;
    tanggal: string;
    jam: string;
    rekening: string;
    jenis: 'income' | 'expense';
    [key: string]: any; 
};
// ======================================================

// =============================
//  OPEN DB + BASE TABLE SETUP
// =============================
export function openDatabase() {
    const db = SQLite.openDatabaseSync("eling.db");
    
    (async () => {
        try {
            // PASTIKAN URUTAN
            await ensureTransaksiTable(db);
            await ensureRekeningTable(db); 
            await ensureDefaultCashWallet(db); 
        } catch (error) {
            console.error("Gagal melakukan setup tabel database:", error);
        }
    })();
    
    return db;
}


// Tabel transaksi (Perubahan: Menghilangkan AUTOINCREMENT)
async function ensureTransaksiTable(db: SQLite.SQLiteDatabase) {
    // SQL paling minimalis: Gunakan INTEGER PRIMARY KEY saja.
    await db.execAsync(`CREATE TABLE IF NOT EXISTS transaksi (id INTEGER PRIMARY KEY, tanggal TEXT, jam TEXT, rekening TEXT, jenis TEXT);`);
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
        // Menggunakan tanda kutip ganda untuk menghindari syntax error pada nama kolom
        await db.execAsync(`ALTER TABLE transaksi ADD COLUMN "${cleanName}" REAL;`);
    }
}

// =============================
//   REKENING MANAGEMENT (Perubahan: Menghilangkan AUTOINCREMENT)
// =============================
export async function ensureRekeningTable(db: SQLite.SQLiteDatabase) {
    // SQL paling minimalis: Gunakan INTEGER PRIMARY KEY saja.
    await db.execAsync(`CREATE TABLE IF NOT EXISTS rekening (id INTEGER PRIMARY KEY, bank TEXT UNIQUE, saldo REAL DEFAULT 0);`);
}
// =============================
//   DEFAULT WALLET (UANG TUNAI)
// =============================
async function ensureDefaultCashWallet(db: SQLite.SQLiteDatabase) {
    await db.runAsync(
        `INSERT OR IGNORE INTO rekening (id, bank, saldo) VALUES (1, 'Uang Tunai', 0);`
    );
}


// =============================
//   CEK NAMA REKENING SUDAH ADA
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
//  *AUTO CREATE REKENING IF DOESN’T EXIST*
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
//       INSERT TRANSACTION
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
    await ensureRekeningExists(db, rekening);
    await ensureCategoryColumn(db, kategori);
    const cleanName = kategori.replace(/\s+/g, "_");

    await db.runAsync(
        `INSERT INTO transaksi (tanggal, jam, rekening, jenis, "${cleanName}") VALUES (?, ?, ?, ?, ?);`,
        [tanggal, jam, rekening, jenis, jumlah]
    );

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
    return await db.getAllAsync("SELECT * FROM transaksi;");
}

// =============================
//   GET TRANSAKSI BY ID
// =============================
export async function getTransaksiById(db: SQLite.SQLiteDatabase, id: number) {
    return await db.getFirstAsync(
        `SELECT * FROM transaksi WHERE id = ?;`,
        [id]
    );
}

// =============================
//   UPDATE TRANSAKSI
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
        `UPDATE transaksi SET tanggal = ?, jam = ?, rekening = ?, jenis = ?, "${cleanName}" = ? WHERE id = ?;`,
        [tanggal, jam, rekening, jenis, jumlah, id]
    );
}

// =============================
//   GET REKENING BY ID
// =============================
export async function getRekeningById(db: SQLite.SQLiteDatabase, id: number) {
    return await db.getFirstAsync(
        `SELECT * FROM rekening WHERE id = ?;`,
        [id]
    );
}

// =============================
//   UPDATE REKENING (EDIT)
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
//   DELETE REKENING
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
export async function updateNamaRekeningDiTransaksi(
    db: SQLite.SQLiteDatabase,
    oldName: string,
    newName: string
) {
    await db.runAsync(
        `UPDATE transaksi SET rekening = ? WHERE rekening = ?`,
        [newName, oldName]
    );
}

// =============================
//   UPDATE SALDO UTILITY (Fungsi Edit Transaksi)
// =============================

export async function getOldTransactionDetails(db: SQLite.SQLiteDatabase, id: number) {
    const transaction = await db.getFirstAsync<TransaksiQueryResult>(`SELECT * FROM transaksi WHERE id = ?;`, [id]);
    
    if (!transaction) return null;

    const categoryKeys = Object.keys(transaction).filter(
        (k) => !['id', 'tanggal', 'jam', 'rekening', 'jenis'].includes(k)
    );
    
    const foundKategoriKey = categoryKeys.find((k) => Number(transaction[k]) > 0); 
    const jumlah = foundKategoriKey ? Number(transaction[foundKategoriKey]) : 0;
    const kategori = foundKategoriKey ? foundKategoriKey.replace(/_/g, ' ') : '';

    return {
        rekening: transaction.rekening, 
        jenis: transaction.jenis, 
        jumlah: jumlah,
        kategori: kategori
    };
}


// Fungsi untuk membalikkan efek saldo transaksi lama
export async function reverseTransactionEffect(
    db: SQLite.SQLiteDatabase,
    rekening: string,
    jenis: 'income' | 'expense',
    jumlah: number,
    kategori: string 
) {
    if (kategori === "Saldo Awal") return;

    const reverseAdj = jenis === 'income' ? -jumlah : jumlah;
    
    await updateRekeningSaldo(db, rekening, reverseAdj);
}

// Fungsi untuk menerapkan efek saldo transaksi baru 
export async function applyNewTransactionEffect(
    db: SQLite.SQLiteDatabase,
    rekening: string,
    jenis: 'income' | 'expense',
    jumlah: number,
    kategori: string 
) {
    if (kategori === "Saldo Awal") return;

    const adj = jenis === 'income' ? jumlah : -jumlah;
    await updateRekeningSaldo(db, rekening, adj);
}

// ====================================================================
//  UTILITY UNTUK KOREKSI TRANSAKSI SALDO AWAL
// ====================================================================

export async function updateInitialBalanceTransaction(
    db: SQLite.SQLiteDatabase,
    rekeningName: string,
    newAmount: number
) {
    await ensureCategoryColumn(db, 'Saldo Awal'); 
    const cleanName = 'Saldo_Awal'; 

    await db.runAsync(
        `UPDATE transaksi SET "${cleanName}" = ? WHERE rekening = ? AND jenis = 'income' AND "${cleanName}" > 0;`,
        [newAmount, rekeningName]
    );
}

export async function deleteInitialBalanceTransaction(
    db: SQLite.SQLiteDatabase,
    rekeningName: string
) {
    const cleanName = 'Saldo_Awal'; 
    
    await db.runAsync(
        `DELETE FROM transaksi WHERE rekening = ? AND jenis = 'income' AND "${cleanName}" > 0;`,
        [rekeningName]
    );
}