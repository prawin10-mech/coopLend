const fs = require('fs');

async function run() {
    console.log('Reading repayments.xls...');
    const buffer = fs.readFileSync('repayments.xls');

    const formData = new FormData();
    formData.append('file', new Blob([buffer]), 'repayments.xls');

    console.log('Uploading to local API...');
    try {
        const res = await fetch('http://localhost:3000/api/repayments/upload', {
            method: 'POST',
            body: formData
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text.substring(0, 500));
    } catch (err) {
        console.error('Error:', err);
    }
}

run();
