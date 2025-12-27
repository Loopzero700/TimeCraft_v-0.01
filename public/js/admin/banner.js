  document.addEventListener('DOMContentLoaded', () => {
    let cropper;
    let currentSlotId;
    let currentAspectRatio;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    document.querySelector('.banner-container').addEventListener('click', (event) => {
        const addButton = event.target.closest('.add-btn');
        if (!addButton) return;

        event.preventDefault();
        
        currentSlotId = addButton.dataset.slot;
        currentAspectRatio = parseFloat(eval(addButton.dataset.aspectRatio)) || 16 / 9;
        
        fileInput.click();
    });

    fileInput.addEventListener('change', (event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const reader = new FileReader();
            reader.onload = () => {
                showCropperModal(reader.result);
            };
            reader.readAsDataURL(files[0]);
        }
        event.target.value = ''; 
    });

    function showCropperModal(imageDataUrl) {
        Swal.fire({
            title: 'Crop Your Image',
            html: `<div style="max-height: 50vh;"><img id="cropper-image" src="${imageDataUrl}" style="max-width: 100%;"></div>`,
            confirmButtonText: 'Save Banner',
            showCancelButton: true,
            width: '800px',
             background: '#000', 
            color: '#fff',
            didOpen: () => {
                const image = document.getElementById('cropper-image');
                cropper = new Cropper(image, {
                    aspectRatio: currentAspectRatio,
                    viewMode: 1,
                });
            },
            preConfirm: () => {
                return new Promise((resolve) => {
                    const canvas = cropper.getCroppedCanvas({ width: 1280 })
                    canvas.toBlob((blob) => {
                        if (blob) uploadCroppedImage(blob)
                        resolve()
                    }, 'image/jpeg', 0.9)
                })
            },
            willClose: () => {
                if (cropper) cropper.destroy()
            }
        })
    }

    function uploadCroppedImage(blob) {
        const formData = new FormData()
        formData.append('bannerImage', blob, `${currentSlotId}.jpg`)
        formData.append('slotId', currentSlotId)

        Swal.fire({
            title: 'Uploading...',
            didOpen: () => Swal.showLoading(),
            allowOutsideClick: false
        });

        fetch('/admin/banners/upload', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: data.message,
                });
                
                const imgElement = document.querySelector(`img[data-img-slot="${currentSlotId}"]`)
                if (imgElement) {
                    imgElement.src = `${data.banner.image_url}?t=${new Date().getTime()}`
                }
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text: error.message || 'Something went wrong!',
            })
        })
    }
});