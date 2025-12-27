    const form = document.getElementById('edit-brand-form');
    const brandNameInput = document.getElementById('brandName');
    const fileInput = document.getElementById('brandImageInput');
    const preview = document.getElementById('image-preview');
    const modal = document.getElementById('cropper-modal');
    const imageToCrop = document.getElementById('image-to-crop');
    const cropButton = document.getElementById('crop-button');

    let cropper;
    let croppedBlob = null; 

    
    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const reader = new FileReader();
            reader.onload = () => {
                imageToCrop.src = reader.result;
                modal.style.display = 'flex';
                if (cropper) cropper.destroy();
                cropper = new Cropper(imageToCrop, { aspectRatio: 1 / 1, viewMode: 1 });
            };

            reader.readAsDataURL(files[0]);
        }
    });
    
    cropButton.addEventListener('click', () => {
        cropper.getCroppedCanvas({ width: 500, height: 500 }).toBlob((blob) => {
            croppedBlob = blob;
            preview.src = URL.createObjectURL(blob); 
        }, 'image/png');
        modal.style.display = 'none';
        cropper.destroy();
    });

    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('brandName', brandNameInput.value);
        
      
        if (croppedBlob) {
            formData.append('brandImage', croppedBlob, 'brand-logo-updated.webp');
        }

        try {
        
            const response = await fetch(url, { 
                method: 'PATCH',
                body: formData 
            });

            if (response.ok) {
                window.location.href = '/admin/brand';
            } else {
                const errorText = await response.text();
                Swal.fire('Error', errorText, 'error');
            }
        } catch (error) {
            console.log(error)
            Swal.fire('Error', 'An error occurred while updating.', 'error');
        }
    });