document.addEventListener('DOMContentLoaded', () => {
    fetchReservations();
    updateAttendance();
    startQRCodeScanner(); // QRコードスキャナーを開始
});

// 予約情報を取得して表示
function fetchReservations() {
    fetch('/api/reservations')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('reservation-table-body');
            tableBody.innerHTML = data.map(reservation => `
                <tr>
                    <td>${reservation.id}</td>
                    <td>${reservation.name}</td>
                    <td>${reservation.contact}</td>
                    <td>${reservation.status}</td>
                    <td>
                        <img src="/qr-codes/${reservation.id}.png" alt="QRコード" class="qr-code" />
                    </td>
                    <td>
                        <button onclick="updateStatus(${reservation.id}, 'approved')">承認</button>
                        <button onclick="deleteReservation(${reservation.id})">削除</button>
                    </td>
                </tr>
            `).join('');
        })
        .catch(error => console.error('予約情報の取得エラー:', error));
}

// 状態更新処理
function updateStatus(id, status) {
    fetch(`/api/reservations/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    })
    .then(response => response.text())
    .then(message => {
        alert(message);
        fetchReservations(); // 更新後に再取得
    })
    .catch(error => console.error('状態更新エラー:', error));
}

// 予約削除処理
function deleteReservation(id) {
    fetch(`/api/reservations/${id}`, { method: 'DELETE' })
    .then(response => response.text())
    .then(message => {
        alert(message);
        fetchReservations(); // 更新後に再取得
    })
    .catch(error => console.error('予約削除エラー:', error));
}

// ゲスト検索を実行する
function searchGuests() {
    const query = document.getElementById('search-query').value;
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(results => {
            const resultsDiv = document.getElementById('search-results');
            resultsDiv.innerHTML = results.map(guest => `
                <div>
                    <p>ID: ${guest.id}</p>
                    <p>名前: ${guest.name}</p>
                    <p>連絡先: ${guest.contact}</p>
                    <p>状態: ${guest.status}</p>
                </div>
            `).join('');
        })
        .catch(error => console.error('ゲスト検索エラー:', error));
}

// リアルタイム入場者数を更新する
function updateAttendance() {
    fetch('/api/attendance')
        .then(response => response.json())
        .then(data => {
            const attendanceCount = document.getElementById('attendance-count');
            attendanceCount.textContent = `現在の入場者数: ${data.count}`;
        })
        .catch(error => console.error('入場者数更新エラー:', error));
}

// QRコードスキャナーを開始する
function startQRCodeScanner() {
    const html5QrCode = new Html5Qrcode("reader");

    html5QrCode.start(
        { facingMode: "environment" },
        {
            fps: 10,    // フレームレート (1秒あたりのフレーム数)
            qrbox: 250  // QRコードの検出領域のサイズ (px)
        },
        qrCodeMessage => {
            // QRコードが検出されたときの処理
            document.getElementById('result').textContent = `QRコードの内容: ${qrCodeMessage}`;
            // ここにQRコードスキャン後の追加処理を実装
        },
        errorMessage => {
            // QRコードが検出されなかったときの処理
            console.error('QRコード検出エラー:', errorMessage);
        })
    .catch(err => {
        console.error('QRコードスキャナー起動エラー:', err);
    });
}
