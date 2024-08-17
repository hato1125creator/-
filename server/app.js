const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const app = express();
const port = 3006;

// MySQL接続設定
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'reservation_system'
});

connection.connect(err => {
    if (err) {
        console.error('MySQL接続エラー:', err.stack);
        return;
    }
    console.log('MySQLに接続しました。ID:', connection.threadId);
});

// nodemailerの設定
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'hato2008125@gmail.com',
        pass: 'ldsy vaiw nnkq glgs' // パスワードは実際のものに置き換えてください
    }
});

// ミドルウェア設定
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// サンプルデータ
let attendanceCount = 0;

// 予約処理エンドポイント
app.post('/api/reserve', async (req, res) => {
    const { name, contact, relationship } = req.body;

    const sql = 'INSERT INTO reservations (name, contact, relationship) VALUES (?, ?, ?)';
    connection.query(sql, [name, contact, relationship], async (err, result) => {
        if (err) {
            console.error('予約情報の挿入エラー:', err.message);
            res.status(500).json({ message: '予約の保存に失敗しました', error: err.message });
            return;
        }

        console.log('予約情報が保存されました:', result);

        // QRコード生成
        const qrData = `http://localhost:3006/guest/verify?id=${result.insertId}`;
        try {
            const qrCodeDataUrl = await QRCode.toDataURL(qrData);
            console.log('QRコードURL:', qrCodeDataUrl);

            // メール送信
            const mailOptions = {
                from: 'hato2008125@gmail.com',
                to: contact,
                subject: '予約確認',
                html: `
                    <p>予約が完了しました。以下のQRコードを受付でご提示ください。</p>
                    <p><img src="${qrCodeDataUrl}" alt="QR Code" ></p>
                `,
                attachments: [
                    {
                        filename: 'qrcode.png',
                        content: qrCodeDataUrl.split(';base64,').pop(),
                        encoding: 'base64'
                    }
                ]
            };
            await transporter.sendMail(mailOptions);
            res.json({ message: '予約が成功しました。確認メールを送信しました。' });
        } catch (err) {
            console.error('QRコード生成またはメール送信エラー:', err);
            res.status(500).json({ message: 'QRコード生成またはメール送信に失敗しました', error: err.message });
        }
    });
});

// その他のルート
app.get('/', (req, res) => {
    res.redirect('/admin');
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'admin.html'));
});

app.get('/guest/verify', (req, res) => {
    // QRコードによるゲスト認証ロジック
    const id = req.query.id;
    res.send(`ゲストID: ${id}`);
});

// 予約情報取得エンドポイント
app.get('/api/reservations', (req, res) => {
    const sql = 'SELECT * FROM reservations';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('予約情報取得エラー:', err.message);
            res.status(500).json({ message: '予約情報の取得に失敗しました', error: err.message });
            return;
        }
        res.json(results);
    });
});

// 予約情報を更新するエンドポイント
app.post('/api/reservations/:id', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    console.log(`Updating reservation with ID: ${id} to status: ${status}`);

    const sql = 'UPDATE reservations SET status = ? WHERE id = ?';
    connection.query(sql, [status, id], (err, results) => {
        if (err) {
            console.error('予約情報の更新エラー:', err.message);
            res.status(500).json({ message: '予約情報の更新に失敗しました', error: err.message });
            return;
        }
        res.json({ message: '予約情報が更新されました' });
    });
});

// 予約情報を削除するエンドポイント
app.delete('/api/reservations/:id', (req, res) => {
    const { id } = req.params;

    console.log(`Deleting reservation with ID: ${id}`);

    const sql = 'DELETE FROM reservations WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('予約削除エラー:', err.message);
            res.status(500).json({ message: '予約の削除に失敗しました', error: err.message });
            return;
        }
        res.json({ message: '予約が削除されました' });
    });
});

// 検索エンドポイント
app.get('/api/search', (req, res) => {
    const searchQuery = req.query.q;
    console.log('Received search query:', searchQuery);

    const sql = 'SELECT * FROM reservations WHERE name LIKE ? OR contact LIKE ?';
    const query = `%${searchQuery}%`;

    console.log('Executing SQL query:', sql);

    connection.query(sql, [query, query], (err, results) => {
        if (err) {
            console.error('検索クエリエラー:', err.message);
            res.status(500).send('サーバーエラー');
            return;
        }
        console.log('Search results:', results);
        res.json(results);
    });
});

// /api/attendance エンドポイントの追加
app.get('/api/attendance', (req, res) => {
    res.json({ count: attendanceCount });
});

// CORS設定を追加
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// 404 エラーハンドラー
app.use((req, res, next) => {
    res.status(404).send('ページが見つかりません');
});

app.listen(port, () => {
    console.log(`サーバーが http://localhost:${port} で起動しました`);
});
