document.getElementById('reservation-form').addEventListener('submit', function(event) {
    event.preventDefault(); // フォームのデフォルト送信を防ぐ

    const formData = {
        name: document.getElementById('name').value,
        contact: document.getElementById('contact').value,
        relationship: document.getElementById('relationship').value
    };

    fetch('/api/reserve', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message); // サーバーからのメッセージを表示
    })
    .catch(error => {
        console.error('エラー:', error);
    });
});
