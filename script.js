document.addEventListener('DOMContentLoaded', function() {
    // 確保所有元素存在
    const qualityInput = document.getElementById('quality');
    const bitSwitch = document.getElementById('bitSwitch');
    const imageInput = document.getElementById('imageInput');
    const compressButton = document.getElementById('compressButton');

    if (qualityInput) {
        qualityInput.addEventListener('input', function() {
            document.getElementById('qualityValue').textContent = this.value;
            updateEstimatedSize();
        });
    } else {
        console.error("Element with ID 'quality' not found.");
    }

    if (bitSwitch) {
        bitSwitch.addEventListener('change', function() {
            updateEstimatedSize();
        });
    } else {
        console.error("Element with ID 'bitSwitch' not found.");
    }

    if (imageInput) {
        imageInput.addEventListener('change', function() {
            document.getElementById('downloadLink').style.display = 'none';
            document.getElementById('downloadLink').href = '';
            document.getElementById('downloadLink').textContent = '';
            document.getElementById('progressBar').style.display = 'none';
            document.getElementById('progressBar').value = 0;
            document.getElementById('progressMessage').textContent = '';

            // 重置大小顯示
            document.getElementById('originalSize').textContent = `${formatFileSize(imageInput.files[0].size)}`;
            document.getElementById('estimatedSize').textContent = `-`;

            updateEstimatedSize();
        });
    } else {
        console.error("Element with ID 'imageInput' not found.");
    }

    if (compressButton) {
        compressButton.addEventListener('click', function() {
            const fileInput = document.getElementById('imageInput');
            const quality = document.getElementById('quality').value;
            const bitSwitchChecked = document.getElementById('bitSwitch').checked;
            const format = document.querySelector('input[name="format"]:checked').value;
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            const progressBar = document.getElementById('progressBar');
            const progressMessage = document.getElementById('progressMessage');

            if (fileInput.files.length === 0) {
                alert('Please select an image file.');
                return;
            }

            const file = fileInput.files[0];
            const reader = new FileReader();

            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    progressBar.style.display = 'block';
                    progressMessage.textContent = '0%';

                    // 隱藏下載鏈接
                    document.getElementById('downloadLink').style.display = 'none';

                    // Simulate compression progress
                    let progress = 0;
                    const interval = setInterval(() => {
                        progress += 1;
                        progressBar.value = progress;
                        progressMessage.textContent = `${progress}%`;

                        if (progress >= 100) {
                            clearInterval(interval);

                            let dataUrl;
                            if (bitSwitchChecked && format === 'png') {
                                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                                const rgba = imageData.data.buffer;
                                const png = UPNG.encode([rgba], canvas.width, canvas.height, 256);
                                dataUrl = URL.createObjectURL(new Blob([png], { type: 'image/png' }));
                            } else if (format === 'jpg') {
                                dataUrl = canvas.toDataURL('image/jpeg', quality / 100);
                            } else {
                                dataUrl = canvas.toDataURL('image/png', quality / 100);
                            }

                            console.log('Generated data URL:', dataUrl);

                            const downloadLink = document.getElementById('downloadLink');
                            downloadLink.href = dataUrl;
                            downloadLink.download = `compressed_image.${format}`;

                            downloadLink.style.display = 'block';
                            downloadLink.textContent = 'Download Compressed Image';

                            progressBar.style.display = 'none';
                            progressBar.value = 0;
                            progressMessage.textContent = 'All done! Your image is ready to download!';
                        }
                    }, 30); // Adjust the interval time for a smoother experience
                };
                img.src = event.target.result;
            };

            reader.readAsDataURL(file);
        });
    } else {
        console.error("Element with ID 'compressButton' not found.");
    }
});

// 定義 updateFormat 函數
function updateFormat() {
    const format = document.querySelector('input[name="format"]:checked').value;
    const qualitySection = document.getElementById('qualitySection');
    const bitSwitchSection = document.getElementById('bitSwitchSection');
    const bitSwitch = document.getElementById('bitSwitch');

    if (format === 'jpg') {
        qualitySection.classList.remove('hidden'); // 顯示質量選項
        bitSwitchSection.classList.add('hidden'); // 隱藏位開關選項
    } else if (format === 'png') {
        qualitySection.classList.add('hidden'); // 隱藏質量選項
        bitSwitch.checked = true; // 自動選中位開關
        bitSwitchSection.classList.remove('hidden'); // 顯示位開關選項
    } else {
        qualitySection.classList.add('hidden'); // 隱藏質量選項
        bitSwitchSection.classList.remove('hidden'); // 顯示位開關選項
    }

    updateEstimatedSize(); // 更新預估大小
}

function updateEstimatedSize() {
    const fileInput = document.getElementById('imageInput');
    const quality = document.getElementById('quality').value;
    const bitSwitch = document.getElementById('bitSwitch').checked;
    const format = document.querySelector('input[name="format"]:checked').value;
    const estimatedSizeElement = document.getElementById('estimatedSize');

    if (fileInput.files.length === 0) {
        estimatedSizeElement.textContent = '-';
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            let estimatedSize;
            if (bitSwitch && format === 'png') {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const rgba = imageData.data.buffer;
                const png = UPNG.encode([rgba], canvas.width, canvas.height, 256);
                estimatedSize = png.byteLength;
            } else if (format === 'jpg') {
                const dataUrl = canvas.toDataURL('image/jpeg', quality / 100);
                estimatedSize = dataURLToBlob(dataUrl).size;
            } else {
                const dataUrl = canvas.toDataURL('image/png', quality / 100);
                estimatedSize = dataURLToBlob(dataUrl).size;
            }

            // 使用 formatFileSize 函數格式化預估大小
            estimatedSizeElement.textContent = `${formatFileSize(estimatedSize)}`;
        };
        img.src = event.target.result;
    };

    // 在計算大小時顯示 loading...
    estimatedSizeElement.textContent = `loading...`;

    reader.readAsDataURL(file);
}

function dataURLToBlob(dataurl) {
    const arr = dataurl.split(',');
    if (arr.length !== 2) {
        throw new Error('Invalid data URL.');
    }

    const mime = arr[0].match(/:(.*?);/);
    if (!mime || mime.length < 2) {
        throw new Error('Invalid MIME type.');
    }

    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime[1] });
}

// 格式化文件大小的函數
function formatFileSize(size) {
    if (size > 1024 * 1024) { // 大於 1 MB
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    } else { // 小於或等於 1 MB
        return `${(size / 1024).toFixed(2)} KB`;
    }
}