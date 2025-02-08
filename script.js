document.addEventListener('DOMContentLoaded', function() {
    // 確保所有元素存在
    const qualityInput = document.getElementById('quality');
    const bitSwitch = document.getElementById('bitSwitch');
    const imageInput = document.getElementById('imageInput');
    const compressButton = document.getElementById('compressButton');

    // 初始隱藏 quality section
    const format = document.querySelector('input[name="format"]:checked').value;
    const qualitySection = document.getElementById('qualitySection');
    if (format === 'png') {
        qualitySection.classList.add('hidden');
    }

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
            const downloadLink = document.getElementById('downloadLink');
            const progressContainer = document.getElementById('progressContainer');
            
            if(downloadLink) {
                downloadLink.style.display = 'none';
                downloadLink.href = '';
                downloadLink.textContent = '';
            }
            
            if(progressContainer) {
                progressContainer.classList.remove('show');
                progressContainer.classList.add('hidden');
            }

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
            const progressContainer = document.getElementById('progressContainer');
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

                    // 初始化進度控制
                    let progress = 0;
                    
                    // 顯示進度條
                    if(progressContainer) {
                        progressContainer.classList.remove('hidden');
                        progressContainer.classList.add('show');
                    }
                    updateProgress(0);

                    const interval = setInterval(() => {
                        progress += 1;
                        updateProgress(progress);
                        
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
                            downloadLink.textContent = '下載';

                            // 隱藏進度條
                            progressContainer.classList.remove('show');
                            progressContainer.classList.add('hidden');

                            // 新增分享按鈕處理
                            const shareButton = document.getElementById('shareButton');
                            shareButton.style.display = 'block';
                            shareButton.onclick = async () => {
                                try {
                                    const blob = await fetch(dataUrl).then(r => r.blob());
                                    const file = new File([blob], `compressed_image.${format}`, { type: blob.type });
                                    
                                    if (navigator.share) {
                                        await navigator.share({
                                            files: [file],
                                            title: '壓縮圖片',
                                            text: '使用圖片壓縮工具生成的圖片'
                                        });
                                    } else {
                                        alert('您的瀏覽器不支援分享功能');
                                    }
                                } catch (error) {
                                    console.log('分享取消:', error);
                                }
                            };
                        }
                    }, 30);
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
        qualitySection.classList.remove('hidden');
    } else {
        qualitySection.classList.add('hidden');
    }

    if (format === 'png') {
        bitSwitch.checked = true; // 自動選中位開關
        bitSwitchSection.classList.remove('hidden'); // 顯示位開關選項
    } else {
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

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('fileInfo').style.display = 'flex';
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('originalSize').textContent = `${formatFileSize(file.size)}`;
        document.getElementById('estimatedSize').textContent = '計算中...';
        updateEstimatedSize();
    }
}

// 修改進度更新邏輯
function updateProgress(percentage) {
    const progressFill = document.getElementById('progressFill');
    const progressPercentage = document.getElementById('progressPercentage');
    
    progressFill.style.width = `${percentage}%`;
    progressPercentage.textContent = `${Math.min(100, Math.floor(percentage))}%`;
}